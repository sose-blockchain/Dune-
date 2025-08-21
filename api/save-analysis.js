const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

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

    // TODO: 실제 데이터베이스 연결이 있을 때 사용할 코드
    // 현재는 로컬 JSON 파일로 저장하는 방식으로 구현
    
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

    // 로컬 파일 시스템에 저장 (임시 구현)
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const fileName = `analysis_${duneQueryId}_${Date.now()}.json`;
    const filePath = path.join(dataDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(analysisData, null, 2));
    
    console.log(`✅ 분석 결과 저장 완료: ${fileName}`);
    
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
    console.error('분석 결과 저장 오류:', error.message);
    
    res.status(500).json({
      success: false,
      error: '분석 결과 저장 중 오류가 발생했습니다.'
    });
  }
};
