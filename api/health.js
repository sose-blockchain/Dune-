const axios = require('axios');
require('dotenv').config();

module.exports = (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    }
  };

  const hasAllKeys = process.env.DUNE_API_KEY && process.env.CLAUDE_API_KEY;
  const statusCode = hasAllKeys ? 200 : 503;

  res.status(statusCode).json(healthInfo);
};
