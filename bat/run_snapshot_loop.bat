@echo off
:: Smart PC Hub - Snapshot Monitor loop
:: Keeps monitor-snapshot.json fresh while the system runs.
::
:: snapshot:refresh skips any section still inside its staleness window
:: (health/performance/processes: 3s, drives/network: 10s, fileStats: 30s,
:: hardware/security: 60s), so each iteration only re-collects what actually
:: needs updating. This is what makes the Health Intelligence page "real-time"
:: instead of showing the one-time startup snapshot forever.

title Smart PC Hub - Snapshot Monitor
color 0D
echo.
echo  ==========================================
echo     SMART PC HUB - SNAPSHOT MONITOR LOOP
echo  ==========================================
echo.
echo   Keeping monitoring data fresh in the background.
echo   Leave this window open while the system runs.
echo.

SET "ROOT=%~dp0.."
SET "BE=%ROOT%\backend-laravel"

:: Single-instance guard — avoid double loops if the launcher is re-run.
:: (The other loop's artisan php.exe runs in a console with this same title.)
tasklist /FI "WINDOWTITLE eq Smart PC Hub - Snapshot Monitor" 2>nul | findstr /I /C:"php.exe" >nul 2>&1
IF NOT ERRORLEVEL 1 (
    echo   Another snapshot monitor is already running.
    echo   Close its window first, or keep using the existing one.
    timeout /t 4 /nobreak > nul
    exit /b 0
)

echo   Single-instance check passed.
echo.

:LOOP
cd /d "%BE%"
C:\php83\php.exe artisan snapshot:refresh --timeout=60
:: PC Medical Dossier scheduler — captures any due daily/weekly/monthly
:: dossier and delivers it to the assigned technician. Runs every loop so
:: daily schedules land within a minute of their next_run_at. Cloud-ready:
:: the same command plugs into any external scheduler later.
C:\php83\php.exe artisan system-reports:run
:: 10s cadence instead of 5s: halve the PowerShell/wmic sampling churn on
:: this machine. Health/performance still refresh every loop (their staleness
:: window is 3s < the loop period), so the dashboards keep feeling live.
timeout /t 10 /nobreak > nul
goto LOOP
