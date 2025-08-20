# 🚀 Dune Query Analyzer

Dune Analytics 쿼리를 AI가 라인별로 분석해주는 학습 플랫폼입니다.

## 📋 프로젝트 개요

이 프로젝트는 복잡한 Dune Analytics 쿼리를 초보자도 이해할 수 있도록 AI가 라인별로 상세히 설명해주는 웹 애플리케이션입니다.

### 주요 기능
- 🔍 **Dune 쿼리 분석**: URL 입력으로 쿼리 자동 분석
- 🤖 **AI 설명**: Claude AI를 활용한 라인별 상세 설명
- 📚 **학습 플랫폼**: 블록체인 데이터 분석 학습
- 💾 **결과 저장**: 분석 결과 저장 및 재학습

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** (Bloomberg Terminal 스타일)
- **React Query** (서버 상태 관리)
- **Zustand** (클라이언트 상태 관리)
- **React Hook Form** (폼 관리)

### Backend
- **Node.js** + **Express.js**
- **Axios** (HTTP 클라이언트)
- **CORS** (크로스 오리진 설정)
- **Helmet** (보안 헤더)

### External APIs
- **Dune Analytics API** (쿼리 데이터)
- **Claude API** (AI 분석)

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/dune-query-analyzer.git
cd dune-query-analyzer
```

### 2. 환경 변수 설정

#### 통합 환경 변수 설정
```bash
# 루트 디렉토리에서
cp env.example .env
```

`.env` 파일을 편집하여 다음 값들을 설정하세요:
```env
# 🔑 API 키 설정 (필수)
DUNE_API_KEY=your_actual_dune_api_key
CLAUDE_API_KEY=your_actual_claude_api_key

# 📡 프론트엔드 API 설정 (자동 설정됨)
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_DUNE_API_KEY=your_actual_dune_api_key
REACT_APP_CLAUDE_API_KEY=your_actual_claude_api_key
```

### 3. 의존성 설치

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 4. 개발 서버 실행

#### Backend (터미널 1)
```bash
cd backend
npm run dev
```

#### Frontend (터미널 2)
```bash
cd frontend
npm start
```

### 5. 브라우저에서 확인
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health

## 🔧 API 키 설정

### Dune API 키
1. [Dune Analytics](https://dune.com)에 가입
2. API 키 발급 (Settings > API Keys)
3. 환경 변수에 설정

### Claude API 키
1. [Anthropic](https://console.anthropic.com)에 가입
2. API 키 발급
3. 환경 변수에 설정

## 📁 프로젝트 구조

```
dune-query-analyzer/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── services/        # API 서비스
│   │   ├── types/          # TypeScript 타입
│   │   └── utils/          # 유틸리티 함수
│   └── package.json
├── backend/                 # Node.js 백엔드
│   ├── src/
│   │   └── index.js        # Express 서버
│   └── package.json
├── docs/                   # 프로젝트 문서
├── database-schema.sql     # 데이터베이스 스키마
└── vercel.json            # Vercel 배포 설정
```

## 🧪 테스트

### API 연결 테스트
프론트엔드에서 "API 테스트" 버튼을 클릭하여 Dune API와 Claude API 연결을 확인할 수 있습니다.

### 수동 테스트
1. Dune 쿼리 URL 입력 (예: https://dune.com/queries/123456)
2. "분석하기" 버튼 클릭
3. 분석 결과 확인

## 🚀 배포

### Vercel 배포
1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정
3. 자동 배포

### 수동 배포
```bash
# Frontend 빌드
cd frontend
npm run build

# Backend 배포
cd backend
npm start
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. CORS 오류
- 백엔드 CORS 설정 확인
- 환경 변수 `ALLOWED_ORIGINS` 확인

#### 2. API 키 오류
- 환경 변수 설정 확인
- API 키 유효성 확인

#### 3. 빌드 오류
- Node.js 버전 확인 (18+ 권장)
- 의존성 재설치: `npm ci`

## 📚 문서

- [기술 요구사항](docs/technical-requirements.md)
- [기술 명세서](docs/technical-specification.md)
- [배포 가이드](docs/deployment-guide.md)
- [UI/UX 가이드라인](docs/ui-ux-guidelines.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하면 [GitHub Issues](https://github.com/your-username/dune-query-analyzer/issues)에 등록해주세요.

---

**Dune Query Analyzer** - 블록체인 데이터 분석을 쉽고 재미있게! 🚀
