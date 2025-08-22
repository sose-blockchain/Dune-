const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
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
    return res.status(405).json({
      success: false,
      error: 'POST 메서드만 지원됩니다.'
    });
  }

  try {
    console.log('📚 SQL 생성 히스토리 저장 요청 받음');

    const { 
      userQuery,
      userSession,
      generatedSQL,
      aiExplanation,
      aiConfidence,
      relatedQueriesUsed,
      detectedBlockchain,
      detectedProtocols,
      userFeedback,
      executionResult,
      executionErrorId
    } = req.body;

    if (!userQuery || !generatedSQL) {
      return res.status(400).json({
        success: false,
        error: '사용자 쿼리와 생성된 SQL이 필요합니다.'
      });
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 연결 실패'
      });
    }

    // 히스토리 데이터 생성
    const historyData = {
      user_query: userQuery,
      user_session: userSession || `session_${Date.now()}`,
      generated_sql: generatedSQL,
      ai_explanation: aiExplanation || null,
      ai_confidence: aiConfidence || null,
      related_queries_used: relatedQueriesUsed || [],
      detected_blockchain: detectedBlockchain || null,
      detected_protocols: detectedProtocols || [],
      user_feedback: userFeedback || null,
      execution_result: executionResult || 'not_tested',
      execution_error_id: executionErrorId || null
    };

    console.log('💾 히스토리 저장 중:', {
      userSession: historyData.user_session,
      detectedBlockchain: historyData.detected_blockchain,
      relatedQueriesCount: historyData.related_queries_used.length
    });

    // 데이터베이스에 저장
    const { data: savedHistory, error: saveError } = await supabase
      .from('sql_generation_history')
      .insert([historyData])
      .select()
      .single();

    if (saveError) {
      console.error('❌ 히스토리 저장 실패:', saveError);
      return res.status(500).json({
        success: false,
        error: '히스토리 저장 실패'
      });
    }

    console.log('✅ SQL 생성 히스토리 저장 완료:', {
      id: savedHistory.id,
      session: savedHistory.user_session
    });

    res.status(200).json({
      success: true,
      data: {
        id: savedHistory.id,
        userSession: savedHistory.user_session,
        createdAt: savedHistory.created_at
      }
    });

  } catch (error) {
    console.error('❌ 히스토리 저장 중 오류:', error);
    res.status(500).json({
      success: false,
      error: `히스토리 저장 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
