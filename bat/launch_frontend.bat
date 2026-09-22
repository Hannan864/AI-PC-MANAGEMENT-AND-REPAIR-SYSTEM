@echo off
:: Frontend launcher — called by START_SYSTEM.bat
title Smart PC Hub - Frontend
color 0B

SET "ROOT=%~dp0.."

:: Point Vite at the backend port actually in use. launch_backend.bat writes
:: the chosen port to backend-port.txt (8000 normally, but it falls back to
:: 8001+ when another program squats on 8000). Vite gives environment
:: variables that already exist when it starts priority over .env files, so
:: this overrides the default VITE_API_URL in frontend\.env.
SET "BE_PORT=8000"
IF EXIST "%ROOT%\backend-port.txt" SET /p BE_PORT=<"%ROOT%\backend-port.txt"
SET "BE_PORT=%BE_PORT: =%"
SET "VITE_API_URL=http://localhost:%BE_PORT%/api"

echo.
echo   ==========================================
echo      SMART PC HUB - REACT FRONTEND
echo   ==========================================
echo.
echo   Status:   STARTING...
echo   URL:      http://localhost:3000
echo   API:      %VITE_API_URL%
echo   Driver:   React 19 + TypeScript + Vite
echo.
echo   ------------------------------------------
echo   Compiling and serving...
echo   ------------------------------------------
echo.
cd /d "%~dp0..\frontend"
call npm run dev
