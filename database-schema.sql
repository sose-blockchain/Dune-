-- Dune Query Analyzer 데이터베이스 스키마 (최적화됨)
-- Supabase SQL 에디터에서 실행하세요

-- 핵심 테이블: 분석된 쿼리 저장
CREATE TABLE analyzed_queries (
    id SERIAL PRIMARY KEY,
    dune_query_id VARCHAR(100) UNIQUE NOT NULL,
    dune_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    
    -- 원본 쿼리 정보
    raw_query TEXT NOT NULL,
    
    -- Claude 분석 결과
    commented_query TEXT NOT NULL,  -- 주석이 추가된 SQL
    summary TEXT,
    key_features TEXT[], -- 주요 기능들
    blockchain_type VARCHAR(50), -- ethereum, polygon, arbitrum, optimism 등
    project_name VARCHAR(100), -- uniswap, aave, compound 등
    project_category VARCHAR(50) -- defi, nft, gaming, dao 등
    
    -- 메타데이터
    tags TEXT[],
    analysis_metadata JSONB, -- Claude 응답 원본 등 추가 데이터
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 (향후 확장용, 현재는 선택사항)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'
);

-- 즐겨찾기/북마크 테이블 (향후 확장용)
CREATE TABLE user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query_id INTEGER REFERENCES analyzed_queries(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, query_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_analyzed_queries_dune_id ON analyzed_queries(dune_query_id);
CREATE INDEX idx_analyzed_queries_category ON analyzed_queries(category);
CREATE INDEX idx_analyzed_queries_blockchain ON analyzed_queries(blockchain_type);
CREATE INDEX idx_analyzed_queries_project ON analyzed_queries(project_name);
CREATE INDEX idx_analyzed_queries_project_category ON analyzed_queries(project_category);
CREATE INDEX idx_analyzed_queries_created_at ON analyzed_queries(created_at DESC);
CREATE INDEX idx_analyzed_queries_tags ON analyzed_queries USING GIN(tags);
CREATE INDEX idx_analyzed_queries_key_features ON analyzed_queries USING GIN(key_features);

-- 사용자 관련 인덱스 (향후 확장용)
CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_query_id ON user_bookmarks(query_id);

-- RLS (Row Level Security) 설정
-- 현재는 공개 읽기로 설정 (인증 없이도 분석 결과 조회 가능)
ALTER TABLE analyzed_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view analyzed queries" ON analyzed_queries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analyzed queries" ON analyzed_queries FOR INSERT WITH CHECK (true);

-- 사용자 테이블 RLS (향후 인증 시스템 추가 시)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- 북마크 테이블 RLS (사용자별 접근 제어)
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks 
    FOR ALL USING (auth.uid()::text = user_id::text);

-- 시드 데이터 (테스트용)
INSERT INTO users (email, username, subscription_tier) VALUES 
('admin@dune-analyzer.com', 'admin', 'free'),
('test@example.com', 'testuser', 'free');

-- 샘플 분석된 쿼리 데이터
INSERT INTO analyzed_queries (
    dune_query_id, 
    dune_url, 
    title, 
    description, 
    category, 
    raw_query,
    commented_query,
    summary,
    key_features,
    blockchain_type,
    project_name,
    project_category,
    tags
) VALUES 
(
    '123456', 
    'https://dune.com/queries/123456', 
    'Sample ETH Transactions Query', 
    'Basic Ethereum transactions analysis', 
    'transactions', 
    'SELECT * FROM ethereum.transactions LIMIT 10',
    '-- 이 쿼리는 이더리움 트랜잭션을 조회합니다\nSELECT \n    * -- 모든 컬럼을 선택\nFROM ethereum.transactions \nLIMIT 10; -- 최대 10개 행만 반환',
    '이더리움 블록체인의 기본 트랜잭션 데이터를 조회하는 쿼리입니다.',
    ARRAY['SELECT', 'LIMIT', 'basic-query'],
    'ethereum',
    NULL,
    'blockchain-data',
    ARRAY['ethereum', 'transactions', 'basic']
);
