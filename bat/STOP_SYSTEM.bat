@echo off
:: ============================================================================
::  SMART PC HUB - CLEAN SHUTDOWN
:: ============================================================================

TITLE Smart PC Hub - Shutdown

SET "ROOT=%~dp0.."
SET "BE=%ROOT%\backend-laravel"

cls
echo.
echo ========================================================================
echo      SMART PC HUB - SHUTTING DOWN...
echo ========================================================================
echo.

echo   Stopping Backend (ports 8000-8010)...
SET "F=0"
for %%P in (8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010) do (
    for /f "tokens=5" %%p in ('netstat -aon ^| findstr /C:":%%P " ^| findstr "LISTENING" 2^>nul') do (
        taskkill /F /PID %%p >nul 2>&1
        SET "F=1"
    )
)
IF "%F%"=="0" (echo     Nothing on backend ports) ELSE (echo     [OK] Backend stopped)

echo   Stopping Frontend (port 3000)...
SET "F=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%p >nul 2>&1
    SET "F=1"
)
IF "%F%"=="0" (echo     Nothing on port 3000) ELSE (echo     [OK] Frontend stopped)

echo   Closing windows...
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Backend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Frontend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Snapshot Monitor*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq SmartPCHubBackend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq SmartPCHubFrontend*" >nul 2>&1
REM --- Stop any lingering PHP processes (snapshot loop, orphaned servers) ---
taskkill /F /IM php.exe >nul 2>&1
echo     [OK] Done

echo   Cleaning temporary files...
DEL /Q "%BE%\storage\app\monitor.lock" 2>nul
DEL /Q "%BE%\storage\app\monitor-snapshot.json.tmp" 2>nul
DEL /Q "%ROOT%\backend-port.txt" 2>nul
echo     [OK] Temp files removed

echo.
echo ========================================================================
echo   ALL SERVICES STOPPED
echo ========================================================================
echo.
