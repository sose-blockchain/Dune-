const axios = require('axios');
require('dotenv').config();

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

// SQL 오류 수정 프롬프트 생성
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

    // SQL 오류 수정 프롬프트 생성
    const prompt = createErrorFixPrompt(originalSQL, errorMessage, userContext);
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
      
      // 필수 필드 검증
      if (!result.fixedSQL || result.fixedSQL.trim() === '') {
        throw new Error('수정된 SQL이 비어있습니다.');
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
      
      result = {
        fixedSQL: sqlMatch ? sqlMatch[0].trim() : originalSQL,
        explanation: "SQL 수정을 시도했지만 파싱에 실패했습니다. 원본 SQL을 확인해주세요.",
        changes: ["응답 파싱 실패로 인한 기본 응답"],
        commonMistakes: [],
        testingSuggestions: ["Dune에서 직접 쿼리를 테스트해보세요."]
      };
    }

    console.log('✅ SQL 오류 수정 완료');
    console.log('📊 최종 결과:', {
      fixedSQLLength: result.fixedSQL?.length || 0,
      explanationLength: result.explanation?.length || 0,
      changesCount: result.changes?.length || 0
    });

    res.status(200).json({
      success: true,
      data: {
        fixedSQL: result.fixedSQL,
        explanation: result.explanation,
        changes: result.changes || [],
        commonMistakes: result.commonMistakes || [],
        testingSuggestions: result.testingSuggestions || []
      }
    });

  } catch (error) {
    console.error('❌ SQL 오류 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: `SQL 오류 수정 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
