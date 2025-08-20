# 🚀 Vercel 배포 가이드

## 📋 배포 단계

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 프로젝트 배포
```bash
vercel
```

### 4. 환경변수 설정
Vercel 대시보드에서 다음 환경변수를 설정하세요:

#### 필수 환경변수
```
DUNE_API_KEY=your_actual_dune_api_key
CLAUDE_API_KEY=your_actual_claude_api_key
```

#### 선택적 환경변수
```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

### 5. 프로덕션 배포
```bash
vercel --prod
```

## 🔧 배포 후 확인사항

1. **API 엔드포인트 테스트**
   - `https://your-domain.vercel.app/api/health`
   - `https://your-domain.vercel.app/api/dune/graphql`
   - `https://your-domain.vercel.app/api/claude/messages`

2. **프론트엔드 테스트**
   - `https://your-domain.vercel.app`

## 📁 프로젝트 구조 (배포용)

```
/
├── api/                    # Vercel Functions
│   ├── dune/
│   │   └── graphql.js     # Dune API 프록시
│   ├── claude/
│   │   └── messages.js    # Claude API 프록시
│   └── health.js          # 헬스 체크
├── frontend/              # React 앱
│   ├── src/
│   ├── public/
│   └── package.json
├── vercel.json           # Vercel 설정
└── package.json          # 루트 설정
```

## 🚨 문제 해결

### 환경변수 문제
- Vercel 대시보드에서 환경변수가 올바르게 설정되었는지 확인
- 배포 후 환경변수 변경 시 재배포 필요

### API 오류
- Vercel Functions 로그 확인
- API 키 유효성 검증

### 빌드 오류
- Node.js 버전 확인 (18+ 권장)
- 의존성 설치 확인
