# 📁 프로젝트 구조

```
dune-query-analyzer/
├── 📄 README.md                           # 프로젝트 메인 문서
├── 📄 LICENSE                             # MIT 라이선스
├── 📄 .gitignore                          # Git 무시 파일
├── 📄 .env.example                        # 환경 변수 예시
├── 📄 docker-compose.yml                  # Docker Compose 설정
├── 📄 package.json                        # 루트 패키지 설정
│
├── 📁 docs/                               # 문서 디렉토리
│   ├── 📄 project-planning.md             # 프로젝트 기획서
│   ├── 📄 ui-ux-guidelines.md             # UI/UX 디자인 가이드라인
│   ├── 📄 technical-specification.md      # 기술 명세서
│   ├── 📄 api-documentation.md            # API 문서
│   ├── 📄 deployment-guide.md             # 배포 가이드
│   └── 📄 user-guide.md                   # 사용자 가이드
│
├── 📁 frontend/                           # React 프론트엔드
│   ├── 📄 package.json                    # 프론트엔드 패키지 설정
│   ├── 📄 vite.config.ts                  # Vite 설정
│   ├── 📄 tsconfig.json                   # TypeScript 설정
│   ├── 📄 tailwind.config.js              # Tailwind CSS 설정
│   ├── 📄 .eslintrc.js                    # ESLint 설정
│   ├── 📄 .prettierrc                     # Prettier 설정
│   │
│   ├── 📁 public/                         # 정적 파일
│   │   ├── 📄 index.html                  # HTML 템플릿
│   │   ├── 📄 favicon.ico                 # 파비콘
│   │   ├── 📄 logo.svg                    # 로고
│   │   └── 📁 images/                     # 이미지 파일들
│   │
│   ├── 📁 src/                            # 소스 코드
│   │   ├── 📄 main.tsx                    # 앱 진입점
│   │   ├── 📄 App.tsx                     # 메인 앱 컴포넌트
│   │   ├── 📄 index.css                   # 글로벌 스타일
│   │   │
│   │   ├── 📁 components/                 # 재사용 가능한 컴포넌트
│   │   │   ├── 📁 common/                 # 공통 컴포넌트
│   │   │   │   ├── 📄 Button.tsx          # 버튼 컴포넌트
│   │   │   │   ├── 📄 Input.tsx           # 입력 필드 컴포넌트
│   │   │   │   ├── 📄 Card.tsx            # 카드 컴포넌트
│   │   │   │   ├── 📄 Modal.tsx           # 모달 컴포넌트
│   │   │   │   ├── 📄 Loading.tsx         # 로딩 컴포넌트
│   │   │   │   ├── 📄 Toast.tsx           # 토스트 알림 컴포넌트
│   │   │   │   └── 📄 index.ts            # 컴포넌트 내보내기
│   │   │   │
│   │   │   ├── 📁 layout/                 # 레이아웃 컴포넌트
│   │   │   │   ├── 📄 Header.tsx          # 헤더 컴포넌트
│   │   │   │   ├── 📄 Sidebar.tsx         # 사이드바 컴포넌트
│   │   │   │   ├── 📄 Footer.tsx          # 푸터 컴포넌트
│   │   │   │   ├── 📄 Navigation.tsx      # 네비게이션 컴포넌트
│   │   │   │   └── 📄 Layout.tsx          # 메인 레이아웃 컴포넌트
│   │   │   │
│   │   │   ├── 📁 forms/                  # 폼 컴포넌트
│   │   │   │   ├── 📄 QueryInputForm.tsx  # 쿼리 입력 폼
│   │   │   │   ├── 📄 LoginForm.tsx       # 로그인 폼
│   │   │   │   ├── 📄 RegisterForm.tsx    # 회원가입 폼
│   │   │   │   └── 📄 SearchForm.tsx      # 검색 폼
│   │   │   │
│   │   │   ├── 📁 data/                   # 데이터 표시 컴포넌트
│   │   │   │   ├── 📄 QueryTable.tsx      # 쿼리 테이블
│   │   │   │   ├── 📄 QueryCard.tsx       # 쿼리 카드
│   │   │   │   ├── 📄 Chart.tsx           # 차트 컴포넌트
│   │   │   │   └── 📄 ProgressBar.tsx     # 진행률 바
│   │   │   │
│   │   │   └── 📁 code/                   # 코드 관련 컴포넌트
│   │   │       ├── 📄 CodeEditor.tsx      # 코드 에디터
│   │   │       ├── 📄 CodeViewer.tsx      # 코드 뷰어
│   │   │       ├── 📄 SyntaxHighlighter.tsx # 구문 강조
│   │   │       └── 📄 LineNumbers.tsx     # 라인 번호
│   │   │
│   │   ├── 📁 pages/                      # 페이지 컴포넌트
│   │   │   ├── 📄 Home.tsx                # 홈 페이지
│   │   │   ├── 📄 QueryAnalyzer.tsx       # 쿼리 분석 페이지
│   │   │   ├── 📄 QueryRepository.tsx     # 쿼리 저장소 페이지
│   │   │   ├── 📄 LearningDashboard.tsx   # 학습 대시보드 페이지
│   │   │   ├── 📄 UserProfile.tsx         # 사용자 프로필 페이지
│   │   │   ├── 📄 Login.tsx               # 로그인 페이지
│   │   │   ├── 📄 Register.tsx            # 회원가입 페이지
│   │   │   ├── 📄 NotFound.tsx            # 404 페이지
│   │   │   └── 📄 ErrorBoundary.tsx       # 에러 경계
│   │   │
│   │   ├── 📁 hooks/                      # 커스텀 훅
│   │   │   ├── 📄 useAuth.ts              # 인증 훅
│   │   │   ├── 📄 useQuery.ts             # 쿼리 관련 훅
│   │   │   ├── 📄 useLocalStorage.ts      # 로컬 스토리지 훅
│   │   │   ├── 📄 useDebounce.ts          # 디바운스 훅
│   │   │   ├── 📄 useInfiniteScroll.ts    # 무한 스크롤 훅
│   │   │   └── 📄 useTheme.ts             # 테마 훅
│   │   │
│   │   ├── 📁 services/                   # API 서비스
│   │   │   ├── 📄 api.ts                  # API 클라이언트 설정
│   │   │   ├── 📄 authService.ts          # 인증 서비스
│   │   │   ├── 📄 queryService.ts         # 쿼리 서비스
│   │   │   ├── 📄 analysisService.ts      # 분석 서비스
│   │   │   ├── 📄 userService.ts          # 사용자 서비스
│   │   │   └── 📄 duneService.ts          # Dune API 서비스
│   │   │
│   │   ├── 📁 store/                      # 상태 관리
│   │   │   ├── 📄 authStore.ts            # 인증 상태
│   │   │   ├── 📄 queryStore.ts           # 쿼리 상태
│   │   │   ├── 📄 uiStore.ts              # UI 상태
│   │   │   └── 📄 index.ts                # 스토어 내보내기
│   │   │
│   │   ├── 📁 types/                      # TypeScript 타입 정의
│   │   │   ├── 📄 auth.ts                 # 인증 관련 타입
│   │   │   ├── 📄 query.ts                # 쿼리 관련 타입
│   │   │   ├── 📄 user.ts                 # 사용자 관련 타입
│   │   │   ├── 📄 api.ts                  # API 관련 타입
│   │   │   └── 📄 common.ts               # 공통 타입
│   │   │
│   │   ├── 📁 utils/                      # 유틸리티 함수
│   │   │   ├── 📄 constants.ts            # 상수 정의
│   │   │   ├── 📄 helpers.ts              # 헬퍼 함수
│   │   │   ├── 📄 validation.ts           # 유효성 검사
│   │   │   ├── 📄 formatting.ts           # 포맷팅 함수
│   │   │   ├── 📄 storage.ts              # 스토리지 유틸리티
│   │   │   └── 📄 dune.ts                 # Dune 관련 유틸리티
│   │   │
│   │   ├── 📁 styles/                     # 스타일 파일
│   │   │   ├── 📄 globals.css             # 글로벌 스타일
│   │   │   ├── 📄 components.css          # 컴포넌트 스타일
│   │   │   ├── 📄 utilities.css           # 유틸리티 스타일
│   │   │   └── 📄 themes.css              # 테마 스타일
│   │   │
│   │   └── 📁 assets/                     # 에셋 파일
│   │       ├── 📁 icons/                  # 아이콘 파일들
│   │       ├── 📁 images/                 # 이미지 파일들
│   │       └── 📁 fonts/                  # 폰트 파일들
│   │
│   ├── 📁 tests/                          # 테스트 파일
│   │   ├── 📁 unit/                       # 단위 테스트
│   │   ├── 📁 integration/                # 통합 테스트
│   │   ├── 📁 e2e/                        # E2E 테스트
│   │   └── 📄 setup.ts                    # 테스트 설정
│   │
│   └── 📁 dist/                           # 빌드 결과물 (자동 생성)
│
├── 📁 backend/                            # Node.js 백엔드
│   ├── 📄 package.json                    # 백엔드 패키지 설정
│   ├── 📄 tsconfig.json                   # TypeScript 설정
│   ├── 📄 nodemon.json                    # Nodemon 설정
│   ├── 📄 .eslintrc.js                    # ESLint 설정
│   ├── 📄 .prettierrc                     # Prettier 설정
│   │
│   ├── 📁 src/                            # 소스 코드
│   │   ├── 📄 app.ts                      # 앱 설정
│   │   ├── 📄 server.ts                   # 서버 시작점
│   │   ├── 📄 index.ts                    # 진입점
│   │   │
│   │   ├── 📁 config/                     # 설정 파일
│   │   │   ├── 📄 database.ts             # 데이터베이스 설정
│   │   │   ├── 📄 redis.ts                # Redis 설정
│   │   │   ├── 📄 cors.ts                 # CORS 설정
│   │   │   ├── 📄 helmet.ts               # Helmet 설정
│   │   │   └── 📄 environment.ts          # 환경 변수 설정
│   │   │
│   │   ├── 📁 controllers/                # 컨트롤러
│   │   │   ├── 📄 authController.ts       # 인증 컨트롤러
│   │   │   ├── 📄 queryController.ts      # 쿼리 컨트롤러
│   │   │   ├── 📄 analysisController.ts   # 분석 컨트롤러
│   │   │   ├── 📄 userController.ts       # 사용자 컨트롤러
│   │   │   └── 📄 learningController.ts   # 학습 컨트롤러
│   │   │
│   │   ├── 📁 models/                     # 데이터 모델
│   │   │   ├── 📄 User.ts                 # 사용자 모델
│   │   │   ├── 📄 Query.ts                # 쿼리 모델
│   │   │   ├── 📄 QueryAnalysis.ts        # 쿼리 분석 모델
│   │   │   ├── 📄 UserProgress.ts         # 사용자 진행 모델
│   │   │   └── 📄 index.ts                # 모델 내보내기
│   │   │
│   │   ├── 📁 routes/                     # 라우터
│   │   │   ├── 📄 auth.ts                 # 인증 라우터
│   │   │   ├── 📄 queries.ts              # 쿼리 라우터
│   │   │   ├── 📄 analysis.ts             # 분석 라우터
│   │   │   ├── 📄 users.ts                # 사용자 라우터
│   │   │   ├── 📄 learning.ts             # 학습 라우터
│   │   │   └── 📄 index.ts                # 라우터 내보내기
│   │   │
│   │   ├── 📁 services/                   # 비즈니스 로직
│   │   │   ├── 📄 authService.ts          # 인증 서비스
│   │   │   ├── 📄 queryService.ts         # 쿼리 서비스
│   │   │   ├── 📄 analysisService.ts      # 분석 서비스
│   │   │   ├── 📄 userService.ts          # 사용자 서비스
│   │   │   ├── 📄 learningService.ts      # 학습 서비스
│   │   │   ├── 📄 duneService.ts          # Dune API 서비스
│   │   │   ├── 📄 claudeService.ts        # Claude API 서비스
│   │   │   └── 📄 cacheService.ts         # 캐시 서비스
│   │   │
│   │   ├── 📁 middleware/                 # 미들웨어
│   │   │   ├── 📄 auth.ts                 # 인증 미들웨어
│   │   │   ├── 📄 validation.ts           # 유효성 검사 미들웨어
│   │   │   ├── 📄 rateLimit.ts            # 요청 제한 미들웨어
│   │   │   ├── 📄 errorHandler.ts         # 에러 처리 미들웨어
│   │   │   ├── 📄 cors.ts                 # CORS 미들웨어
│   │   │   └── 📄 logger.ts               # 로깅 미들웨어
│   │   │
│   │   ├── 📁 utils/                      # 유틸리티
│   │   │   ├── 📄 constants.ts            # 상수 정의
│   │   │   ├── 📄 helpers.ts              # 헬퍼 함수
│   │   │   ├── 📄 validation.ts           # 유효성 검사
│   │   │   ├── 📄 encryption.ts           # 암호화 유틸리티
│   │   │   ├── 📄 jwt.ts                  # JWT 유틸리티
│   │   │   └── 📄 sqlParser.ts            # SQL 파서 유틸리티
│   │   │
│   │   ├── 📁 types/                      # TypeScript 타입 정의
│   │   │   ├── 📄 auth.ts                 # 인증 관련 타입
│   │   │   ├── 📄 query.ts                # 쿼리 관련 타입
│   │   │   ├── 📄 user.ts                 # 사용자 관련 타입
│   │   │   ├── 📄 api.ts                  # API 관련 타입
│   │   │   └── 📄 common.ts               # 공통 타입
│   │   │
│   │   └── 📁 database/                   # 데이터베이스 관련
│   │       ├── 📄 connection.ts           # 데이터베이스 연결
│   │       ├── 📄 migrations/             # 마이그레이션 파일들
│   │       ├── 📄 seeds/                  # 시드 데이터
│   │       └── 📄 schema.sql              # 스키마 정의
│   │
│   ├── 📁 tests/                          # 테스트 파일
│   │   ├── 📁 unit/                       # 단위 테스트
│   │   ├── 📁 integration/                # 통합 테스트
│   │   ├── 📁 e2e/                        # E2E 테스트
│   │   └── 📄 setup.ts                    # 테스트 설정
│   │
│   └── 📁 logs/                           # 로그 파일 (자동 생성)
│
├── 📁 database/                           # 데이터베이스 관련
│   ├── 📄 schema.sql                      # 전체 스키마
│   ├── 📁 migrations/                     # 마이그레이션 파일들
│   │   ├── 📄 001_create_users.sql        # 사용자 테이블 생성
│   │   ├── 📄 002_create_queries.sql      # 쿼리 테이블 생성
│   │   ├── 📄 003_create_analyses.sql     # 분석 테이블 생성
│   │   └── 📄 004_create_progress.sql     # 진행 테이블 생성
│   │
│   ├── 📁 seeds/                          # 시드 데이터
│   │   ├── 📄 users.sql                   # 사용자 시드 데이터
│   │   ├── 📄 queries.sql                 # 쿼리 시드 데이터
│   │   └── 📄 categories.sql              # 카테고리 시드 데이터
│   │
│   └── 📁 scripts/                        # 데이터베이스 스크립트
│       ├── 📄 init-db.sh                  # 데이터베이스 초기화
│       ├── 📄 backup.sh                   # 백업 스크립트
│       └── 📄 restore.sh                  # 복원 스크립트
│
├── 📁 docker/                             # Docker 설정
│   ├── 📄 Dockerfile.frontend             # 프론트엔드 Dockerfile
│   ├── 📄 Dockerfile.backend              # 백엔드 Dockerfile
│   ├── 📄 docker-compose.dev.yml          # 개발 환경 Docker Compose
│   ├── 📄 docker-compose.prod.yml         # 프로덕션 환경 Docker Compose
│   ├── 📄 nginx.conf                      # Nginx 설정
│   └── 📄 .dockerignore                   # Docker 무시 파일
│
├── 📁 scripts/                            # 스크립트 파일
│   ├── 📄 setup.sh                        # 프로젝트 설정 스크립트
│   ├── 📄 dev.sh                          # 개발 서버 실행 스크립트
│   ├── 📄 build.sh                        # 빌드 스크립트
│   ├── 📄 deploy.sh                       # 배포 스크립트
│   └── 📄 test.sh                         # 테스트 실행 스크립트
│
├── 📁 .github/                            # GitHub 설정
│   ├── 📁 workflows/                      # GitHub Actions
│   │   ├── 📄 ci.yml                      # CI 파이프라인
│   │   ├── 📄 deploy.yml                  # 배포 파이프라인
│   │   └── 📄 test.yml                    # 테스트 파이프라인
│   │
│   └── 📄 pull_request_template.md        # PR 템플릿
│
└── 📁 docs/                               # 추가 문서
    ├── 📄 api-examples.md                 # API 사용 예시
    ├── 📄 troubleshooting.md              # 문제 해결 가이드
    ├── 📄 contributing.md                 # 기여 가이드
    └── 📄 changelog.md                    # 변경 이력
```

## 📋 주요 파일 설명

### 루트 레벨 파일
- **README.md**: 프로젝트 개요 및 시작 가이드
- **docker-compose.yml**: 전체 시스템을 위한 Docker Compose 설정
- **package.json**: 루트 레벨 스크립트 및 의존성 관리

### 프론트엔드 (frontend/)
- **src/components/**: 재사용 가능한 UI 컴포넌트
- **src/pages/**: 페이지 레벨 컴포넌트
- **src/hooks/**: 커스텀 React 훅
- **src/services/**: API 통신 로직
- **src/store/**: 상태 관리 (Zustand)
- **src/types/**: TypeScript 타입 정의

### 백엔드 (backend/)
- **src/controllers/**: HTTP 요청 처리
- **src/models/**: 데이터베이스 모델
- **src/routes/**: API 라우트 정의
- **src/services/**: 비즈니스 로직
- **src/middleware/**: Express 미들웨어
- **src/database/**: 데이터베이스 관련 파일

### 데이터베이스 (database/)
- **migrations/**: 데이터베이스 스키마 변경 이력
- **seeds/**: 초기 데이터
- **scripts/**: 데이터베이스 관리 스크립트

### Docker (docker/)
- **Dockerfile.frontend**: 프론트엔드 컨테이너 설정
- **Dockerfile.backend**: 백엔드 컨테이너 설정
- **docker-compose.dev.yml**: 개발 환경 설정
- **docker-compose.prod.yml**: 프로덕션 환경 설정

### 문서 (docs/)
- **project-planning.md**: 프로젝트 기획서
- **ui-ux-guidelines.md**: UI/UX 디자인 가이드라인
- **technical-specification.md**: 기술 명세서
- **api-documentation.md**: API 문서

이 구조는 확장 가능하고 유지보수가 용이한 모노레포 구조로 설계되었습니다.
