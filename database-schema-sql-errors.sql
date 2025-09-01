-- SQL 오류 저장 테이블 스키마
-- Supabase SQL 에디터에서 실행하세요

-- SQL 오류 테이블 생성
CREATE TABLE sql_errors (
    id SERIAL PRIMARY KEY,
    
    -- 오류 식별자
    error_hash VARCHAR(64) UNIQUE, -- SHA-256 해시로 중복 오류 식별
    
    -- SQL 정보
    original_sql TEXT NOT NULL, -- 원본 오류 SQL
    error_message TEXT NOT NULL, -- 오류 메시지
    fixed_sql TEXT, -- 수정된 SQL (있는 경우)
    
    -- 수정 정보
    fix_explanation TEXT, -- 수정 설명
    fix_changes TEXT[], -- 변경사항 배열
    
    -- 분류 정보
    error_type VARCHAR(50), -- syntax_error, table_not_found, column_not_found, etc.
    blockchain_type VARCHAR(50), -- ethereum, polygon, arbitrum, etc.
    query_category VARCHAR(50), -- dex_trading, nft, lending, etc.
    
    -- 사용자 관련
    user_intent TEXT, -- 사용자 의도/컨텍스트
    user_feedback VARCHAR(20), -- helpful, not_helpful
    
    -- 메타데이터
    related_query_id INTEGER REFERENCES analyzed_queries(id), -- 관련 쿼리 (있는 경우)
    occurrence_count INTEGER DEFAULT 1, -- 발생 횟수
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 마지막 발생 시간
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 공통 오류 패턴 테이블
CREATE TABLE common_error_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL, -- 패턴 이름 (예: "missing_table_prefix")
    pattern_description TEXT, -- 패턴 설명
    error_regex TEXT, -- 오류 메시지 정규식
    fix_template TEXT, -- 수정 템플릿
    category VARCHAR(50), -- 카테고리
    frequency INTEGER DEFAULT 0, -- 발생 빈도
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_sql_errors_error_hash ON sql_errors(error_hash);
CREATE INDEX idx_sql_errors_error_type ON sql_errors(error_type);
CREATE INDEX idx_sql_errors_blockchain_type ON sql_errors(blockchain_type);
CREATE INDEX idx_sql_errors_query_category ON sql_errors(query_category);
CREATE INDEX idx_sql_errors_created_at ON sql_errors(created_at DESC);
CREATE INDEX idx_sql_errors_occurrence_count ON sql_errors(occurrence_count DESC);
CREATE INDEX idx_sql_errors_user_feedback ON sql_errors(user_feedback);

-- 공통 패턴 인덱스
CREATE INDEX idx_common_error_patterns_category ON common_error_patterns(category);
CREATE INDEX idx_common_error_patterns_frequency ON common_error_patterns(frequency DESC);

-- RLS (Row Level Security) 설정
ALTER TABLE sql_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sql errors" ON sql_errors FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sql errors" ON sql_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sql errors" ON sql_errors FOR UPDATE USING (true);

ALTER TABLE common_error_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view error patterns" ON common_error_patterns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert error patterns" ON common_error_patterns FOR INSERT WITH CHECK (true);

-- 샘플 공통 오류 패턴 데이터
INSERT INTO common_error_patterns (pattern_name, pattern_description, error_regex, fix_template, category, frequency) VALUES 
(
    'table_not_found',
    '테이블을 찾을 수 없음',
    'table.*not found|relation.*does not exist',
    '테이블명을 확인하고 올바른 스키마를 사용하세요',
    'table_error',
    50
),
(
    'column_not_found',
    '컬럼을 찾을 수 없음',
    'column.*not found|column.*does not exist',
    '컬럼명을 확인하고 올바른 컬럼을 사용하세요',
    'column_error',
    30
),
(
    'syntax_error',
    'SQL 문법 오류',
    'syntax error|near.*unexpected',
    'SQL 문법을 확인하고 PostgreSQL 문법을 사용하세요',
    'syntax_error',
    40
),
(
    'aggregation_error',
    '집계 함수 오류',
    'must appear in.*GROUP BY|aggregate.*not allowed',
    'GROUP BY 절에 필요한 컬럼을 추가하세요',
    'aggregation_error',
    25
),
(
    'join_error',
    'JOIN 조건 오류',
    'join.*condition|ambiguous.*column',
    'JOIN 조건을 명확히 하고 테이블 별칭을 사용하세요',
    'join_error',
    20
);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_sql_errors_updated_at 
    BEFORE UPDATE ON sql_errors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_common_error_patterns_updated_at 
    BEFORE UPDATE ON common_error_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
