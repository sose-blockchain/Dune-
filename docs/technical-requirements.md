# 기술적 요구사항 명세

## 🎯 기술 목표

### 성능 목표
- **페이지 로딩**: 3초 이내
- **쿼리 분석**: 10초 이내
- **동시 사용자**: 100명 이상
- **가용성**: 99.5% 이상

### 확장성 목표
- **데이터베이스**: 10만 개 쿼리 저장 가능
- **API 처리**: 초당 100개 요청 처리
- **캐싱**: 80% 이상 캐시 히트율

## 🏗️ 시스템 아키텍처

### 전체 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (Express)     │◄──►│     APIs        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Claude API    │
                       │   (Supabase)    │    │   Dune API      │
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Upstash)     │
                       └─────────────────┘
```

### 데이터 플로우
1. **사용자 입력** → Frontend
2. **URL 검증** → Frontend
3. **쿼리 ID 추출** → Frontend
4. **Dune API 호출** → Backend
5. **쿼리 데이터 수집** → Backend
6. **Claude API 호출** → Backend
7. **분석 결과 생성** → Backend
8. **결과 캐싱** → Redis
9. **데이터 저장** → PostgreSQL
10. **결과 반환** → Frontend

## 📋 기능별 기술 요구사항

### 1. URL 입력 및 검증

#### 요구사항
- Dune URL 형식 검증
- 쿼리 ID 추출
- 실시간 피드백

#### 기술 구현
```typescript
// URL 검증 정규식
const DUNE_URL_REGEX = /^https:\/\/dune\.com\/queries\/(\d+)/;

// 쿼리 ID 추출
function extractQueryId(url: string): string | null {
  const match = url.match(DUNE_URL_REGEX);
  return match ? match[1] : null;
}
```

### 2. Dune API 연동

#### 요구사항
- GraphQL API 호출
- 쿼리 메타데이터 수집
- 오류 처리

#### 기술 구현
```typescript
// Dune API 클라이언트
class DuneAPI {
  async getQuery(queryId: string): Promise<QueryData> {
    const query = `
      query GetQuery($id: Int!) {
        query(id: $id) {
          id
          name
          description
          query
          created_at
          updated_at
        }
      }
    `;
    
    return await this.graphqlRequest(query, { id: parseInt(queryId) });
  }
}
```

### 3. Claude API 연동

#### 요구사항
- 스트리밍 응답 처리
- 컨텍스트 관리
- 토큰 제한 관리

#### 기술 구현
```typescript
// Claude API 클라이언트
class ClaudeAPI {
  async analyzeQuery(query: string): Promise<AnalysisResult> {
    const prompt = `
      다음 SQL 쿼리를 라인별로 분석해주세요.
      각 라인에 대해 초보자도 이해할 수 있도록 설명해주세요.
      
      쿼리:
      ${query}
    `;
    
    return await this.streamRequest(prompt);
  }
}
```

### 4. 데이터베이스 설계

#### PostgreSQL 스키마
```sql
-- 쿼리 테이블 (간소화)
CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    dune_query_id VARCHAR(100) UNIQUE NOT NULL,
    dune_url TEXT NOT NULL,
    title VARCHAR(255),
    raw_query TEXT NOT NULL,
    analyzed_query JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 분석 결과 테이블
CREATE TABLE query_analyses (
    id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES queries(id),
    line_number INTEGER,
    original_code TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Redis 캐싱 전략
```typescript
// 캐싱 키 구조
const CACHE_KEYS = {
  query: (id: string) => `query:${id}`,
  analysis: (id: string) => `analysis:${id}`,
  metadata: (id: string) => `metadata:${id}`
};

// 캐시 TTL
const CACHE_TTL = {
  query: 3600,      // 1시간
  analysis: 86400,  // 24시간
  metadata: 604800  // 7일
};
```

### 5. 프론트엔드 요구사항

#### 컴포넌트 구조
```
src/
├── components/
│   ├── QueryInput/
│   │   ├── QueryInputForm.tsx
│   │   └── UrlValidator.tsx
│   ├── QueryDisplay/
│   │   ├── QueryViewer.tsx
│   │   ├── SyntaxHighlighter.tsx
│   │   └── LineNumbers.tsx
│   ├── Analysis/
│   │   ├── AnalysisResult.tsx
│   │   ├── LineAnalysis.tsx
│   │   └── LoadingSpinner.tsx
│   └── Common/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useQueryAnalysis.ts
│   ├── useDuneAPI.ts
│   └── useLocalStorage.ts
├── services/
│   ├── api.ts
│   ├── duneService.ts
│   └── claudeService.ts
└── types/
    ├── query.ts
    ├── analysis.ts
    └── api.ts
```

#### 상태 관리
```typescript
// Zustand 스토어
interface QueryStore {
  // 상태
  currentQuery: Query | null;
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  
  // 액션
  setQuery: (query: Query) => void;
  setAnalysis: (analysis: AnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  analyzeQuery: (url: string) => Promise<void>;
}
```

### 6. 백엔드 API 설계

#### RESTful API 엔드포인트
```typescript
// API 라우트 구조
app.post('/api/analyze', analyzeQuery);
app.get('/api/queries/:id', getQuery);
app.post('/api/queries', saveQuery);
app.get('/api/queries', listQueries);
app.delete('/api/queries/:id', deleteQuery);
```

#### 미들웨어 구성
```typescript
// 미들웨어 스택
app.use(cors());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // IP당 최대 100개 요청
}));
app.use(express.json());
app.use(errorHandler);
```

### 7. 보안 요구사항

#### API 보안
- **Rate Limiting**: IP당 요청 제한
- **CORS**: 허용된 도메인만 접근
- **Input Validation**: 모든 입력 검증
- **SQL Injection 방지**: 파라미터화된 쿼리

#### 데이터 보안
- **암호화**: 민감한 데이터 암호화
- **백업**: 정기적인 데이터 백업
- **접근 제어**: 데이터베이스 접근 권한 관리

### 8. 모니터링 및 로깅

#### 로깅 전략
```typescript
// Winston 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### 모니터링 지표
- **API 응답 시간**: 각 엔드포인트별 응답 시간
- **오류율**: API 오류 발생률
- **사용량**: API 호출 횟수
- **리소스 사용량**: CPU, 메모리, 디스크 사용량

### 9. 배포 및 CI/CD

#### 배포 파이프라인
```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### 환경별 설정
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경

## 🔧 개발 도구 및 라이브러리

### 프론트엔드
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **React Query**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리

### 백엔드
- **Express.js**: 웹 프레임워크
- **TypeScript**: 타입 안전성
- **Prisma**: ORM
- **Winston**: 로깅
- **Joi**: 입력 검증
- **Helmet**: 보안

### 개발 도구
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅
- **Husky**: Git 훅
- **Jest**: 테스팅
- **Playwright**: E2E 테스팅

## 📊 성능 최적화

### 프론트엔드 최적화
- **코드 스플리팅**: 라우트별 코드 분할
- **이미지 최적화**: WebP 포맷 사용
- **캐싱**: 브라우저 캐싱 활용
- **번들 최적화**: Tree shaking 적용

### 백엔드 최적화
- **데이터베이스 인덱싱**: 쿼리 성능 향상
- **Redis 캐싱**: 자주 사용되는 데이터 캐싱
- **커넥션 풀링**: 데이터베이스 연결 최적화
- **압축**: gzip 압축 적용

## 🧪 테스팅 전략

### 단위 테스트
- **컴포넌트 테스트**: React Testing Library
- **유틸리티 테스트**: Jest
- **API 테스트**: Supertest

### 통합 테스트
- **API 통합 테스트**: 전체 API 플로우 테스트
- **데이터베이스 테스트**: 실제 DB 연동 테스트

### E2E 테스트
- **사용자 시나리오 테스트**: Playwright
- **크로스 브라우저 테스트**: 다양한 브라우저 지원
