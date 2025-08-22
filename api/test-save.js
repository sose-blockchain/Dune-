const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Supabase 환경 변수 체크:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing'
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수 누락');
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    
    console.log('✅ Supabase 클라이언트 생성 성공');
    return supabase;
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error.message);
    return null;
  }
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 테스트 저장 API 호출됨');
    
    // Supabase 클라이언트 생성
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 연결 실패'
      });
    }

    // 테스트 데이터 생성
    const testData = {
      dune_query_id: `test_${Date.now()}`,
      dune_url: 'https://dune.com/queries/test',
      title: '테스트 쿼리',
      description: 'API 테스트용 쿼리',
      category: 'test',
      raw_query: 'SELECT * FROM test;',
      commented_query: '-- 테스트 쿼리\nSELECT * FROM test;',
      summary: 'API 연결 테스트',
      key_features: ['테스트'],
      blockchain_type: 'ethereum',
      project_name: 'test-project',
      project_category: 'analytics',
      tags: ['test'],
      analysis_metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('📊 테스트 데이터 삽입 시도...');

    // 데이터 삽입
    const { data, error } = await supabase
      .from('analyzed_queries')
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('❌ 테스트 저장 실패:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error
      });
    }

    console.log('✅ 테스트 저장 성공:', data);

    res.status(200).json({
      success: true,
      data: data,
      message: '테스트 데이터 저장 성공'
    });

  } catch (error) {
    console.error('❌ 테스트 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
