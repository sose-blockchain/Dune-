const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
    
    // Supabase에 데이터 삽입
    const { data, error } = await supabase
      .from('analyzed_queries')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase 저장 실패:', error.message);
      
      // 중복 키 오류인 경우 업데이트 시도
      if (error.code === '23505') { // unique_violation
        console.log(`🔄 기존 데이터 업데이트 시도: ${duneQueryId}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('analyzed_queries')
          .update({
            ...insertData,
            updated_at: new Date().toISOString()
          })
          .eq('dune_query_id', duneQueryId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ 업데이트도 실패:', updateError.message);
          return res.status(500).json({
            success: false,
            error: '데이터베이스 저장 및 업데이트 모두 실패했습니다.'
          });
        }

        console.log(`✅ 기존 데이터 업데이트 완료: ${duneQueryId}`);
        return res.status(200).json({
          success: true,
          data: {
            id: updateData.id,
            duneQueryId: updateData.dune_query_id,
            title: updateData.title,
            savedAt: updateData.updated_at,
            action: 'updated'
          },
          message: '기존 분석 데이터가 업데이트되었습니다.'
        });
      }

      return res.status(500).json({
        success: false,
        error: `데이터베이스 저장 실패: ${error.message}`
      });
    }

    console.log(`✅ Supabase 저장 완료 - ID: ${data.id}, Query: ${duneQueryId}`);
    
    // 성공 응답
    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        duneQueryId: data.dune_query_id,
        title: data.title,
        blockchainType: data.blockchain_type,
        projectName: data.project_name,
        projectCategory: data.project_category,
        savedAt: data.created_at,
        action: 'created'
      },
      message: '분석 결과가 데이터베이스에 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('분석 결과 저장 오류:', error.message);
    
    res.status(500).json({
      success: false,
      error: '분석 결과 저장 중 오류가 발생했습니다.'
    });
  }
};
