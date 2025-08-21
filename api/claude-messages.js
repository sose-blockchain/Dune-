const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { model, messages, max_tokens, temperature } = req.body;
    
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Claude API 키가 설정되지 않았습니다.'
      });
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model,
      messages,
      max_tokens,
      temperature,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Claude API 프록시 오류:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Claude API 오류: ${error.response.status} ${error.response.statusText}`
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Claude API 서버에 연결할 수 없습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.'
      });
    }
  }
};
