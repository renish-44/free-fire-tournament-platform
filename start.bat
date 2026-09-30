@echo off
title Free Fire Tournament - Full Stack
echo ============================================
echo   Free Fire Tournament - Starting Servers
echo ============================================
echo.

:: Start Backend (FastAPI with uvicorn)
echo [1/2] Starting Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d d:\free fire\free-fire-tournament\backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Small delay to let backend initialize first
timeout /t 3 /nobreak >nul

:: Start Frontend (Vite dev server)
echo [2/2] Starting Frontend (Vite)...
start "Frontend - Vite" cmd /k "cd /d d:\free fire\free-fire-tournament\frontend && npm run dev"

echo.
echo ============================================
echo   Both servers are running!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Close this window or press any key to exit.
echo (The servers will keep running in their own windows)
pause >nul
