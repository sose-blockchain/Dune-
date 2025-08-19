# 🎨 UI/UX 디자인 가이드라인

## 📋 디자인 철학

Bloomberg Terminal의 전문적이고 효율적인 인터페이스를 참고하여, 블록체인 데이터 분석에 특화된 직관적이고 강력한 사용자 경험을 제공합니다.

## 🎯 디자인 원칙

### 1. 전문성 (Professionalism)
- 깔끔하고 정돈된 레이아웃
- 일관된 디자인 시스템
- 전문적인 색상 팔레트

### 2. 효율성 (Efficiency)
- 빠른 정보 접근
- 직관적인 네비게이션
- 키보드 단축키 지원

### 3. 가독성 (Readability)
- 명확한 타이포그래피
- 적절한 정보 계층 구조
- 충분한 대비

### 4. 확장성 (Scalability)
- 모듈화된 컴포넌트
- 반응형 디자인
- 테마 시스템

## 🎨 색상 시스템

### 기본 색상 팔레트

```css
/* Primary Colors */
--primary-dark: #1E1E1E;      /* 메인 배경 */
--primary-light: #2D2D2D;     /* 카드 배경 */
--primary-accent: #00D4AA;    /* 강조색 (민트) */

/* Secondary Colors */
--secondary-dark: #0F0F0F;    /* 사이드바 배경 */
--secondary-light: #3A3A3A;   /* 호버 상태 */
--secondary-accent: #4ECDC4;  /* 보조 강조색 */

/* Text Colors */
--text-primary: #FFFFFF;      /* 주요 텍스트 */
--text-secondary: #B0B0B0;    /* 보조 텍스트 */
--text-muted: #808080;        /* 비활성 텍스트 */

/* Status Colors */
--success: #4ECDC4;           /* 성공 */
--warning: #FFD93D;           /* 경고 */
--error: #FF6B6B;             /* 오류 */
--info: #6C5CE7;              /* 정보 */

/* Data Visualization */
--chart-1: #00D4AA;          /* 차트 색상 1 */
--chart-2: #6C5CE7;          /* 차트 색상 2 */
--chart-3: #FF6B6B;          /* 차트 색상 3 */
--chart-4: #FFD93D;          /* 차트 색상 4 */
--chart-5: #4ECDC4;          /* 차트 색상 5 */
```

### 색상 사용 가이드라인

#### 배경색
- **메인 배경**: `#1E1E1E` - 전체 페이지 배경
- **카드 배경**: `#2D2D2D` - 컴포넌트 카드 배경
- **사이드바**: `#0F0F0F` - 네비게이션 영역
- **호버 상태**: `#3A3A3A` - 마우스 오버 시

#### 텍스트 색상
- **제목**: `#FFFFFF` - 주요 제목 및 헤더
- **본문**: `#FFFFFF` - 일반 텍스트
- **보조 정보**: `#B0B0B0` - 설명 텍스트
- **비활성**: `#808080` - 비활성화된 요소

#### 강조색
- **주요 액션**: `#00D4AA` - 버튼, 링크
- **보조 액션**: `#4ECDC4` - 보조 버튼
- **경고**: `#FFD93D` - 주의사항
- **오류**: `#FF6B6B` - 에러 메시지

## 📝 타이포그래피

### 폰트 스택

```css
/* Primary Font - Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font - JetBrains Mono */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### 폰트 크기 및 가중치

```css
/* Headings */
--h1-size: 2.5rem;           /* 40px */
--h1-weight: 700;

--h2-size: 2rem;             /* 32px */
--h2-weight: 600;

--h3-size: 1.5rem;           /* 24px */
--h3-weight: 600;

--h4-size: 1.25rem;          /* 20px */
--h4-weight: 500;

--h5-size: 1.125rem;         /* 18px */
--h5-weight: 500;

--h6-size: 1rem;             /* 16px */
--h6-weight: 500;

/* Body Text */
--body-large: 1.125rem;      /* 18px */
--body-medium: 1rem;         /* 16px */
--body-small: 0.875rem;      /* 14px */
--body-xs: 0.75rem;          /* 12px */

/* Code */
--code-size: 0.875rem;       /* 14px */
--code-weight: 400;
```

### 라인 높이

```css
--line-height-tight: 1.2;    /* 제목용 */
--line-height-normal: 1.5;   /* 본문용 */
--line-height-relaxed: 1.7;  /* 긴 텍스트용 */
```

## 📐 레이아웃 시스템

### 그리드 시스템

```css
/* Container */
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Grid */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### 스페이싱

```css
/* Spacing Scale */
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
```

### 브레이크포인트

```css
/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## 🧩 컴포넌트 디자인

### 버튼 (Buttons)

```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-accent);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #00B894;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--secondary-light);
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--secondary-light);
  border-color: var(--primary-accent);
}
```

### 카드 (Cards)

```css
.card {
  background-color: var(--primary-light);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid var(--secondary-light);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--primary-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 212, 170, 0.1);
}
```

### 입력 필드 (Input Fields)

```css
.input {
  background-color: var(--primary-dark);
  border: 1px solid var(--secondary-light);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: var(--body-medium);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-accent);
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
}

.input::placeholder {
  color: var(--text-muted);
}
```

### 테이블 (Tables)

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background-color: var(--secondary-dark);
  color: var(--text-primary);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid var(--secondary-light);
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid var(--secondary-light);
  color: var(--text-secondary);
}

.table tr:hover {
  background-color: var(--secondary-dark);
}
```

## 🎭 상태 및 애니메이션

### 로딩 상태

```css
.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--secondary-light);
  border-radius: 50%;
  border-top-color: var(--primary-accent);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 호버 효과

```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

### 페이드 인 애니메이션

```css
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 📱 반응형 디자인

### 모바일 우선 접근법

```css
/* Mobile First */
.container {
  padding: 0 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 0 3rem;
  }
}
```

### 네비게이션 반응형

```css
/* Mobile Navigation */
.nav-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--primary-dark);
  border-top: 1px solid var(--secondary-light);
  padding: 0.5rem;
}

/* Desktop Navigation */
@media (min-width: 1024px) {
  .nav-desktop {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    background-color: var(--secondary-dark);
    border-right: 1px solid var(--secondary-light);
  }
}
```

## 🎨 특수 컴포넌트

### 코드 에디터 스타일

```css
.code-editor {
  background-color: var(--primary-dark);
  border: 1px solid var(--secondary-light);
  border-radius: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--code-size);
  line-height: 1.6;
  padding: 1rem;
  overflow-x: auto;
}

.code-line {
  padding: 0.25rem 0;
  border-left: 3px solid transparent;
}

.code-line:hover {
  background-color: var(--secondary-dark);
  border-left-color: var(--primary-accent);
}

.code-line-number {
  color: var(--text-muted);
  padding-right: 1rem;
  user-select: none;
}
```

### 차트 및 그래프

```css
.chart-container {
  background-color: var(--primary-light);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid var(--secondary-light);
}

.chart-title {
  color: var(--text-primary);
  font-size: var(--h4-size);
  font-weight: var(--h4-weight);
  margin-bottom: 1rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: var(--body-small);
}
```

### 알림 및 토스트

```css
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background-color: var(--primary-light);
  border: 1px solid var(--secondary-light);
  border-radius: 0.5rem;
  padding: 1rem;
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  border-color: var(--success);
}

.toast.error {
  border-color: var(--error);
}

.toast.warning {
  border-color: var(--warning);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 🔧 접근성 (Accessibility)

### 색상 대비

```css
/* WCAG AA 준수 */
--contrast-ratio: 4.5:1;  /* 일반 텍스트 */
--contrast-ratio-large: 3:1;  /* 큰 텍스트 */
```

### 포커스 표시

```css
.focus-visible {
  outline: 2px solid var(--primary-accent);
  outline-offset: 2px;
}
```

### 스크린 리더 지원

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 📋 디자인 토큰

### CSS 변수 정의

```css
:root {
  /* Colors */
  --primary-dark: #1E1E1E;
  --primary-light: #2D2D2D;
  --primary-accent: #00D4AA;
  
  /* Typography */
  --font-family-primary: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

이 디자인 가이드라인을 따라 일관성 있고 전문적인 UI/UX를 구현할 수 있습니다. Bloomberg Terminal의 효율성과 전문성을 참고하여 블록체인 데이터 분석에 최적화된 인터페이스를 제공합니다.
