-- SQL 오류 정보 저장 테이블 추가
-- 기존 database-schema.sql에 추가하여 실행하세요

-- SQL 오류 및 수정 정보 저장
CREATE TABLE sql_errors (
    id SERIAL PRIMARY KEY,
    
    -- 오류 식별 정보
    error_hash VARCHAR(64) UNIQUE NOT NULL, -- 원본 SQL + 오류 메시지의 해시
    original_sql TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_type VARCHAR(100), -- syntax_error, table_not_found, column_not_found 등
    
    -- 수정 정보
    fixed_sql TEXT,
    fix_explanation TEXT,
    fix_changes TEXT[], -- 변경사항 목록
    
    -- 컨텍스트 정보
    user_intent TEXT, -- 사용자가 원했던 것
    blockchain_type VARCHAR(50),
    query_category VARCHAR(100),
    
    -- AI 학습을 위한 메타데이터
    fix_success_rate DECIMAL(3,2) DEFAULT 0.0, -- 수정 성공률 (0.00-1.00)
    user_feedback INTEGER, -- 1: 도움됨, 0: 보통, -1: 도움안됨
    common_pattern BOOLEAN DEFAULT FALSE, -- 자주 발생하는 패턴인지
    
    -- 관련 정보
    related_query_id INTEGER REFERENCES analyzed_queries(id) ON DELETE SET NULL,
    
    -- 빈도 및 통계
    occurrence_count INTEGER DEFAULT 1,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자별 SQL 생성 히스토리
CREATE TABLE sql_generation_history (
    id SERIAL PRIMARY KEY,
    
    -- 요청 정보
    user_query TEXT NOT NULL, -- 사용자의 자연어 요청
    user_session VARCHAR(100), -- 세션 식별자 (익명 사용자 추적용)
    
    -- 생성된 SQL 정보
    generated_sql TEXT NOT NULL,
    ai_explanation TEXT,
    ai_confidence DECIMAL(3,2), -- 0.00-1.00
    
    -- 사용된 컨텍스트
    related_queries_used INTEGER[], -- 참고한 기존 쿼리 ID들
    detected_blockchain VARCHAR(50),
    detected_protocols TEXT[],
    
    -- 결과 및 피드백
    user_feedback INTEGER, -- 1: 좋음, 0: 보통, -1: 나쁨
    execution_result VARCHAR(20), -- success, error, not_tested
    execution_error_id INTEGER REFERENCES sql_errors(id) ON DELETE SET NULL,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 오류 패턴 분석을 위한 뷰
CREATE VIEW common_error_patterns AS
SELECT 
    error_type,
    COUNT(*) as occurrence_count,
    AVG(fix_success_rate) as avg_fix_success_rate,
    ARRAY_AGG(DISTINCT blockchain_type) as affected_blockchains,
    ARRAY_AGG(DISTINCT query_category) as affected_categories
FROM sql_errors 
WHERE occurrence_count >= 3
GROUP BY error_type
ORDER BY occurrence_count DESC;

-- AI 학습을 위한 성공적인 수정 사례 뷰
CREATE VIEW successful_fixes AS
SELECT 
    se.original_sql,
    se.error_message,
    se.fixed_sql,
    se.fix_explanation,
    se.fix_changes,
    se.user_intent,
    se.blockchain_type,
    se.query_category,
    se.fix_success_rate
FROM sql_errors se
WHERE se.fix_success_rate >= 0.7 
AND se.user_feedback >= 0
ORDER BY se.fix_success_rate DESC, se.occurrence_count DESC;

-- 인덱스 생성
CREATE INDEX idx_sql_errors_hash ON sql_errors(error_hash);
CREATE INDEX idx_sql_errors_type ON sql_errors(error_type);
CREATE INDEX idx_sql_errors_blockchain ON sql_errors(blockchain_type);
CREATE INDEX idx_sql_errors_category ON sql_errors(query_category);
CREATE INDEX idx_sql_errors_pattern ON sql_errors(common_pattern);
CREATE INDEX idx_sql_errors_occurrence ON sql_errors(occurrence_count DESC);

CREATE INDEX idx_generation_history_session ON sql_generation_history(user_session);
CREATE INDEX idx_generation_history_blockchain ON sql_generation_history(detected_blockchain);
CREATE INDEX idx_generation_history_created ON sql_generation_history(created_at DESC);

-- RLS 설정
ALTER TABLE sql_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sql_errors" ON sql_errors FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sql_errors" ON sql_errors FOR INSERT WITH CHECK (true);

ALTER TABLE sql_generation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view generation_history" ON sql_generation_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert generation_history" ON sql_generation_history FOR INSERT WITH CHECK (true);

-- 오류 해시 생성 함수
CREATE OR REPLACE FUNCTION generate_error_hash(original_sql TEXT, error_msg TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(original_sql || '|||' || error_msg, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_sql_errors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sql_errors_updated_at
    BEFORE UPDATE ON sql_errors
    FOR EACH ROW
    EXECUTE FUNCTION update_sql_errors_updated_at();
