@echo off
chcp 65001 > nul
echo ====================================================
echo   🌊 漂流瓶 (Bottle Mail SNS) を起動しています...
echo ====================================================

set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/2] バックエンド (FastAPI) を起動中... (http://localhost:8000)
start "Bottle Message Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo [2/2] フロントエンド (React/Vite) を起動中... (http://localhost:5173)
start "Bottle Message Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo アプリケーションが起動しました！
echo ブラウザで http://localhost:5173 にアクセスしてください。
echo.
pause