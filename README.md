# 🐪 Dune Query Analyzer & Learning Platform

Dune Analytics의 쿼리를 분석하고 학습 자료로 활용할 수 있는 웹 플랫폼입니다.

## 📋 프로젝트 개요

### 목적
- Dune 쿼리 URL을 입력하면 해당 쿼리를 분석하여 초보자도 이해할 수 있도록 단계별 설명 제공
- 분석된 쿼리를 데이터베이스에 저장하여 Claude 프로젝트 학습 자료로 활용
- Bloomberg Terminal 스타일의 전문적인 UI/UX 제공

### 주요 기능
1. **쿼리 분석기**: Dune 쿼리 URL 입력 → API로 쿼리 데이터 가져오기 → 라인별 상세 설명
2. **학습 자료 저장소**: 분석된 쿼리를 카테고리별로 분류하여 저장
3. **검색 및 필터링**: 저장된 쿼리를 다양한 조건으로 검색
4. **학습 대시보드**: 사용자별 학습 진행 상황 추적

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (쿼리 저장) + Redis (캐싱)
- **AI/ML**: OpenAI Claude API (쿼리 분석)
- **Deployment**: Docker + AWS/Vercel

### 데이터베이스 스키마

#### users 테이블
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    subscription_tier VARCHAR(20) DEFAULT 'free'
);
```

#### queries 테이블
```sql
CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    dune_query_id VARCHAR(100) UNIQUE NOT NULL,
    dune_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20),
    tags TEXT[],
    raw_query TEXT NOT NULL,
    analyzed_query JSONB,
    explanation TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### query_analyses 테이블
```sql
CREATE TABLE query_analyses (
    id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES queries(id),
    line_number INTEGER,
    original_code TEXT,
    explanation TEXT,
    difficulty_level VARCHAR(20),
    related_concepts TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### user_learning_progress 테이블
```sql
CREATE TABLE user_learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_id INTEGER REFERENCES queries(id),
    completion_status VARCHAR(20) DEFAULT 'not_started',
    time_spent INTEGER DEFAULT 0,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 기능 상세 명세

### 1. 쿼리 분석기 (Query Analyzer)

#### 입력 단계
- Dune 쿼리 URL 입력 폼
- URL 유효성 검증
- 쿼리 미리보기 기능

#### 분석 단계
- Dune API를 통한 쿼리 데이터 추출
- SQL 구문 파싱 및 구조 분석
- Claude API를 통한 라인별 설명 생성

#### 출력 단계
- 라인별 상세 설명 (초보자 친화적)
- SQL 키워드 및 함수 설명
- 관련 개념 및 학습 자료 링크
- 난이도 평가 및 추천 학습 경로

### 2. 학습 자료 관리 (Learning Repository)

#### 저장 기능
- 분석된 쿼리 자동 저장
- 카테고리별 분류 (DeFi, NFT, Gaming, etc.)
- 태그 시스템
- 난이도 레벨 설정

#### 검색 및 필터링
- 키워드 검색
- 카테고리별 필터링
- 난이도별 필터링
- 태그별 필터링
- 최신순/인기순 정렬

### 3. 학습 대시보드 (Learning Dashboard)

#### 개인 학습 현황
- 완료한 쿼리 수
- 학습 시간 통계
- 난이도별 진행 상황
- 학습 목표 설정 및 달성률

#### 추천 시스템
- 사용자 수준에 맞는 쿼리 추천
- 연관된 쿼리 추천
- 학습 경로 제안

## 🎨 UI/UX 디자인

### Bloomberg Terminal 스타일 가이드라인

#### 색상 팔레트
- **Primary**: #1E1E1E (다크 그레이)
- **Secondary**: #2D2D2D (라이트 그레이)
- **Accent**: #00D4AA (민트 그린)
- **Text**: #FFFFFF (화이트)
- **Warning**: #FF6B6B (레드)
- **Success**: #4ECDC4 (시안)

#### 레이아웃
- 다크 테마 기반
- 고정 사이드바 네비게이션
- 탭 기반 콘텐츠 영역
- 실시간 데이터 업데이트 표시
- 전문적인 차트 및 그래프 스타일

#### 컴포넌트
- 모던한 카드 디자인
- 호버 효과 및 애니메이션
- 반응형 그리드 시스템
- 전문적인 폰트 (Inter, JetBrains Mono)

## 🔌 API 설계

### Dune API 연동
```typescript
interface DuneQueryResponse {
  query_id: string;
  name: string;
  description: string;
  query: string;
  parameters: QueryParameter[];
  result: QueryResult;
}

interface QueryParameter {
  key: string;
  type: string;
  value: any;
}

interface QueryResult {
  rows: any[];
  columns: string[];
  metadata: {
    row_count: number;
    execution_time: number;
  };
}
```

### 내부 API 엔드포인트

#### 쿼리 분석
- `POST /api/analyze` - 쿼리 분석 요청
- `GET /api/analyze/:id` - 분석 결과 조회
- `GET /api/analyze/:id/explanation` - 상세 설명 조회

#### 학습 자료 관리
- `GET /api/queries` - 쿼리 목록 조회
- `POST /api/queries` - 새 쿼리 저장
- `PUT /api/queries/:id` - 쿼리 정보 수정
- `DELETE /api/queries/:id` - 쿼리 삭제

#### 사용자 관리
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/profile` - 프로필 수정

#### 학습 진행 관리
- `GET /api/learning/progress` - 학습 진행 상황
- `POST /api/learning/progress` - 학습 진행 업데이트
- `GET /api/learning/recommendations` - 추천 쿼리

## 🚀 개발 로드맵

### Phase 1: MVP (4주)
- [ ] 프로젝트 초기 설정
- [ ] 기본 UI 컴포넌트 개발
- [ ] Dune API 연동
- [ ] 쿼리 분석 기본 기능
- [ ] 데이터베이스 스키마 구현

### Phase 2: 핵심 기능 (6주)
- [ ] Claude API 연동
- [ ] 상세 쿼리 분석 기능
- [ ] 사용자 인증 시스템
- [ ] 쿼리 저장 및 관리
- [ ] 검색 및 필터링 기능

### Phase 3: 고급 기능 (4주)
- [ ] 학습 대시보드
- [ ] 추천 시스템
- [ ] 사용자 진행 상황 추적
- [ ] 성능 최적화

### Phase 4: 배포 및 운영 (2주)
- [ ] 프로덕션 배포
- [ ] 모니터링 시스템 구축
- [ ] 사용자 피드백 수집
- [ ] 버그 수정 및 개선

## 📁 프로젝트 구조

```
dune-query-analyzer/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── utils/          # 유틸리티 함수
│   ├── public/             # 정적 파일
│   └── package.json
├── backend/                 # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/    # 컨트롤러
│   │   ├── models/         # 데이터 모델
│   │   ├── routes/         # 라우터
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middleware/     # 미들웨어
│   │   └── utils/          # 유틸리티
│   ├── tests/              # 테스트 파일
│   └── package.json
├── database/               # 데이터베이스 스키마 및 마이그레이션
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── docs/                   # 문서
│   ├── api/
│   ├── deployment/
│   └── user-guide/
├── docker/                 # Docker 설정
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### 환경 변수
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dune_analyzer
REDIS_URL=redis://localhost:6379

# Dune API
DUNE_API_KEY=your_dune_api_key
DUNE_API_URL=https://api.dune.com/api/v1

# OpenAI Claude API
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_API_URL=https://api.anthropic.com/v1

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
NODE_ENV=development
```

## 📊 성능 및 확장성

### 성능 최적화
- Redis 캐싱을 통한 API 응답 속도 개선
- 데이터베이스 인덱싱 최적화
- 프론트엔드 코드 스플리팅
- 이미지 및 정적 파일 최적화

### 확장성 고려사항
- 마이크로서비스 아키텍처 준비
- 로드 밸런싱 지원
- 데이터베이스 샤딩 가능성
- CDN 활용

## 🔒 보안 고려사항

### 인증 및 권한
- JWT 기반 인증
- Role-based Access Control (RBAC)
- API 요청 제한 (Rate Limiting)

### 데이터 보안
- SQL Injection 방지
- XSS 공격 방지
- CSRF 토큰 사용
- 민감 정보 암호화

## 📈 모니터링 및 로깅

### 모니터링 도구
- Application Performance Monitoring (APM)
- 데이터베이스 성능 모니터링
- 서버 리소스 모니터링
- 사용자 행동 분석

### 로깅
- 구조화된 로깅 (JSON 형식)
- 로그 레벨별 관리
- 로그 보관 정책
- 에러 추적 및 알림

## 🤝 기여 가이드라인

### 개발 프로세스
1. 이슈 생성
2. 브랜치 생성 (`feature/issue-number`)
3. 개발 및 테스트
4. Pull Request 생성
5. 코드 리뷰
6. 머지 및 배포

### 코드 스타일
- ESLint + Prettier 사용
- TypeScript strict 모드
- 커밋 메시지 컨벤션 준수
- 테스트 커버리지 80% 이상 유지

## 📞 연락처 및 지원

- **프로젝트 관리자**: [이메일]
- **기술 문의**: [이메일]
- **버그 리포트**: GitHub Issues
- **기능 요청**: GitHub Discussions

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**참고 자료**
- [Dune Analytics GitHub](https://github.com/duneanalytics)
- [Dune API Documentation](https://docs.dune.com/api/)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference)
