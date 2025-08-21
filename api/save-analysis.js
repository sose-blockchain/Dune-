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

    // Vercel 서버리스 환경: 분석 데이터 로그 및 응답만 처리
    // TODO: 향후 데이터베이스 연결 시 실제 저장 로직 구현
    
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

    // Vercel 환경에서는 로그만 출력 (파일 시스템 저장 불가)
    console.log(`✅ 분석 완료 - Query ID: ${duneQueryId}`);
    console.log(`📊 제목: ${analysisData.title}`);
    console.log(`🎯 난이도: ${analysisData.difficultyLevel}`);
    console.log(`⏰ 분석 시간: ${analysisData.savedAt}`);
    
    // 성공 응답 (실제 저장은 향후 데이터베이스 연동 시 구현)
    res.status(200).json({
      success: true,
      data: {
        id: `analysis_${duneQueryId}_${Date.now()}`,
        duneQueryId,
        title: analysisData.title,
        savedAt: analysisData.savedAt,
        storage: 'logged_to_vercel_console'
      },
      message: '분석이 완료되었습니다. (Vercel 환경: 로그로 기록됨)'
    });

  } catch (error) {
    console.error('분석 결과 저장 오류:', error.message);
    
    res.status(500).json({
      success: false,
      error: '분석 결과 저장 중 오류가 발생했습니다.'
    });
  }
};
