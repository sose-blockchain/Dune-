const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수 누락');
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

// 오류 해시 생성
function generateErrorHash(originalSQL, errorMessage) {
  return crypto
    .createHash('sha256')
    .update(originalSQL + '|||' + errorMessage)
    .digest('hex');
}

// 오류 타입 감지
function detectErrorType(errorMessage) {
  const errorMessage_lower = errorMessage.toLowerCase();
  
  // 결과 없음 케이스 (특별 처리 필요)
  if (errorMessage_lower.includes('no results from query') || 
      errorMessage_lower.includes('query returned no rows') ||
      errorMessage_lower.includes('no data found') ||
      errorMessage_lower.includes('empty result')) {
    return 'no_results';
  }
  
  // 문법 오류
  if (errorMessage_lower.includes('syntax error') || errorMessage_lower.includes('syntax')) {
    return 'syntax_error';
  }
  
  // 테이블/컬럼 관련 오류
  if (errorMessage_lower.includes('table') && errorMessage_lower.includes('not found')) {
    return 'table_not_found';
  }
  if (errorMessage_lower.includes('column') && errorMessage_lower.includes('not found')) {
    return 'column_not_found';
  }
  if (errorMessage_lower.includes('relation') && errorMessage_lower.includes('does not exist')) {
    return 'table_not_found';
  }
  
  // 권한/접근 오류
  if (errorMessage_lower.includes('permission') || errorMessage_lower.includes('access')) {
    return 'permission_error';
  }
  
  // 성능 관련 오류
  if (errorMessage_lower.includes('timeout')) {
    return 'timeout_error';
  }
  if (errorMessage_lower.includes('limit') || errorMessage_lower.includes('exceeded')) {
    return 'limit_exceeded';
  }
  
  // 집계 관련 오류
  if (errorMessage_lower.includes('must appear in') && errorMessage_lower.includes('group by')) {
    return 'aggregation_error';
  }
  
  return 'unknown_error';
}

// SQL 오류 저장
async function saveSQLError(supabase, originalSQL, errorMessage, fixedSQL, fixExplanation, fixChanges, userContext) {
  try {
    console.log('💾 SQL 오류 저장 시작');
    
    // 오류 해시 및 분석 정보 생성
    const errorHash = generateErrorHash(originalSQL, errorMessage);
    const errorType = detectErrorType(errorMessage);
    
    console.log('📊 오류 분석:', {
      errorHash: errorHash.substring(0, 8) + '...',
      errorType,
      originalSQLLength: originalSQL.length,
      errorMessageLength: errorMessage.length
    });
    
    const { data, error } = await supabase
      .from('sql_errors')
      .insert([{
        error_hash: errorHash,
        original_sql: originalSQL,
        error_message: errorMessage,
        fixed_sql: fixedSQL,
        fix_explanation: fixExplanation,
        fix_changes: fixChanges || [],
        error_type: errorType,
        user_intent: userContext || null,
        occurrence_count: 1,
        last_occurrence: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ SQL 오류 저장 실패:', error);
      return null;
    }

    console.log('✅ SQL 오류 저장 완료:', data.id);
    return data;
  } catch (error) {
    console.error('❌ SQL 오류 저장 중 예외:', error);
    return null;
  }
}

// Claude API 호출
async function callClaudeAPI(prompt) {
  try {
    console.log('🔑 Claude API 키 상태:', !!process.env.CLAUDE_API_KEY ? '존재함' : '없음');
    
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API 키가 설정되지 않았습니다.');
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 4000,
      temperature: 0.3,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    console.log('✅ Claude API 성공 응답 받음');
    return response.data.content[0].text;
  } catch (error) {
    console.error('❌ Claude API 호출 실패:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response) {
      console.log(`⚠️ Claude API ${error.response.status} 오류`);
    } else if (error.request) {
      console.log('⚠️ Claude API 서버 연결 실패');
    } else {
      console.log('⚠️ Claude API 요청 설정 오류');
    }
    
    throw error;
  }
}

// "No results" 케이스를 위한 특별 분석 프롬프트
function createNoResultsAnalysisPrompt(originalSQL, errorMessage, userContext) {
  return `당신은 Dune Analytics 데이터 분석 전문가입니다. 

사용자의 SQL 쿼리가 실행은 되었지만 결과가 없습니다:

원본 SQL:
\`\`\`sql
${originalSQL}
\`\`\`

결과:
\`\`\`
${errorMessage}
\`\`\`

사용자 의도:
${userContext || '명시되지 않음'}

"No results" 문제의 일반적인 원인과 해결책:

1. **시간 범위 문제**: 너무 최근이거나 과거의 데이터를 조회
   - 해결: 더 넓은 시간 범위 사용 (예: 지난 30일, 90일)

2. **필터 조건이 너무 엄격**: WHERE 조건이 너무 까다로움
   - 해결: WHERE 조건을 완화하거나 단계별로 확인

3. **테이블/프로토콜 선택 문제**: 활동이 적은 프로토콜이나 테이블
   - 해결: 더 활발한 프로토콜이나 메인 테이블 사용

4. **JOIN 조건 문제**: INNER JOIN으로 인한 데이터 손실
   - 해결: LEFT JOIN 사용이나 JOIN 조건 검토

5. **대소문자/문자열 매칭 문제**: 정확한 문자열 매칭 실패
   - 해결: LOWER() 함수 사용이나 LIKE 패턴 매칭

6. **데이터 가용성 문제**: 해당 블록체인/프로토콜에 데이터 부족
   - 해결: 다른 블록체인이나 프로토콜 시도

다음 JSON 형태로만 응답해주세요:
{
  "revisedSQL": "개선된 SQL 쿼리 (더 넓은 조건으로)",
  "explanation": "결과가 없었던 가능한 이유와 개선 방향",
  "analysisSteps": [
    "1단계: 시간 범위 확대 (예: 지난 30일)",
    "2단계: 필터 조건 완화",
    "3단계: 더 활발한 프로토콜/테이블 사용"
  ],
  "alternativeQueries": [
    "대안 쿼리 1: 다른 접근 방식",
    "대안 쿼리 2: 다른 데이터 소스 활용"
  ],
  "dataValidationSuggestions": [
    "데이터 존재 여부 확인 방법",
    "단계별 디버깅 팁"
  ]
}`;
}

// 일반 오류 수정 프롬프트 (문법/구조적 오류용)S
function createErrorFixPrompt(originalSQL, errorMessage, userContext) {
  return `당신은 Dune Analytics SQL 오류 수정 전문가입니다. 

다음 SQL 쿼리에서 오류가 발생했습니다:

원본 SQL:
\`\`\`sql
${originalSQL}
\`\`\`

Dune 오류 메시지:
\`\`\`
${errorMessage}
\`\`\`

추가 컨텍스트:
${userContext || '없음'}

일반적인 Dune Analytics 오류 유형:
1. 테이블명 오류 (예: ethereum.transactions → ethereum.core.transactions)
2. 컬럼명 오류 (예: value → value_eth)
3. 문법 오류 (PostgreSQL 문법 사용)
4. 날짜 형식 오류
5. 집계 함수 사용 오류
6. JOIN 조건 오류

다음 JSON 형태로만 응답해주세요:
{
  "fixedSQL": "수정된 SQL 쿼리",
  "explanation": "수정 사항에 대한 상세 설명",
  "changes": [
    "변경사항 1: 원인과 해결책",
    "변경사항 2: 원인과 해결책"
  ],
  "commonMistakes": [
    "이런 종류의 일반적인 실수들"
  ],
  "testingSuggestions": [
    "수정된 쿼리 테스트 방법"
  ]
}`;
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
    console.log('🔧 SQL 오류 수정 요청 받음');

    const { originalSQL, errorMessage, userContext } = req.body;

    if (!originalSQL || !errorMessage) {
      return res.status(400).json({
        success: false,
        error: '원본 SQL과 오류 메시지가 필요합니다.'
      });
    }

    console.log('🧠 Claude AI로 SQL 오류 수정 중...');
    console.log('📝 원본 SQL 길이:', originalSQL.length);
    console.log('⚠️ 오류 메시지:', errorMessage.substring(0, 100) + '...');
    console.log('📝 사용자 컨텍스트:', userContext || '없음');

    // 오류 타입 감지
    const errorType = detectErrorType(errorMessage);
    console.log('🔍 감지된 오류 타입:', errorType);

    // 오류 타입에 따른 프롬프트 선택
    let prompt;
    if (errorType === 'no_results') {
      console.log('📊 "No results" 케이스 - 데이터 분석 프롬프트 사용');
      prompt = createNoResultsAnalysisPrompt(originalSQL, errorMessage, userContext);
    } else {
      console.log('🔧 일반 오류 케이스 - 표준 수정 프롬프트 사용');
      prompt = createErrorFixPrompt(originalSQL, errorMessage, userContext);
    }
    
    console.log('📝 생성된 프롬프트 길이:', prompt.length);

    // Claude API 호출
    const claudeResponse = await callClaudeAPI(prompt);
    console.log('✅ Claude 응답 받음, 길이:', claudeResponse?.length || 0);

    // JSON 파싱
    let result;
    try {
      // JSON 부분만 추출 시도
      let jsonString = claudeResponse.trim();
      
      // 마크다운 코드 블록 제거
      const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || 
                        jsonString.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, jsonString];
      
      if (jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }
      
      console.log('🔍 파싱 시도할 JSON:', jsonString.substring(0, 200) + '...');
      
      result = JSON.parse(jsonString);
      
      // 필수 필드 검증 (오류 타입에 따라 다르게)
      if (errorType === 'no_results') {
        if (!result.revisedSQL || result.revisedSQL.trim() === '') {
          throw new Error('개선된 SQL이 비어있습니다.');
        }
      } else {
        if (!result.fixedSQL || result.fixedSQL.trim() === '') {
          throw new Error('수정된 SQL이 비어있습니다.');
        }
      }
      
    } catch (parseError) {
      console.error('❌ Claude 응답 파싱 실패:', parseError);
      console.log('📄 전체 Claude 응답:', claudeResponse);
      
      // Claude 응답에서 SQL 추출 시도
      const sqlMatch = claudeResponse.match(/SELECT[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/WITH[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/CREATE[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/INSERT[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/UPDATE[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/DELETE[\s\S]*?(?=\n\n|$)/i);
      
      // 오류 타입에 따른 fallback 응답
      if (errorType === 'no_results') {
        result = {
          revisedSQL: sqlMatch ? sqlMatch[0].trim() : originalSQL,
          explanation: "데이터 분석을 시도했지만 파싱에 실패했습니다. 시간 범위를 넓혀보세요.",
          analysisSteps: ["시간 범위를 30일로 확대", "필터 조건 완화", "다른 프로토콜 시도"],
          alternativeQueries: ["더 넓은 조건의 쿼리 시도"],
          dataValidationSuggestions: ["Dune에서 데이터 존재 여부 확인"]
        };
      } else {
        result = {
          fixedSQL: sqlMatch ? sqlMatch[0].trim() : originalSQL,
          explanation: "SQL 수정을 시도했지만 파싱에 실패했습니다. 원본 SQL을 확인해주세요.",
          changes: ["응답 파싱 실패로 인한 기본 응답"],
          commonMistakes: [],
          testingSuggestions: ["Dune에서 직접 쿼리를 테스트해보세요."]
        };
      }
    }

    console.log('✅ SQL 오류 수정 완료');
    
    if (errorType === 'no_results') {
      console.log('📊 최종 분석 결과:', {
        revisedSQLLength: result.revisedSQL?.length || 0,
        explanationLength: result.explanation?.length || 0,
        analysisStepsCount: result.analysisSteps?.length || 0,
        alternativeQueriesCount: result.alternativeQueries?.length || 0
      });
    } else {
      console.log('📊 최종 수정 결과:', {
        fixedSQLLength: result.fixedSQL?.length || 0,
        explanationLength: result.explanation?.length || 0,
        changesCount: result.changes?.length || 0
      });
    }

    // SQL 오류 정보를 DB에 저장
    const supabase = createSupabaseClient();
    if (supabase) {
      try {
        const savedError = await saveSQLError(
          supabase,
          originalSQL,
          errorMessage,
          errorType === 'no_results' ? result.revisedSQL : result.fixedSQL,
          result.explanation,
          errorType === 'no_results' ? result.analysisSteps : result.changes,
          userContext
        );
        
        if (savedError) {
          console.log('💾 오류 정보 DB 저장 완료:', savedError.id);
        } else {
          console.log('⚠️ 오류 정보 DB 저장 실패');
        }
      } catch (saveError) {
        console.error('❌ 오류 정보 DB 저장 중 예외:', saveError);
      }
    } else {
      console.log('⚠️ Supabase 연결 실패로 오류 정보 저장 건너뜀');
    }

    // 응답 데이터 구성 (오류 타입에 따라 다르게)
    let responseData;
    if (errorType === 'no_results') {
      responseData = {
        fixedSQL: result.revisedSQL, // revisedSQL을 fixedSQL로 매핑
        explanation: result.explanation,
        changes: result.analysisSteps || [],
        commonMistakes: result.alternativeQueries || [],
        testingSuggestions: result.dataValidationSuggestions || [],
        errorType: 'no_results',
        analysisType: 'data_analysis' // 특별 플래그
      };
    } else {
      responseData = {
        fixedSQL: result.fixedSQL,
        explanation: result.explanation,
        changes: result.changes || [],
        commonMistakes: result.commonMistakes || [],
        testingSuggestions: result.testingSuggestions || [],
        errorType: errorType,
        analysisType: 'error_fix'
      };
    }

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ SQL 오류 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: `SQL 오류 수정 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
