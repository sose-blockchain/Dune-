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

// 과거 오류 패턴에서 학습
async function getErrorLearnings(supabase, userQuery) {
  try {
    console.log('🧠 과거 오류 패턴에서 학습 중...');
    
    // 사용자 쿼리와 관련된 성공적인 수정 사례 검색
    const { data: successfulFixes } = await supabase
      .from('successful_fixes')
      .select('*')
      .limit(5);
    
    if (successfulFixes && successfulFixes.length > 0) {
      console.log(`📚 ${successfulFixes.length}개 성공적인 수정 사례 발견`);
      return successfulFixes;
    }
    
    return [];
  } catch (error) {
    console.error('❌ 오류 학습 데이터 조회 실패:', error);
    return [];
  }
}

// 일반적인 오류 패턴 조회
async function getCommonErrorPatterns(supabase) {
  try {
    const { data: patterns } = await supabase
      .from('common_error_patterns')
      .select('*')
      .limit(10);
    
    return patterns || [];
  } catch (error) {
    console.error('❌ 일반적인 오류 패턴 조회 실패:', error);
    return [];
  }
}

// 관련 쿼리 검색
async function findRelatedQueries(supabase, userQuery) {
  try {
    // 키워드 기반 검색 (간단한 구현)
    const keywords = userQuery.toLowerCase().split(' ').filter(word => word.length > 2);
    
    let query = supabase
      .from('analyzed_queries')
      .select('dune_query_id, title, summary, key_features, raw_query, blockchain_type, project_name')
      .limit(10);

    // 제목이나 요약에서 키워드 검색
    if (keywords.length > 0) {
      const searchPattern = keywords.join('|');
      query = query.or(`title.ilike.%${keywords[0]}%,summary.ilike.%${keywords[0]}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ 관련 쿼리 검색 실패:', error);
      return [];
    }

    // 관련도 점수 계산 (간단한 키워드 매칭)
    return data.map(query => ({
      id: query.dune_query_id,
      title: query.title,
      summary: query.summary,
      keyFeatures: query.key_features || [],
      rawQuery: query.raw_query,
      relevanceScore: calculateRelevanceScore(userQuery, query)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

  } catch (error) {
    console.error('❌ 관련 쿼리 검색 오류:', error);
    return [];
  }
}

// 관련도 점수 계산
function calculateRelevanceScore(userQuery, dbQuery) {
  const userWords = userQuery.toLowerCase().split(' ');
  const queryText = `${dbQuery.title} ${dbQuery.summary} ${dbQuery.key_features?.join(' ')}`.toLowerCase();
  
  let score = 0;
  userWords.forEach(word => {
    if (word.length > 2 && queryText.includes(word)) {
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

다음 JSON 형태로만 응답해주세요:
{
  "generatedSQL": "생성된 SQL 쿼리",
  "explanation": "쿼리에 대한 상세 설명",
  "assumptions": ["가정사항1", "가정사항2"],
  "clarificationQuestions": ["추가로 필요한 정보에 대한 질문"],
  "usedQueries": [관련 쿼리 ID들],
  "confidence": 0.8,
  "suggestedImprovements": ["개선 제안사항"]
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

    // Claude API 호출
    console.log('🧠 Claude AI로 SQL 생성 중...');
    const claudeResponse = await callClaudeAPI(prompt);

    // JSON 파싱
    let result;
    try {
봐      // Claude 응답에서 JSON 부분만 추출
      let jsonString = claudeResponse.trim();
      
      // JSON 블록이 마크다운 코드 블록 안에 있는 경우 추출
      const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || 
                       jsonString.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, jsonString];
      
      if (jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }
      
      console.log('🔍 Claude 응답 원본:', claudeResponse.substring(0, 200) + '...');
      console.log('🔍 파싱 시도할 JSON:', jsonString.substring(0, 200) + '...');
      
      result = JSON.parse(jsonString);
      
      // 필수 필드 검증
      if (!result.generatedSQL) {
        throw new Error('생성된 SQL이 없습니다.');
      }
      
    } catch (parseError) {
      console.error('❌ Claude 응답 파싱 실패:', parseError);
      console.log('📄 전체 Claude 응답:', claudeResponse);
      
      // Claude 응답에서 SQL 추출 시도
      const sqlMatch = claudeResponse.match(/SELECT[\s\S]*?(?=\n\n|\n[A-Z]|$)/i) ||
                      claudeResponse.match(/WITH[\s\S]*?(?=\n\n|\n[A-Z]|$)/i) ||
                      claudeResponse.match(/CREATE[\s\S]*?(?=\n\n|\n[A-Z]|$)/i);
      
      // 기본 응답 생성
      result = {
        generatedSQL: sqlMatch ? sqlMatch[0].trim() : claudeResponse.substring(0, 500),
        explanation: "AI가 SQL 쿼리를 생성했습니다. JSON 파싱에 실패하여 원본 응답을 제공합니다.",
        assumptions: ["Claude 응답 파싱 실패로 인한 fallback 응답"],
        clarificationQuestions: [],
        usedQueries: foundQueries.map(q => q.id),
        confidence: 0.5,
        suggestedImprovements: ["응답 형식을 개선해야 합니다."]
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
    console.error('❌ SQL 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: `SQL 생성 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
