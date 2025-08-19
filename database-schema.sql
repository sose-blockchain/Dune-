-- Dune Query Analyzer 데이터베이스 스키마
-- Supabase SQL 에디터에서 실행하세요

-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'
);

-- 쿼리 테이블
CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    dune_query_id VARCHAR(100) UNIQUE NOT NULL,
    dune_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[],
    raw_query TEXT NOT NULL,
    analyzed_query JSONB,
    explanation TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 쿼리 분석 테이블 (라인별 상세 분석)
CREATE TABLE query_analyses (
    id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES queries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    original_code TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    related_concepts TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 학습 진행 테이블
CREATE TABLE user_learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query_id INTEGER REFERENCES queries(id) ON DELETE CASCADE,
    completion_status VARCHAR(20) DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'reviewed')),
    time_spent INTEGER DEFAULT 0, -- 초 단위
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_queries_dune_query_id ON queries(dune_query_id);
CREATE INDEX idx_queries_category ON queries(category);
CREATE INDEX idx_queries_difficulty ON queries(difficulty_level);
CREATE INDEX idx_queries_created_by ON queries(created_by);
CREATE INDEX idx_query_analyses_query_id ON query_analyses(query_id);
CREATE INDEX idx_user_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_user_progress_query_id ON user_learning_progress(query_id);
CREATE INDEX idx_user_progress_status ON user_learning_progress(completion_status);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

-- 기본 정책 설정
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Queries are viewable by everyone" ON queries FOR SELECT USING (true);
CREATE POLICY "Users can create queries" ON queries FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);
CREATE POLICY "Users can update their own queries" ON queries FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Query analyses are viewable by everyone" ON query_analyses FOR SELECT USING (true);
CREATE POLICY "Users can create query analyses" ON query_analyses FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own progress" ON user_learning_progress FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create their own progress" ON user_learning_progress FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own progress" ON user_learning_progress FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 시드 데이터 (테스트용)
INSERT INTO users (email, username, subscription_tier) VALUES 
('admin@dune-analyzer.com', 'admin', 'free'),
('test@example.com', 'testuser', 'free');

-- 샘플 쿼리 데이터
INSERT INTO queries (dune_query_id, dune_url, title, description, category, difficulty_level, tags, raw_query, created_by) VALUES 
('123456', 'https://dune.com/queries/123456', 'Sample Query', 'This is a sample query for testing', 'defi', 'beginner', ARRAY['ethereum', 'defi'], 'SELECT * FROM ethereum.transactions LIMIT 10', 1);
