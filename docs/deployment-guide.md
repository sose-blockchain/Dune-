# 🚀 배포 가이드

## 📋 개요

Dune Query Analyzer 프로젝트를 GitHub와 Vercel을 통해 배포하는 방법을 안내합니다.

## 🔗 GitHub 연결

### 1. GitHub 저장소 생성

1. GitHub에 로그인
2. 새 저장소 생성:
   - 저장소 이름: `dune-query-analyzer`
   - 설명: `Dune Analytics 쿼리 분석 및 학습 플랫폼`
   - 공개/비공개 선택
   - README 파일 생성 체크

### 2. 로컬 저장소 초기화

```bash
# 현재 디렉토리에서 Git 초기화
git init

# 원격 저장소 추가
git remote add origin https://github.com/your-username/dune-query-analyzer.git

# 첫 번째 커밋
git add .
git commit -m "Initial commit: 프로젝트 기획 및 설정 파일"

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 3. 브랜치 전략 설정

```bash
# 개발 브랜치 생성
git checkout -b develop
git push -u origin develop

# 기능 브랜치 예시
git checkout -b feature/query-analyzer
git checkout -b feature/user-authentication
git checkout -b feature/learning-dashboard
```

## ☁️ Vercel 배포

### 1. Vercel 계정 설정

1. [Vercel](https://vercel.com)에 가입/로그인
2. GitHub 계정 연결
3. 새 프로젝트 생성

### 2. 프로젝트 배포

#### 방법 1: Vercel 대시보드에서 배포

1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 선택: `dune-query-analyzer`
3. 프로젝트 설정:
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

#### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

```env
# Database
DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url

# Dune API
DUNE_API_KEY=your_dune_api_key
DUNE_API_URL=https://api.dune.com/api/v1

# OpenAI Claude API
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_API_URL=https://api.anthropic.com/v1

# JWT
JWT_SECRET=your_jwt_secret

# Server
NODE_ENV=production
```

## 🔄 CI/CD 파이프라인

### 1. GitHub Secrets 설정

GitHub 저장소 설정에서 다음 Secrets를 추가:

- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID

### 2. Vercel 토큰 생성

1. Vercel 대시보드 → Settings → Tokens
2. 새 토큰 생성
3. GitHub Secrets에 추가

### 3. 조직 및 프로젝트 ID 확인

```bash
# Vercel CLI로 확인
vercel ls
vercel projects ls
```

## 📊 배포 상태 모니터링

### 1. Vercel 대시보드

- 배포 상태 확인
- 성능 메트릭 모니터링
- 에러 로그 확인

### 2. GitHub Actions

- CI/CD 파이프라인 상태
- 테스트 결과
- 배포 로그

## 🔧 배포 후 설정

### 1. 커스텀 도메인 설정 (선택사항)

1. Vercel 프로젝트 설정 → Domains
2. 커스텀 도메인 추가
3. DNS 설정 업데이트

### 2. 환경별 설정

#### 개발 환경
```bash
# 개발 서버 실행
npm run dev
```

#### 스테이징 환경
```bash
# 스테이징 배포
vercel --env NODE_ENV=staging
```

#### 프로덕션 환경
```bash
# 프로덕션 배포
vercel --prod --env NODE_ENV=production
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 문제 확인
npm ci
```

#### 2. 환경 변수 문제
- Vercel 대시보드에서 환경 변수 확인
- GitHub Secrets 설정 확인

#### 3. 배포 실패
- GitHub Actions 로그 확인
- Vercel 배포 로그 확인

### 로그 확인

```bash
# Vercel 로그 확인
vercel logs

# 특정 배포 로그 확인
vercel logs --deployment-url=your-deployment-url
```

## 📈 성능 최적화

### 1. 빌드 최적화

- 코드 스플리팅
- 이미지 최적화
- 번들 크기 최소화

### 2. 런타임 최적화

- 캐싱 전략
- CDN 활용
- 데이터베이스 쿼리 최적화

## 🔒 보안 고려사항

### 1. 환경 변수 보안

- 민감한 정보는 환경 변수로 관리
- GitHub Secrets 활용
- Vercel 환경 변수 암호화

### 2. API 키 관리

- API 키 정기적 교체
- 접근 권한 최소화
- 사용량 모니터링

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. [Vercel 문서](https://vercel.com/docs)
2. [GitHub Actions 문서](https://docs.github.com/en/actions)
3. 프로젝트 이슈 페이지

---

이 가이드를 따라하면 GitHub와 Vercel을 통한 자동화된 배포 환경을 구축할 수 있습니다.
