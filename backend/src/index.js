const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 프로덕션 환경에서는 허용된 origin만
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['https://your-domain.vercel.app'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 미들웨어 설정
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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
      allowedOrigins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000']
    }
  };

  // API 키가 하나라도 없으면 경고 상태
  const hasAllKeys = process.env.DUNE_API_KEY && process.env.CLAUDE_API_KEY;
  const statusCode = hasAllKeys ? 200 : 503;

  res.status(statusCode).json(healthInfo);
});

// Dune API 프록시
app.post('/api/dune/graphql', async (req, res) => {
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
});

// Claude API 프록시
app.post('/api/claude/messages', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature, stream } = req.body;
    
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
      stream: false // 스트리밍은 나중에 구현
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    res.json({
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
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 프록시: http://localhost:${PORT}/api`);
  console.log(`🏥 헬스 체크: http://localhost:${PORT}/api/health`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
