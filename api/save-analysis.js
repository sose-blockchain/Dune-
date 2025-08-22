const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// UPSERT 방식으로 단순화 - 복잡한 중복 체크 로직 제거

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
    console.log('📥 save-analysis 요청 받음:', {
      method: req.method,
      body: req.body ? Object.keys(req.body) : 'No body',
      timestamp: new Date().toISOString()
    });

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
    console.log('🔄 Supabase 클라이언트 생성 시도...');
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

    // 안전한 데이터 접근을 위한 처리
    const safeAnalysisResult = analysisResult || {};
    
    // 데이터베이스에 저장할 데이터 준비
    const insertData = {
      dune_query_id: duneQueryId,
      dune_url: duneUrl || `https://dune.com/queries/${duneQueryId}`,
      title: title || `Dune Query ${duneQueryId}`,
      description: description || "SQL 쿼리 분석",
      category: category || "general",
      raw_query: rawQuery,
      commented_query: safeAnalysisResult.commentedQuery || rawQuery,
      summary: safeAnalysisResult.summary || "SQL 쿼리 분석이 완료되었습니다.",
      key_features: Array.isArray(safeAnalysisResult.keyFeatures) ? safeAnalysisResult.keyFeatures : [],
      blockchain_type: safeAnalysisResult.blockchainType || null,
      project_name: safeAnalysisResult.projectName || null,
      project_category: safeAnalysisResult.projectCategory || "analytics",
      tags: Array.isArray(tags) ? tags : [],
      analysis_metadata: { 
        originalAnalysisResult: safeAnalysisResult,
        processedAt: new Date().toISOString(),
        apiVersion: "v1"
      }
    };

    console.log('📋 준비된 저장 데이터:', {
      dune_query_id: insertData.dune_query_id,
      hasCommentedQuery: !!insertData.commented_query,
      keyFeaturesCount: insertData.key_features.length,
      blockchainType: insertData.blockchain_type,
      projectName: insertData.project_name
    });

    console.log(`📊 Supabase 저장 시작 - Query ID: ${duneQueryId}`);
    
    // 간단한 UPSERT 방식 사용 (PostgreSQL의 ON CONFLICT 활용)
    const { data: upsertData, error: upsertError } = await supabase
      .from('analyzed_queries')
      .upsert(
        {
          ...insertData,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'dune_query_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('❌ UPSERT 실패:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint
      });
      return res.status(500).json({
        success: false,
        error: `데이터베이스 저장 실패: ${upsertError.message}`
      });
    }

    console.log('✅ UPSERT 성공:', upsertData);

    // 기존 데이터 확인하여 action 결정
    let action = 'created';
    const { data: existingCheck } = await supabase
      .from('analyzed_queries')
      .select('created_at, updated_at')
      .eq('dune_query_id', duneQueryId)
      .single();

    if (existingCheck && existingCheck.created_at !== existingCheck.updated_at) {
      action = 'updated';
    }

    const finalResult = upsertData;

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
    console.error('❌ 분석 결과 저장 오류:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: `분석 결과 저장 중 오류가 발생했습니다: ${error.message}`,
      details: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    });
  }
};
