const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Supabase 연결 디버깅 API
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'GET 또는 POST 메서드만 지원됩니다.'
    });
  }

  try {
    console.log('🔍 Supabase 연결 디버깅 시작');

    const debugResult = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      envVarsStatus: {},
      connectionTest: {},
      tableTests: {}
    };

    // 1. 환경변수 확인
    debugResult.envVarsStatus = {
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 누락',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'
    };

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 환경변수가 설정되지 않았습니다.',
        debug: debugResult
      });
    }

    // 2. Supabase 클라이언트 생성
    let supabase;
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
      debugResult.connectionTest.clientCreation = '✅ 성공';
    } catch (clientError) {
      debugResult.connectionTest.clientCreation = `❌ 실패: ${clientError.message}`;
      return res.status(500).json({
        success: false,
        error: 'Supabase 클라이언트 생성 실패',
        debug: debugResult
      });
    }

    // 3. analyzed_queries 테이블 연결 테스트
    try {
      const { data, error } = await supabase
        .from('analyzed_queries')
        .select('count')
        .limit(1);

      if (error) {
        debugResult.tableTests.analyzed_queries = `❌ 실패: ${error.message}`;
      } else {
        debugResult.tableTests.analyzed_queries = '✅ 성공';
      }
    } catch (testError) {
      debugResult.tableTests.analyzed_queries = `❌ 예외: ${testError.message}`;
    }

    // 4. sql_errors 테이블 존재 확인
    try {
      const { data, error } = await supabase
        .from('sql_errors')
        .select('count')
        .limit(1);

      if (error) {
        debugResult.tableTests.sql_errors = `❌ 테이블 없음: ${error.message}`;
        debugResult.tableTests.sql_errors_solution = '🛠️ database-schema-sql-errors.sql을 실행하세요';
      } else {
        debugResult.tableTests.sql_errors = '✅ 테이블 존재';
      }
    } catch (testError) {
      debugResult.tableTests.sql_errors = `❌ 예외: ${testError.message}`;
    }

    // 5. POST 요청인 경우 실제 데이터 삽입 테스트
    if (req.method === 'POST') {
      console.log('💾 실제 데이터 삽입 테스트 시작');
      
      const originalSQL = 'SELECT * FROM test_connection_table';
      const errorMessage = 'Connection test error message';
      const errorHash = crypto
        .createHash('sha256')
        .update(originalSQL + '|||' + errorMessage)
        .digest('hex');
      
      const testData = {
        error_hash: errorHash,
        original_sql: originalSQL,
        error_message: errorMessage,
        error_type: 'connection_test',
        user_intent: 'API connection test from ' + new Date().toISOString()
      };

      try {
        const { data: insertData, error: insertError } = await supabase
          .from('sql_errors')
          .insert([testData])
          .select()
          .single();

        if (insertError) {
          debugResult.insertTest = `❌ 삽입 실패: ${insertError.message}`;
        } else {
          debugResult.insertTest = `✅ 삽입 성공 (ID: ${insertData.id})`;
          
          // 삽입된 데이터 즉시 삭제
          const { error: deleteError } = await supabase
            .from('sql_errors')
            .delete()
            .eq('id', insertData.id);

          debugResult.deleteTest = deleteError 
            ? `⚠️ 삭제 실패: ${deleteError.message}` 
            : '✅ 삭제 성공';
        }
      } catch (insertTestError) {
        debugResult.insertTest = `❌ 삽입 예외: ${insertTestError.message}`;
      }
    }

    // 6. 결과 요약
    const hasErrors = Object.values(debugResult.tableTests).some(test => test.includes('❌'));
    const overallStatus = hasErrors ? 'warning' : 'success';

    console.log('📊 Supabase 디버깅 결과:', debugResult);

    res.status(200).json({
      success: !hasErrors,
      status: overallStatus,
      data: debugResult,
      message: hasErrors 
        ? 'Supabase 연결에 문제가 있습니다. sql_errors 테이블을 생성해야 할 수 있습니다.'
        : 'Supabase 연결이 정상적으로 작동합니다.'
    });

  } catch (error) {
    console.error('❌ Supabase 디버깅 실패:', error);
    res.status(500).json({
      success: false,
      error: `Supabase 디버깅 중 오류가 발생했습니다: ${error.message}`,
      stack: error.stack
    });
  }
};