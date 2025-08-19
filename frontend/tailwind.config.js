/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bloomberg Terminal 스타일 색상
        primary: {
          dark: '#1E1E1E',      // 메인 배경
          light: '#2D2D2D',     // 카드 배경
          accent: '#00D4AA',    // 강조색 (민트)
        },
        secondary: {
          dark: '#0F0F0F',      // 사이드바 배경
          light: '#3A3A3A',     // 호버 상태
          accent: '#4ECDC4',    // 보조 강조색
        },
        text: {
          primary: '#FFFFFF',   // 주요 텍스트
          secondary: '#B0B0B0', // 보조 텍스트
          muted: '#808080',     // 비활성 텍스트
        },
        status: {
          success: '#4ECDC4',   // 성공
          warning: '#FFD93D',   // 경고
          error: '#FF6B6B',     // 오류
          info: '#6C5CE7',      // 정보
        },
        chart: {
          1: '#00D4AA',         // 차트 색상 1
          2: '#6C5CE7',         // 차트 색상 2
          3: '#FF6B6B',         // 차트 색상 3
          4: '#FFD93D',         // 차트 색상 4
          5: '#4ECDC4',         // 차트 색상 5
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

