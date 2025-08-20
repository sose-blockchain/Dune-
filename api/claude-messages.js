const axios = require('axios');

module.exports = async (req, res) => {
  console.log('=== Claude API Function 시작 ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS 요청 처리됨');
    res.status(200).end();
    return;
  }

  // 모든 메서드 허용 (디버깅용)
  console.log('요청 메서드 확인:', req.method);
  
  try {
    // 환경변수 확인
    console.log('CLAUDE_API_KEY 존재:', !!process.env.CLAUDE_API_KEY);
    
    if (!process.env.CLAUDE_API_KEY) {
      console.log('API 키 없음');
      return res.status(500).json({
        success: false,
        error: 'Claude API 키가 설정되지 않았습니다.',
        debug: {
          method: req.method,
          hasApiKey: !!process.env.CLAUDE_API_KEY
        }
      });
    }

    // 간단한 테스트 응답
    if (req.method === 'GET') {
      console.log('GET 요청 - 테스트 응답');
      return res.json({
        success: true,
        message: 'Claude API Function이 정상 작동합니다',
        method: req.method,
        timestamp: new Date().toISOString(),
        hasApiKey: !!process.env.CLAUDE_API_KEY
      });
    }

    // POST 요청 처리
    if (req.method === 'POST') {
      console.log('POST 요청 처리 시작');
      
      const { model, messages, max_tokens, temperature, stream } = req.body;
      
      console.log('요청 데이터:', { model, max_tokens, temperature, stream });
      console.log('메시지 개수:', messages ? messages.length : 0);

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: model || 'claude-3-sonnet-20240229',
        messages: messages || [{ role: 'user', content: 'Hello' }],
        max_tokens: max_tokens || 1000,
        temperature: temperature || 0.7,
        stream: stream || false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      console.log('Claude API 응답 성공');
      
      res.json({
        success: true,
        data: response.data
      });
    } else {
      console.log('지원하지 않는 메서드:', req.method);
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'OPTIONS'],
        receivedMethod: req.method
      });
    }
  } catch (error) {
    console.error('Claude API Function 오류:', error.message);
    console.error('오류 상세:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Claude API 오류: ${error.response.status} ${error.response.statusText}`,
        debug: {
          method: req.method,
          hasApiKey: !!process.env.CLAUDE_API_KEY
        }
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Claude API 서버에 연결할 수 없습니다.',
        debug: {
          method: req.method,
          hasApiKey: !!process.env.CLAUDE_API_KEY
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        debug: {
          method: req.method,
          hasApiKey: !!process.env.CLAUDE_API_KEY,
          errorMessage: error.message
        }
      });
    }
  }
};
