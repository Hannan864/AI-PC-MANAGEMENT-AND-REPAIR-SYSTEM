@echo off
:: Backend launcher - called by START_SYSTEM.bat
:: Ensures only ONE instance of artisan serve runs.
::
:: Instead of dying with "Failed to listen on 127.0.0.1:8000" whenever another
:: program squats on port 8000, this launcher walks a fallback chain
:: (8000, 8001, ... 8010) and serves on the first free port. The chosen port
:: is written to backend-port.txt so START_SYSTEM.bat and launch_frontend.bat
:: can follow it. When the server is stopped on purpose (shutdown), the
:: launcher exits quietly - it never resurrects itself on another port.

title Smart PC Hub - Backend API
color 0A

SET "ROOT=%~dp0.."
SET "BE=%ROOT%\backend-laravel"
SET "PORT_FILE=%ROOT%\backend-port.txt"
SET "SERVE_LOG=%TEMP%\smartpchub-serve.log"

:: --- If port 8000 is already serving THIS API, reuse it instead of starting
:: --- a second instance. The health check makes sure it is really our
:: --- backend and not some unrelated program squatting on the port.
netstat -aon | findstr /C:":8000 " | findstr "LISTENING" >nul 2>&1
IF ERRORLEVEL 1 goto FRESH_START
set "HC="
for /f %%c in ('curl -s -m 3 -o nul -w "%%{http_code}" http://localhost:8000/api/v1/system/health 2^>nul') do set "HC=%%c"
IF NOT "%HC%"=="200" goto FRESH_START
echo.
echo   Backend already running on port 8000 - reusing existing instance.
echo.
<nul set /p "=8000" > "%PORT_FILE%"
goto KEEP_OPEN

:FRESH_START
echo.
echo   ==========================================
echo      SMART PC HUB - BACKEND API SERVER
echo   ==========================================
echo.
echo   Status:   STARTING...
echo   Driver:   PHP 8.3 + SQLite
echo.
echo   ------------------------------------------
echo   Waiting for requests...
echo   ------------------------------------------
echo.
cd /d "%BE%"

:: Enable project-local OPcache — drops each request from ~3s to <50ms.
:: Without it the single-threaded dev server queues requests behind slow
:: framework recompiles, so the frontend hits 15s+ timeouts and status
:: updates fail. See conf.d\zz-opcache.ini for details.
set "PHP_INI_SCAN_DIR=%CD%\conf.d"

echo   Performance: OPcache enabled (conf.d\zz-opcache.ini)
echo.

:: Walk the fallback chain. :try_port returns with BE_PORT defined once a
:: server has actually run (or is already serving), and with BE_PORT empty
:: when the port was occupied and we should move on.
set "BE_PORT="
for %%P in (8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010) do (
    if not defined BE_PORT call :try_port %%P
)
if not defined BE_PORT goto ALL_BUSY
goto KEEP_OPEN

:ALL_BUSY
echo.
echo   [X]   All backend ports (8000-8010) are occupied by other programs.
echo         Close whatever is holding them, then run the launcher again.
echo.
pause
exit /b 1

:KEEP_OPEN
:: Keep this window open so the launcher bat doesn't close it
timeout /t 99999 /nobreak > nul
exit /b 0

:try_port
set "P=%1"

:: 1) Skip ports something already listens on.
netstat -aon | findstr /C:":%P% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   Port %P% is occupied by another program - trying next port...
    exit /b 0
)

:: 2) Real bind probe - catches squatters netstat may not report and skips
::    doomed ports before the slow artisan boot.
C:\php83\php.exe -r "$s=@stream_socket_server('tcp://127.0.0.1:%P%', $e, $m); if ($s) { fclose($s); exit(0); } else { exit(1); }" >nul 2>&1
if errorlevel 1 (
    echo   Port %P% is in use - trying next port...
    exit /b 0
)

echo   Binding port %P%...
<nul set /p "=%P%" > "%PORT_FILE%"

:: Tell Laravel which URL it is actually serving on, so generated links
:: (emails, redirects, the /demo inspector) use the real port.
set "APP_URL=http://localhost:%P%"

:: Output goes to a log so we can tell a failed bind (the port was taken at
:: the exact moment of binding, often by something that is gone by the time
:: we check afterwards) apart from a server that ran and was then stopped.
::
:: -d variables_order=GPCS is a fix for a known PHP 8.3 on Windows bug:
:: with the default "EGPCS", Laravel's ServeCommand passes the child php -S
:: an environment stripped of every non-passthrough variable, which makes it
:: fail with "Failed to listen on 127.0.0.1:PORT (reason: ?)" on EVERY port.
C:\php83\php.exe -d variables_order=GPCS artisan serve --host=127.0.0.1 --port=%P% > "%SERVE_LOG%" 2>&1

:: The server itself reported a bind failure -> the port was taken. Move on.
findstr /C:"Failed to listen" "%SERVE_LOG%" >nul 2>&1
if not errorlevel 1 (
    echo   Port %P% is in use - trying next port...
    type "%SERVE_LOG%"
    exit /b 0
)

:: Port is still held by someone else even though the server exited.
netstat -aon | findstr /C:":%P% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   Port %P% could not be bound - trying next port...
    exit /b 0
)

:: The server ran and then stopped on purpose (shutdown / Ctrl+C) - do NOT
:: resurrect it on another port. Show the log tail if it was small (e.g. an
:: early crash) so errors are visible in this window.
echo   Backend server stopped.
if exist "%SERVE_LOG%" for %%z in ("%SERVE_LOG%") do if %%~zz LSS 4096 type "%SERVE_LOG%"
set "BE_PORT=%P%"
exit /b 0
