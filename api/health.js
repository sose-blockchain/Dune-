require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    services: {
      dune: {
        configured: !!process.env.DUNE_API_KEY,
        status: process.env.DUNE_API_KEY ? 'ready' : 'missing_api_key'
      },
      claude: {
        configured: !!process.env.CLAUDE_API_KEY,
        status: process.env.CLAUDE_API_KEY ? 'ready' : 'missing_api_key'
      }
    },
    cors: {
      allowedOrigins: ['*']
    }
  };

  // API 키가 하나라도 없으면 경고 상태
  const hasAllKeys = process.env.DUNE_API_KEY && process.env.CLAUDE_API_KEY;
  const statusCode = hasAllKeys ? 200 : 503;

  res.status(statusCode).json(healthInfo);
};
