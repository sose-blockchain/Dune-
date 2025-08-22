const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error.message);
    return null;
  }
}

// 키워드 추출
function extractKeywords(query) {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'get', 'find', 'show', 'give', 'me', 'i', 'you', 'we', 'they'];
  
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

// 블록체인/프로토콜 감지
function detectBlockchainProtocol(query) {
  const blockchains = {
    ethereum: ['ethereum', 'eth', 'mainnet'],
    polygon: ['polygon', 'matic'],
    arbitrum: ['arbitrum', 'arb'],
    optimism: ['optimism', 'op'],
    bnb: ['bnb', 'bsc', 'binance']
  };

  const protocols = {
    uniswap: ['uniswap', 'uni'],
    sushiswap: ['sushiswap', 'sushi'],
    curve: ['curve', 'crv'],
    compound: ['compound', 'comp'],
    aave: ['aave'],
    maker: ['maker', 'mkr', 'dai'],
    lido: ['lido', 'steth']
  };

  const lowerQuery = query.toLowerCase();
  
  const detectedBlockchain = Object.entries(blockchains).find(([key, values]) =>
    values.some(value => lowerQuery.includes(value))
  )?.[0];

  const detectedProtocols = Object.entries(protocols)
    .filter(([key, values]) => values.some(value => lowerQuery.includes(value)))
    .map(([key]) => key);

  return { blockchain: detectedBlockchain, protocols: detectedProtocols };
}

// 관련도 점수 계산 (개선된 버전)
function calculateRelevanceScore(userQuery, dbQuery, userKeywords, detectedContext) {
  let score = 0;
  const queryText = `${dbQuery.title} ${dbQuery.summary} ${dbQuery.key_features?.join(' ')} ${dbQuery.blockchain_type} ${dbQuery.project_name}`.toLowerCase();
  
  // 키워드 매칭 (기본 점수)
  userKeywords.forEach(keyword => {
    if (queryText.includes(keyword)) {
      score += 2;
    }
  });

  // 블록체인 매칭 (보너스 점수)
  if (detectedContext.blockchain && dbQuery.blockchain_type === detectedContext.blockchain) {
    score += 5;
  }

  // 프로토콜 매칭 (보너스 점수)
  if (detectedContext.protocols.length > 0) {
    const projectName = dbQuery.project_name?.toLowerCase() || '';
    detectedContext.protocols.forEach(protocol => {
      if (projectName.includes(protocol)) {
        score += 3;
      }
    });
  }

  // 키 기능 매칭 (보너스 점수)
  if (dbQuery.key_features) {
    dbQuery.key_features.forEach(feature => {
      if (userKeywords.some(keyword => feature.toLowerCase().includes(keyword))) {
        score += 1;
      }
    });
  }

  return score;
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST 메서드만 지원됩니다.'
    });
  }

  try {
    console.log('🔍 관련 쿼리 검색 요청 받음');

    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      });
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 연결 실패'
      });
    }

    // 키워드 및 컨텍스트 추출
    const keywords = extractKeywords(query);
    const detectedContext = detectBlockchainProtocol(query);
    
    console.log('📊 검색 컨텍스트:', {
      keywords: keywords.slice(0, 5),
      blockchain: detectedContext.blockchain,
      protocols: detectedContext.protocols
    });

    // 데이터베이스 검색
    let dbQuery = supabase
      .from('analyzed_queries')
      .select('dune_query_id, title, summary, key_features, raw_query, blockchain_type, project_name, project_category')
      .limit(50); // 더 많이 가져와서 점수로 필터링

    // 블록체인 필터 적용
    if (detectedContext.blockchain) {
      dbQuery = dbQuery.eq('blockchain_type', detectedContext.blockchain);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('❌ 데이터베이스 검색 실패:', error);
      return res.status(500).json({
        success: false,
        error: '데이터베이스 검색 실패'
      });
    }

    // 관련도 점수 계산 및 정렬
    const scoredQueries = data
      .map(dbQuery => ({
        id: dbQuery.dune_query_id,
        title: dbQuery.title,
        summary: dbQuery.summary,
        keyFeatures: dbQuery.key_features || [],
        rawQuery: dbQuery.raw_query,
        blockchainType: dbQuery.blockchain_type,
        projectName: dbQuery.project_name,
        projectCategory: dbQuery.project_category,
        relevanceScore: calculateRelevanceScore(query, dbQuery, keywords, detectedContext)
      }))
      .filter(q => q.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    console.log(`✅ ${scoredQueries.length}개 관련 쿼리 발견`);

    res.status(200).json({
      success: true,
      data: scoredQueries,
      metadata: {
        totalFound: scoredQueries.length,
        searchContext: detectedContext,
        keywords: keywords.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('❌ 관련 쿼리 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: `관련 쿼리 검색 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
