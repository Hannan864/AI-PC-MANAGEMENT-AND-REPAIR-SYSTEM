@echo off
TITLE Smart PC Hub - System Launcher
color 0B
cls
echo.
echo  ========================================================
echo           SMART PC HUB - SYSTEM LAUNCHER
echo  ========================================================
echo.
echo   Backend:  Laravel 11 + PHP 8.3 + SQLite
echo   Frontend: React 19 + TypeScript + Vite
echo.
echo  --------------------------------------------------------
echo.

SET "ROOT=%~dp0.."
SET "BE=%ROOT%\backend-laravel"
SET "FE=%ROOT%\frontend"
SET "PORT_FILE=%ROOT%\backend-port.txt"

echo   [PRE-FLIGHT] Running system checks...
echo.

SET "OK=1"

IF NOT EXIST "C:\php83\php.exe" (
    echo   [X]   PHP 8.3 not found
    SET "OK=0"
) ELSE (echo   [OK]  PHP 8.3)

IF NOT EXIST "%BE%\artisan" (
    echo   [X]   Laravel backend not found
    SET "OK=0"
) ELSE (echo   [OK]  Laravel backend)

IF NOT EXIST "%FE%\package.json" (
    echo   [X]   React frontend not found
    SET "OK=0"
) ELSE (echo   [OK]  React frontend)

IF NOT EXIST "%BE%\vendor\autoload.php" (
    echo   [X]   Composer vendor missing
    SET "OK=0"
) ELSE (echo   [OK]  Composer vendor)

IF NOT EXIST "%BE%\database\database.sqlite" (
    echo   [~]  SQLite DB missing - will create and seed
    type nul > "%BE%\database\database.sqlite"
    SET "NEEDS_SEED=1"
) ELSE (echo   [OK]  SQLite database)

IF NOT EXIST "%FE%\node_modules" (
    echo   [~]  node_modules missing - will install
    SET "NEEDS_INSTALL=1"
) ELSE (echo   [OK]  node_modules)

IF "%OK%"=="0" (
    echo.
    echo   FATAL: Fix the issues above and retry.
    echo.
    pause
    exit /b 1
)

echo.
echo  --------------------------------------------------------
echo.

IF "%NEEDS_SEED%"=="1" (
    echo   [SETUP] Creating database and seeding demo data...
    cd /d "%BE%"
    C:\php83\php.exe artisan migrate:fresh --seed --force
    IF ERRORLEVEL 1 (
        echo   [X]   Migration failed
        pause
        exit /b 1
    )
    echo   [OK]  Database ready
    cd /d "%ROOT%"
    echo.
)

IF "%NEEDS_INSTALL%"=="1" (
    echo   [SETUP] Installing frontend dependencies...
    cd /d "%FE%"
    call npm install
    IF ERRORLEVEL 1 (
        echo   [X]   npm install failed
        pause
        exit /b 1
    )
    echo   [OK]  Dependencies installed
    cd /d "%ROOT%"
    echo.
)

echo   [CLEANUP] Freeing backend ports 8000-8010 and frontend port 3000...

REM --- Kill anything listening on the backend port range or the frontend ---
for %%P in (8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010 3000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /C:":%%P " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM --- Kill orphaned PHP processes: "php artisan serve" can leave its child
REM --- "php -S" server running after the parent is killed, which keeps
REM --- the backend port occupied. The snapshot monitor is restarted later anyway.
taskkill /F /IM php.exe >nul 2>&1

REM --- Close leftover launcher windows from earlier runs. A stale backend
REM --- window can restart its server right after this cleanup and steal
REM --- the port from the fresh instance ("Failed to listen"). Closing
REM --- them here makes every start deterministic.
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Backend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Frontend*" >nul 2>&1
taskkill /FI "WINDOWTITLE eq Smart PC Hub - Snapshot Monitor*" >nul 2>&1

REM --- Remove the port marker from any previous run. launch_backend.bat
REM --- rewrites it with the port it actually manages to bind.
if exist "%PORT_FILE%" del /q "%PORT_FILE%" >nul 2>&1

echo   [OK]  Ports free

REM --- Wait until the primary backend port has no LISTENING socket before
REM --- starting the backend. If something stubborn still holds 8000, the
REM --- backend launcher falls back to 8001+ instead of failing.
set /a PORT_WAIT=0
:WAIT_PORT_FREE
netstat -aon | findstr /C:":8000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto PORT_FREE
set /a PORT_WAIT+=1
if %PORT_WAIT% GEQ 15 goto PORT_FREE
timeout /t 1 /nobreak > nul
goto WAIT_PORT_FREE
:PORT_FREE
netstat -aon | findstr /C:":8000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   [~]   Port 8000 is still held by another program - the backend will use a fallback port.
)
echo.

echo   [1/5]  Starting Backend...
start "" "%ROOT%\bat\launch_backend.bat"

echo   [WAIT]  Waiting for Laravel to initialise...
set /a BACKEND_WAIT=0
:WAIT_BACKEND
set "BE_PORT=8000"
if exist "%PORT_FILE%" set /p BE_PORT=<"%PORT_FILE%"
set "BE_PORT=%BE_PORT: =%"
set /a BACKEND_WAIT+=1
if %BACKEND_WAIT% GEQ 45 goto BACKEND_TIMEOUT
timeout /t 2 /nobreak > nul
curl -s -m 5 "http://localhost:%BE_PORT%/api/v1/system/health" >nul 2>&1
IF ERRORLEVEL 1 goto WAIT_BACKEND
echo   [OK]  Backend responding on port %BE_PORT%
echo.
goto BACKEND_READY
:BACKEND_TIMEOUT
echo   [X]   Backend did not become ready on port %BE_PORT% after 90 seconds.
echo        Check the backend window for errors, then run the launcher again.
pause
exit /b 1
:BACKEND_READY

echo   [2/5]  Building monitoring snapshot...
cd /d "%BE%"
C:\php83\php.exe artisan snapshot:refresh --timeout=120
cd /d "%ROOT%"
IF NOT EXIST "%BE%\storage\app\monitor-snapshot.json" (
    echo   [X]   Snapshot file not created
    pause
    exit /b 1
)
echo   [OK]  Snapshot ready
echo.

echo   [MONITOR] Starting continuous snapshot refresher...
start "Smart PC Hub - Snapshot Monitor" "%ROOT%\bat\run_snapshot_loop.bat"
echo   [OK]  Monitoring loop started (keeps Health/App data fresh)
echo.

echo   [3/5]  Starting Frontend...
start "" "%ROOT%\bat\launch_frontend.bat"

echo   [WAIT]  Waiting for Vite to compile...
set /a FRONTEND_WAIT=0
:WAIT_FRONTEND
set /a FRONTEND_WAIT+=1
if %FRONTEND_WAIT% GEQ 30 goto FRONTEND_TIMEOUT
timeout /t 2 /nobreak > nul
curl -s http://localhost:3000 >nul 2>&1
IF ERRORLEVEL 1 goto WAIT_FRONTEND
echo   [OK]  Frontend ready
echo.
goto FRONTEND_READY
:FRONTEND_TIMEOUT
echo   [X]   Frontend did not become ready on port 3000 after 60 seconds.
echo        Check the frontend window for errors, then run the launcher again.
pause
exit /b 1
:FRONTEND_READY

echo   [4/5]  Opening your app...
start "" "http://localhost:3000"
echo   [OK]  Browser opened
echo.

echo  ========================================================
echo                  ALL SERVICES RUNNING
echo  ========================================================
echo.
echo   Backend API     - http://localhost:%BE_PORT%
echo   Frontend App    - http://localhost:3000
echo   Inspector       - http://localhost:%BE_PORT%/demo
echo.
echo   Login credentials:
echo     Admin       admin@smartpchub.test      / password
echo     Technician  ali.hassan@smartpchub.test / password
echo     Customer    customer1@smartpchub.test  / password
echo.
echo  --------------------------------------------------------
echo.
echo   System started successfully. Returning to launcher...
