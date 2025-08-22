const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('🔍 Supabase 환경 변수 확인:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined',
      keyStartsWith: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined'
    });

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      });
    }

    // Supabase 클라이언트 생성 테스트
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 연결 테스트: analyzed_queries 테이블에서 데이터 조회
    const { data, error, count } = await supabase
      .from('analyzed_queries')
      .select('id, dune_query_id, created_at', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Supabase 연결 오류:', error);
      return res.status(500).json({
        success: false,
        error: 'Supabase 연결 실패',
        details: error.message,
        code: error.code
      });
    }

    console.log('✅ Supabase 연결 성공, 데이터 조회 완료');

    return res.status(200).json({
      success: true,
      message: 'Supabase 연결이 정상적으로 작동합니다.',
      data: {
        totalRecords: count,
        sampleData: data,
        connectionTest: 'passed'
      }
    });

  } catch (error) {
    console.error('💥 예상치 못한 오류:', error);
    return res.status(500).json({
      success: false,
      error: '디버깅 중 오류 발생',
      details: error.message
    });
  }
};
