const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스체크 엔드포인트
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
    }
  };

  const hasAllKeys = process.env.DUNE_API_KEY && process.env.CLAUDE_API_KEY;
  const statusCode = hasAllKeys ? 200 : 503;

  res.status(statusCode).json(healthInfo);
});

// Dune API 프록시
app.post('/api/dune-graphql', async (req, res) => {
  try {
    const { query, variables, queryId, parameters = {} } = req.body;
    
    if (!process.env.DUNE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Dune API 키가 설정되지 않았습니다.'
      });
    }

    // GraphQL 요청인지 REST API 요청인지 구분
    if (query) {
      // GraphQL 요청 - 실제 Dune API에서 메타데이터 가져오기
      console.log('🎯 LOCAL SERVER: 실제 Dune API에서 메타데이터 요청 처리 중...');
      
      const extractedQueryId = variables?.id || variables?.queryId;
      
      if (!extractedQueryId) {
        return res.status(400).json({
          success: false,
          error: 'Query ID가 필요합니다.'
        });
      }

      try {
        // 실제 Dune API에서 쿼리 메타데이터 가져오기
        console.log(`🔍 LOCAL SERVER: Dune API 메타데이터 요청: queryId=${extractedQueryId}`);
        const metadataResponse = await axios.get(`https://api.dune.com/api/v1/query/${extractedQueryId}`, {
          headers: {
            'X-Dune-API-Key': process.env.DUNE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        const duneQuery = metadataResponse.data;
        console.log(`✅ LOCAL SERVER: 실제 SQL 쿼리 가져오기 성공: ${duneQuery.name || 'Unnamed Query'}`);
        
        return res.status(200).json({
          success: true,
          data: {
            query: {
              id: extractedQueryId,
              name: duneQuery.name || `Dune Query ${extractedQueryId}`,
              description: duneQuery.description || "Dune Analytics SQL 쿼리",
              query: duneQuery.query_sql || duneQuery.sql || '', // 실제 SQL 쿼리
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user: {
                id: 1,
                name: duneQuery.owner || "Dune User"
              },
              tags: duneQuery.tags || [],
              is_private: duneQuery.is_private || false
            }
          },
          errors: null
        });
      } catch (metadataError) {
        console.error('LOCAL SERVER: Dune 메타데이터 API 오류:', metadataError.message);
        // 메타데이터를 가져올 수 없는 경우 기본값 반환
        return res.status(200).json({
          success: true,
          data: {
            query: {
              id: extractedQueryId,
              name: `Dune Query ${extractedQueryId}`,
              description: "Dune Analytics 쿼리 (메타데이터 로드 실패)",
              query: `-- Query ID: ${extractedQueryId}\n-- 메타데이터를 가져올 수 없습니다`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user: {
                id: 1,
                name: "Dune User"
              },
              tags: [],
              is_private: false
            }
          },
          errors: null
        });
      }
    }

    // REST API 요청 처리 (쿼리 실행)
    if (!queryId) {
      return res.status(400).json({
        success: false,
        error: 'queryId가 필요합니다.'
      });
    }

    // 1단계: 쿼리 실행 요청
    console.log(`Dune API 실행 요청: queryId=${queryId}`);
    const executeResponse = await axios.post(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
      query_parameters: parameters
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-dune-api-key': process.env.DUNE_API_KEY
      },
      timeout: 10000
    });

    const executionData = executeResponse.data;
    console.log(`Dune API 실행 ID: ${executionData.execution_id}`);

    // 간단한 응답 (폴링은 생략)
    res.status(200).json({
      success: true,
      data: executionData,
      message: '쿼리 실행이 시작되었습니다.'
    });

  } catch (error) {
    console.error('Dune API 프록시 오류:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: `Dune API 오류: ${error.response.status} ${error.response.statusText}`
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
app.post('/api/claude-messages', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature } = req.body;
    
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Claude API 키가 설정되지 않았습니다.'
      });
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model || 'claude-3-haiku-20240307',
      messages,
      max_tokens: max_tokens || 1024,
      temperature: temperature || 0.1,
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
    } else {
      res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.'
      });
    }
  }
});

// 분석 결과 저장 API
app.post('/api/save-analysis', async (req, res) => {
  try {
    const { 
      duneQueryId, 
      duneUrl, 
      title, 
      description, 
      category, 
      difficultyLevel, 
      tags, 
      rawQuery, 
      analysisResult 
    } = req.body;

    // 필수 필드 검증
    if (!duneQueryId || !rawQuery || !analysisResult) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다: duneQueryId, rawQuery, analysisResult'
      });
    }

    const analysisData = {
      duneQueryId,
      duneUrl: duneUrl || `https://dune.com/queries/${duneQueryId}`,
      title: title || `Dune Query ${duneQueryId}`,
      description: description || "SQL 쿼리 분석",
      category: category || "general",
      difficultyLevel: difficultyLevel || "intermediate",
      tags: tags || [],
      rawQuery,
      analysisResult,
      savedAt: new Date().toISOString()
    };

    // 로컬 파일 시스템에 저장
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const fileName = `analysis_${duneQueryId}_${Date.now()}.json`;
    const filePath = path.join(dataDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(analysisData, null, 2));
    
    console.log(`✅ LOCAL SERVER: 분석 결과 저장 완료: ${fileName}`);
    
    res.status(200).json({
      success: true,
      data: {
        id: fileName,
        duneQueryId,
        title: analysisData.title,
        savedAt: analysisData.savedAt,
        filePath: fileName
      },
      message: '분석 결과가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('LOCAL SERVER: 분석 결과 저장 오류:', error.message);
    
    res.status(500).json({
      success: false,
      error: '분석 결과 저장 중 오류가 발생했습니다.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 로컬 API 서버가 http://localhost:${PORT}에서 실행 중입니다!`);
  console.log(`📋 헬스체크: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dune API: http://localhost:${PORT}/api/dune-graphql`);
  console.log(`🤖 Claude API: http://localhost:${PORT}/api/claude-messages`);
});
