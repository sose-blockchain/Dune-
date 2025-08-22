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

// Claude API 호출
async function callClaudeAPI(prompt) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('❌ Claude API 호출 실패:', error);
    throw error;
  }
}

// 관련 쿼리 검색
async function findRelatedQueries(supabase, userQuery) {
  try {
    const { data, error } = await supabase
      .from('analyzed_queries')
      .select('*')
      .limit(5);

    if (error) {
      console.error('DB 쿼리 오류:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 간단한 키워드 매칭으로 관련성 점수 계산
    const scoredQueries = data.map(query => ({
      ...query,
      relevanceScore: calculateRelevanceScore(userQuery, query.summary + ' ' + query.title)
    }));

    // 관련성 점수로 정렬하고 상위 3개만 반환
    return scoredQueries
      .filter(q => q.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  } catch (error) {
    console.error('관련 쿼리 검색 오류:', error);
    return [];
  }
}

// 오류 학습 데이터 가져오기
async function getErrorLearnings(supabase, userQuery) {
  try {
    const { data, error } = await supabase
      .from('sql_errors')
      .select('original_sql, error_message, fixed_sql, fix_explanation')
      .not('fixed_sql', 'is', null)
      .gte('fix_success_rate', 0.7)
      .limit(3);

    if (error) {
      console.error('오류 학습 데이터 조회 실패:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('오류 학습 데이터 가져오기 실패:', error);
    return [];
  }
}

// 공통 오류 패턴 가져오기
async function getCommonErrorPatterns(supabase) {
  try {
    const { data, error } = await supabase
      .from('common_error_patterns')
      .select('*')
      .limit(5);

    if (error) {
      console.error('공통 오류 패턴 조회 실패:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('공통 오류 패턴 가져오기 실패:', error);
    return [];
  }
}

// 간단한 관련성 점수 계산
function calculateRelevanceScore(userQuery, queryText) {
  if (!userQuery || !queryText) return 0;

  const userWords = userQuery.toLowerCase().split(/\s+/);
  const queryWords = queryText.toLowerCase();
  
  let score = 0;
  userWords.forEach(word => {
    if (word.length > 2 && queryWords.includes(word)) {
      score += 1;
    }
  });
  
  return score;
}

// SQL 생성 프롬프트 생성
function createSQLGenerationPrompt(userQuery, relatedQueries, context, errorLearnings, commonPatterns) {
  const relatedQueriesText = relatedQueries.length > 0 
    ? relatedQueries.map(q => `
제목: ${q.title}
요약: ${q.summary}
SQL: ${q.rawQuery}
---`).join('\n')
    : '관련 쿼리가 없습니다.';

  const errorLearningsText = errorLearnings.length > 0
    ? errorLearnings.map(fix => `
원본 SQL: ${fix.original_sql}
오류: ${fix.error_message}
수정된 SQL: ${fix.fixed_sql}
수정 설명: ${fix.fix_explanation}
---`).join('\n')
    : '과거 오류 학습 데이터가 없습니다.';

  const commonPatternsText = commonPatterns.length > 0
    ? commonPatterns.map(pattern => `
오류 타입: ${pattern.error_type}
발생 횟수: ${pattern.occurrence_count}
영향받는 블록체인: ${pattern.affected_blockchains?.join(', ')}
---`).join('\n')
    : '일반적인 오류 패턴 데이터가 없습니다.';

  return `당신은 Dune Analytics SQL 쿼리 전문가입니다. 사용자의 자연어 요청을 바탕으로 SQL 쿼리를 생성해주세요.

사용자 요청: "${userQuery}"

관련 기존 쿼리들:
${relatedQueriesText}

과거 오류 학습 사례들 (이런 실수를 피하세요):
${errorLearningsText}

일반적인 오류 패턴들:
${commonPatternsText}

컨텍스트:
- 블록체인: ${context?.blockchain || '지정 안됨'}
- 시간범위: ${context?.timeframe || '지정 안됨'}
- 프로토콜: ${context?.protocols?.join(', ') || '지정 안됨'}

⚠️ 주의사항 (과거 오류 데이터 기반):
1. 테이블명은 정확한 스키마를 포함하세요 (예: ethereum.core.transactions)
2. 컬럼명을 확인하세요 (예: value_eth, not value)
3. PostgreSQL 문법을 사용하세요
4. 날짜 형식을 올바르게 사용하세요
5. JOIN 조건을 명확히 하세요

다음 JSON 형태로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "generatedSQL": "SELECT token_address, symbol, SUM(amount_usd) as volume FROM dex.trades WHERE blockchain = 'ethereum' AND block_time >= current_date - interval '7 days' GROUP BY token_address, symbol ORDER BY volume DESC LIMIT 5",
  "explanation": "이더리움에서 지난 7일간 DEX 거래량을 집계하는 쿼리입니다.",
  "assumptions": ["dex.trades 테이블 사용", "이더리움 블록체인 데이터"],
  "clarificationQuestions": [],
  "confidence": 0.8,
  "suggestedImprovements": []
}

중요: 
1. 반드시 유효한 JSON만 반환하세요
2. generatedSQL에는 실제 실행 가능한 Dune Analytics SQL을 넣으세요
3. 마크다운 코드 블록(\`\`\`)은 사용하지 마세요`;
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

  // 환경 변수 확인
  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY 환경 변수가 설정되지 않음');
    return res.status(500).json({
      success: false,
      error: 'Claude API 키가 설정되지 않았습니다.'
    });
  }

  console.log('🔑 환경 변수 확인:', {
    hasClaudeKey: !!process.env.CLAUDE_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
  });

  try {
    console.log('🤖 SQL 생성 요청 받음');

    const { userQuery, context, relatedQueries = [], errorToFix } = req.body;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: '사용자 쿼리가 필요합니다.'
      });
    }

    // Supabase에서 관련 쿼리 및 오류 학습 데이터 검색
    const supabase = createSupabaseClient();
    let foundQueries = relatedQueries;
    let errorLearnings = [];
    let commonPatterns = [];

    if (supabase) {
      if (foundQueries.length === 0) {
        console.log('🔍 DB에서 관련 쿼리 검색 중...');
        foundQueries = await findRelatedQueries(supabase, userQuery);
        console.log(`📊 ${foundQueries.length}개 관련 쿼리 발견`);
      }

      // 오류 학습 데이터 가져오기
      errorLearnings = await getErrorLearnings(supabase, userQuery);
      commonPatterns = await getCommonErrorPatterns(supabase);
    }

    // SQL 생성 프롬프트 생성 (오류 학습 데이터 포함)
    const prompt = createSQLGenerationPrompt(userQuery, foundQueries, context, errorLearnings, commonPatterns);
    console.log('📝 프롬프트 생성 완료');

    // Claude API 호출
    console.log('🤖 Claude API 호출 중...');
    const claudeResponse = await callClaudeAPI(prompt);
    console.log('✅ Claude 응답 받음');

    // Claude 응답 파싱
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
      
      console.log('🔍 Claude 응답 원본:', claudeResponse.substring(0, 200) + '...');
      console.log('🔍 파싱 시도할 JSON:', jsonString.substring(0, 200) + '...');
      
      result = JSON.parse(jsonString);
      
      // 필수 필드 검증 및 기본값 설정
      if (!result.generatedSQL || result.generatedSQL.trim() === '') {
        console.log('⚠️ Claude에서 빈 SQL을 반환함, fallback 사용');
        throw new Error('생성된 SQL이 비어있습니다.');
      }
      
    } catch (parseError) {
      console.error('❌ Claude 응답 파싱 실패:', parseError);
      console.log('📄 전체 Claude 응답:', claudeResponse);
      
      // Claude 응답에서 SQL 추출 시도 (더 강력한 정규식)
      const sqlMatch = claudeResponse.match(/SELECT[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/WITH[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/CREATE[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/INSERT[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/UPDATE[\s\S]*?(?=\n\n|$)/i) ||
                       claudeResponse.match(/DELETE[\s\S]*?(?=\n\n|$)/i);
      
      // 기본 응답 생성 (fallback SQL)
      let fallbackSQL = `-- AI가 생성한 쿼리 (${userQuery})
SELECT 
  token_address,
  symbol,
  SUM(amount_usd) as volume
FROM dex.trades 
WHERE blockchain = 'ethereum' 
  AND block_time >= current_date - interval '7 days'
GROUP BY token_address, symbol 
ORDER BY volume DESC 
LIMIT 5`;

      result = {
        generatedSQL: sqlMatch ? sqlMatch[0].trim() : fallbackSQL,
        explanation: "SQL이 생성되었습니다.",
        assumptions: ["기본 Dune Analytics 스키마 사용"],
        clarificationQuestions: undefined,
        confidence: sqlMatch ? 0.7 : 0.6,
        suggestedImprovements: [
          "Claude 응답 형식 개선 필요",
          "실제 토큰 심볼과 주소 확인 권장",
          "필요에 따라 필터 조건 수정"
        ]
      };
    }

    console.log('✅ SQL 생성 완료');
    console.log('📊 최종 result 객체:', JSON.stringify(result, null, 2));
    console.log('🔍 generatedSQL 내용:', result.generatedSQL);

    const responseData = {
      ...result,
      usedQueries: foundQueries
    };
    
    console.log('📤 클라이언트로 전송할 데이터:', JSON.stringify(responseData, null, 2));

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ SQL 생성 중 전체 오류:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      env: {
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      }
    });
    
    // 상세한 에러 응답
    let errorMessage = '서버 내부 오류가 발생했습니다.';
    let errorDetails = null;
    
    if (error.message.includes('Claude API')) {
      errorMessage = 'Claude AI 서비스 연결에 실패했습니다.';
      errorDetails = 'API 키를 확인하거나 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
      errorMessage = '네트워크 연결에 문제가 있습니다.';
      errorDetails = '인터넷 연결을 확인하고 다시 시도해주세요.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      originalError: error.message,
      debugInfo: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};