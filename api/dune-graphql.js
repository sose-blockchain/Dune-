const axios = require('axios');

module.exports = async (req, res) => {
  // 디버깅 로그
  console.log('=== Dune API Function 호출됨 ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 디버깅: 모든 메서드 허용 (임시)
  console.log('요청 메서드:', req.method);
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log('메서드 거부됨:', req.method);
    return res.status(405).json({ error: 'Method not allowed', received: req.method });
  }

  try {
    const { query, variables } = req.body;
    
    if (!process.env.DUNE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Dune API 키가 설정되지 않았습니다.'
      });
    }

    const response = await axios.post('https://api.dune.com/graphql', {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Dune-API-Key': process.env.DUNE_API_KEY
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data.data,
      errors: response.data.errors
    });
  } catch (error) {
    console.error('Dune API 프록시 오류:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Dune API 오류: ${error.response.status} ${error.response.statusText}`
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Dune API 서버에 연결할 수 없습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.'
      });
    }
  }
};
