// 환경변수 디버깅 API
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'GET 메서드만 지원됩니다.'
    });
  }

  try {
    console.log('🔍 환경변수 디버깅 요청');

    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || '미설정',
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? '✅ 설정됨' : '❌ 누락',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 누락',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락',
      VERCEL: process.env.VERCEL ? '✅ Vercel 환경' : '❌ 로컬 환경',
      timestamp: new Date().toISOString()
    };

    // Supabase URL 일부 표시 (보안을 위해 일부만)
    if (process.env.SUPABASE_URL) {
      const url = process.env.SUPABASE_URL;
      envStatus.SUPABASE_URL_PREVIEW = url.substring(0, 20) + '...' + url.substring(url.length - 10);
    }

    // 환경변수 개수 확인
    const totalEnvVars = Object.keys(process.env).length;
    envStatus.TOTAL_ENV_VARS = totalEnvVars;

    console.log('📊 환경변수 상태:', envStatus);

    res.status(200).json({
      success: true,
      data: envStatus,
      message: '환경변수 상태 확인 완료'
    });

  } catch (error) {
    console.error('❌ 환경변수 디버깅 실패:', error);
    res.status(500).json({
      success: false,
      error: `환경변수 디버깅 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
