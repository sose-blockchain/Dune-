const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dune-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { queryId, parameters = {} } = req.body;
    
    if (!process.env.DUNE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Dune API 키가 설정되지 않았습니다.'
      });
    }

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

    // 2단계: 결과 폴링 (최대 30초)
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      console.log(`결과 조회 시도 ${attempts + 1}/${maxAttempts}`);
      
      const resultResponse = await axios.get(`https://api.dune.com/api/v1/execution/${executionData.execution_id}/results`, {
        headers: {
          'x-dune-api-key': process.env.DUNE_API_KEY
        },
        timeout: 10000
      });
      
      const resultData = resultResponse.data;
      console.log(`쿼리 상태: ${resultData.state}`);
      
      if (resultData.state === 'QUERY_STATE_COMPLETED') {
        return res.status(200).json({
          success: true,
          data: resultData.result,
          execution_id: executionData.execution_id
        });
      }
      
      if (resultData.state === 'QUERY_STATE_FAILED') {
        return res.status(500).json({
          success: false,
          error: '쿼리 실행이 실패했습니다.',
          execution_id: executionData.execution_id
        });
      }
      
      // 2초 대기 후 다시 시도
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    // 시간 초과
    res.status(408).json({
      success: false,
      error: '쿼리 실행 시간이 초과되었습니다.',
      execution_id: executionData.execution_id
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
