const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 업데이트 필요 여부 판단 함수
async function shouldUpdateExistingData(existingData, newData) {
  try {
    // 1. SQL 쿼리가 변경된 경우
    if (existingData.raw_query !== newData.raw_query) {
      return {
        update: true,
        reason: 'SQL 쿼리 내용이 변경됨'
      };
    }

    // 2. 분석 품질이 향상된 경우 (더 많은 주석이나 상세한 분석)
    const existingCommented = existingData.analysis_metadata?.originalAnalysisResult?.commentedQuery || '';
    const newCommented = newData.analysis_metadata?.originalAnalysisResult?.commentedQuery || '';
    
    if (newCommented.length > existingCommented.length * 1.2) { // 20% 이상 더 상세함
      return {
        update: true,
        reason: '분석 품질 향상 (더 상세한 주석)'
      };
    }

    // 3. 블록체인/프로젝트 정보가 새로 추가된 경우
    const existingHasProject = !!(existingData.blockchain_type || existingData.project_name);
    const newHasProject = !!(newData.blockchain_type || newData.project_name);
    
    if (!existingHasProject && newHasProject) {
      return {
        update: true,
        reason: '블록체인/프로젝트 정보 추가'
      };
    }

    // 4. 30일 이상 오래된 분석인 경우 (재분석 권장)
    const daysSinceLastUpdate = (new Date() - new Date(existingData.updated_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUpdate > 30) {
      return {
        update: true,
        reason: `오래된 분석 갱신 (${Math.floor(daysSinceLastUpdate)}일 전)`
      };
    }

    // 업데이트 불필요
    return {
      update: false,
      reason: '기존 분석이 충분히 최신이고 상세함'
    };

  } catch (error) {
    console.error('업데이트 판단 중 오류:', error);
    // 오류 시 안전하게 업데이트 수행
    return {
      update: true,
      reason: '판단 오류로 인한 안전 업데이트'
    };
  }
}

// Supabase 클라이언트 초기화 (동적으로 생성)
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Supabase 환경 변수 체크:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined'
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false // Vercel 서버리스 환경에서는 세션 유지 비활성화
      }
    });
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error.message);
    return null;
  }
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { 
      duneQueryId, 
      duneUrl, 
      title, 
      description, 
      category, 
      difficultyLevel, 
      tags, 
      rawQuery, 
      analysisResult 
    } = req.body;

    // 필수 필드 검증
    if (!duneQueryId || !rawQuery || !analysisResult) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다: duneQueryId, rawQuery, analysisResult'
      });
    }

    // Supabase 클라이언트 동적 생성
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      // Supabase 연결 실패 시 로그만 출력
      console.log(`⚠️ Supabase 연결 불가 - 로그로만 기록: ${duneQueryId}`);
      return res.status(200).json({
        success: true,
        data: { id: `log_${duneQueryId}_${Date.now()}`, duneQueryId },
        message: 'Supabase 연결 불가로 로그만 기록되었습니다.'
      });
    }

    // 데이터베이스에 저장할 데이터 준비
    const insertData = {
      dune_query_id: duneQueryId,
      dune_url: duneUrl || `https://dune.com/queries/${duneQueryId}`,
      title: title || `Dune Query ${duneQueryId}`,
      description: description || "SQL 쿼리 분석",
      category: category || "general",
      raw_query: rawQuery,
      commented_query: analysisResult.commentedQuery || rawQuery,
      summary: analysisResult.summary || "SQL 쿼리 분석이 완료되었습니다.",
      key_features: analysisResult.keyFeatures || [],
      blockchain_type: analysisResult.blockchainType || null,
      project_name: analysisResult.projectName || null,
      project_category: analysisResult.projectCategory || "analytics",
      tags: tags || [],
      analysis_metadata: { 
        originalAnalysisResult: analysisResult,
        processedAt: new Date().toISOString(),
        apiVersion: "v1"
      }
    };

    console.log(`📊 Supabase 저장 시작 - Query ID: ${duneQueryId}`);
    
    // 1단계: 기존 데이터 확인 및 중복 체크
    const { data: existingData, error: checkError } = await supabase
      .from('analyzed_queries')
      .select('id, raw_query, analysis_metadata, created_at, updated_at')
      .eq('dune_query_id', duneQueryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ 기존 데이터 확인 실패:', checkError.message);
      return res.status(500).json({
        success: false,
        error: `데이터베이스 조회 실패: ${checkError.message}`
      });
    }

    let finalResult;
    let action = 'created';

    if (existingData) {
      // 기존 데이터가 있는 경우 - 중복 체크 및 개선 여부 판단
      console.log(`🔍 기존 데이터 발견 - Query ID: ${duneQueryId}`);
      
      const shouldUpdate = await shouldUpdateExistingData(existingData, insertData);
      
      if (shouldUpdate.update) {
        console.log(`🔄 데이터 업데이트 사유: ${shouldUpdate.reason}`);
        
        // 업데이트 수행
        const { data: updatedData, error: updateError } = await supabase
          .from('analyzed_queries')
          .update({
            ...insertData,
            updated_at: new Date().toISOString(),
            analysis_metadata: {
              ...insertData.analysis_metadata,
              updateReason: shouldUpdate.reason,
              previousVersion: existingData.analysis_metadata
            }
          })
          .eq('dune_query_id', duneQueryId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ 업데이트 실패:', updateError.message);
          return res.status(500).json({
            success: false,
            error: '데이터베이스 업데이트 실패했습니다.'
          });
        }

        finalResult = updatedData;
        action = 'updated';
      } else {
        console.log(`⏭️ 업데이트 불필요: ${shouldUpdate.reason}`);
        // 기존 데이터 반환
        finalResult = existingData;
        action = 'skipped';
      }
    } else {
      // 새로운 데이터 삽입
      console.log(`➕ 신규 데이터 삽입 - Query ID: ${duneQueryId}`);
      
      const { data: newData, error: insertError } = await supabase
        .from('analyzed_queries')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ 신규 데이터 삽입 실패:', insertError.message);
        return res.status(500).json({
          success: false,
          error: `데이터베이스 저장 실패: ${insertError.message}`
        });
      }

      finalResult = newData;
      action = 'created';
    }

    // 중복 제거 및 최적화 로직 수행 완료
    console.log(`✅ Supabase 처리 완료 - ID: ${finalResult.id}, Query: ${duneQueryId}, Action: ${action}`);
    
    // 성공 응답 (액션에 따른 메시지 변경)
    const messages = {
      created: '새로운 분석 결과가 데이터베이스에 저장되었습니다.',
      updated: '기존 분석 결과가 개선된 내용으로 업데이트되었습니다.',
      skipped: '기존 분석 결과가 충분히 최신이어서 중복 저장을 방지했습니다.'
    };

    res.status(200).json({
      success: true,
      data: {
        id: finalResult.id,
        duneQueryId: finalResult.dune_query_id || duneQueryId,
        title: finalResult.title || `Dune Query ${duneQueryId}`,
        blockchainType: finalResult.blockchain_type,
        projectName: finalResult.project_name,
        projectCategory: finalResult.project_category,
        savedAt: action === 'updated' ? finalResult.updated_at : finalResult.created_at,
        action: action
      },
      message: messages[action]
    });

  } catch (error) {
    console.error('분석 결과 저장 오류:', error.message);
    
    res.status(500).json({
      success: false,
      error: '분석 결과 저장 중 오류가 발생했습니다.'
    });
  }
};
