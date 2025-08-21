@echo off
echo "=== Dune Query Analyzer 로컬 개발 서버 시작 ==="
echo.
echo "1. 백엔드 API 서버 시작 중..."
start "Backend" cmd /k "vercel dev --listen 3000"
timeout /t 5
echo.
echo "2. 프론트엔드 개발 서버 시작 중..."
start "Frontend" cmd /k "cd frontend && npm start"
echo.
echo "=== 서버 시작 완료 ==="
echo "프론트엔드: http://localhost:3001"
echo "백엔드 API: http://localhost:3000/api"
echo.
