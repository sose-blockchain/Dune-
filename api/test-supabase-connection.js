const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 연결 테스트
async function testSupabaseConnection() {
  console.log('🔍 환경변수 확인:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 누락');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다!');
    console.log('\n📋 필요한 환경변수:');
    console.log('SUPABASE_URL=https://your-project.supabase.co');
    console.log('SUPABASE_ANON_KEY=your-anon-key');
    return;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('\n🔗 Supabase 연결 테스트 중...');

    // 1. 기본 연결 테스트
    const { data: connectionTest, error: connectionError } = await supabase
      .from('analyzed_queries')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ 연결 실패:', connectionError.message);
      return;
    }

    console.log('✅ Supabase 연결 성공!');

    // 2. sql_errors 테이블 존재 확인
    console.log('\n📊 sql_errors 테이블 확인 중...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('sql_errors')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ sql_errors 테이블이 존재하지 않습니다:', tableError.message);
      console.log('\n🛠️ 해결 방법:');
      console.log('1. Supabase Dashboard → SQL Editor로 이동');
      console.log('2. database-schema-sql-errors.sql 파일의 내용을 복사하여 실행');
      return;
    }

    console.log('✅ sql_errors 테이블 존재 확인');

    // 3. 테스트 데이터 삽입
    console.log('\n💾 테스트 데이터 삽입 중...');
    const testData = {
      original_sql: 'SELECT * FROM non_existent_table',
      error_message: 'Table "non_existent_table" does not exist',
      error_type: 'table_not_found',
      user_intent: 'Connection test'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('sql_errors')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 데이터 삽입 실패:', insertError.message);
      return;
    }

    console.log('✅ 테스트 데이터 삽입 성공:', insertData.id);

    // 4. 삽입된 데이터 확인
    console.log('\n📖 삽입된 데이터 확인 중...');
    const { data: selectData, error: selectError } = await supabase
      .from('sql_errors')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError.message);
      return;
    }

    console.log('✅ 데이터 조회 성공:', {
      id: selectData.id,
      original_sql: selectData.original_sql.substring(0, 50) + '...',
      error_type: selectData.error_type
    });

    // 5. 테스트 데이터 삭제
    console.log('\n🗑️ 테스트 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('sql_errors')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.error('❌ 데이터 삭제 실패:', deleteError.message);
      return;
    }

    console.log('✅ 테스트 데이터 삭제 성공');
    console.log('\n🎉 모든 테스트 통과! Supabase 연결이 정상적으로 작동합니다.');

  } catch (error) {
    console.error('❌ 예외 발생:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
