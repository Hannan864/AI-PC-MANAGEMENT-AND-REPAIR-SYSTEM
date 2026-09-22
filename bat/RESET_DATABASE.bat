@echo off
:: ============================================================================
::  SMART PC HUB — DATABASE RESET
::  Wipes data, re-seeds fresh demo data
:: ============================================================================

TITLE Smart PC Hub — Database Reset
SETLOCAL EnableDelayedExpansion

FOR /F %%a IN ('echo prompt $E ^| cmd') DO SET "ESC=%%a"
SET "G=%ESC%[1;32m"
SET "Y=%ESC%[1;33m"
SET "C=%ESC%[1;36m"
SET "RD=%ESC%[1;31m"
SET "W=%ESC%[1;37m"
SET "D=%ESC%[2m"
SET "R=%ESC%[0m"

SET "PHP=C:\php83\php.exe"
SET "BE=%~dp0..\backend-laravel"

cls
echo.
echo %C%=========================================================================%R%
echo %C%     SMART PC HUB — DATABASE RESET%C_R%
echo %C%=========================================================================%R%
echo.
echo %RD%  !! WARNING: ALL DATA WILL BE DELETED !!%C_R%
echo.
echo %W%  This will re-create:%C_R%
echo %D%    - 1 admin  (admin@smartpchub.test)%C_R%
echo %D%    - 1 technician  (ali.hassan@smartpchub.test)%C_R%
echo %D%    - 1 customer  (customer1@smartpchub.test)%C_R%
echo %D%    - 0 repair requests (tester creates via UI)%C_R%
echo %D%    - 0 gigs (tester creates via UI)%C_R%
echo.
echo %Y%  Continue? (Y/N)%C_R%
set /p "C2="
IF /I NOT "%C2%"=="Y" (echo.  Cancelled.& echo.& exit /b 0)

echo.
cd /d "%BE%"
echo %W%  [1/4] Clearing caches...%C_R%
"%PHP%" artisan config:clear >nul 2>&1
"%PHP%" artisan route:clear >nul 2>&1
"%PHP%" artisan view:clear >nul 2>&1
echo %G%         [OK]%C_R%

echo %W%  [2/4] Fresh migration...%C_R%
"%PHP%" artisan migrate:fresh --force
IF ERRORLEVEL 1 (echo %RD%  FAILED%C_R% & exit /b 1)
echo %G%         [OK]%C_R%

echo %W%  [3/4] Seeding demo data...%C_R%
"%PHP%" artisan db:seed --force
IF ERRORLEVEL 1 (echo %RD%  FAILED%C_R% & exit /b 1)
echo %G%         [OK]%C_R%

echo %W%  [4/4] Verifying...%C_R%
"%PHP%" artisan tinker --execute="echo '   Users: ' . \App\Models\User::count() . '  |  Repairs: ' . \App\Models\RepairRequest::count() . '  |  Gigs: ' . \App\Models\Gig::count();" 2>nul

echo.
echo %G%=========================================================================%R%
echo %G%  DATABASE RESET COMPLETE%C_R%
echo %G%=========================================================================%R%
echo.
echo %W%  Login credentials:%C_R%
echo %D%    Admin       admin@smartpchub.test      / password%C_R%
echo %D%    Technician  ali.hassan@smartpchub.test  / password%C_R%
echo %D%    Customer    customer1@smartpchub.test   / password%C_R%
echo.
