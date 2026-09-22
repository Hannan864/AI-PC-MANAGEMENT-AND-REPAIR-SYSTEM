@echo off
:: ============================================================================
::  SMART PC HUB — CLEAN DATABASE
::  Removes all data except 3 demo accounts
:: ============================================================================

TITLE Smart PC Hub — Clean Database
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
echo %C%     SMART PC HUB — CLEAN DATABASE%C_R%
echo %C%=========================================================================%R%
echo.
echo %W%  This will remove:%C_R%
echo %D%    - All repair requests%C_R%
echo %D%    - All gigs%C_R%
echo %D%    - All extra users (keeping only 3 demo accounts)%C_R%
echo.
echo %W%  Demo accounts to KEEP:%C_R%
echo %D%    admin@smartpchub.test      (Admin)%C_R%
echo %D%    ali.hassan@smartpchub.test (Technician)%C_R%
echo %D%    customer1@smartpchub.test  (Customer)%C_R%
echo.
echo %Y%  Continue? (Y/N)%C_R%
set /p "C2="
IF /I NOT "%C2%"=="Y" (echo.  Cancelled.& echo.& exit /b 0)

echo.
cd /d "%BE%"
echo %W%  [1/3] Clearing caches...%C_R%
"%PHP%" artisan config:clear >nul 2>&1
"%PHP%" artisan route:clear >nul 2>&1
"%PHP%" artisan view:clear >nul 2>&1
echo %G%         [OK]%C_R%

echo %W%  [2/3] Cleaning database...%C_R%
"%PHP%" artisan tinker --execute="
use App\Models\Gig;
use App\Models\RepairRequest;
use App\Models\LifecycleEvent;
use App\Models\CompletionReport;
use App\Models\User;

// Delete all gigs
$deleted = Gig::query()->delete();
echo '   Deleted ' . $deleted . ' gigs' . PHP_EOL;

// Delete all repair requests and related data
$deleted = RepairRequest::query()->delete();
echo '   Deleted ' . $deleted . ' repair requests' . PHP_EOL;

LifecycleEvent::query()->delete();
CompletionReport::query()->delete();

// Delete extra users (keep only 3 demo accounts)
$keepEmails = [
    'admin@smartpchub.test',
    'ali.hassan@smartpchub.test',
    'customer1@smartpchub.test',
];

$deleted = User::whereNotIn('email', $keepEmails)->delete();
echo '   Deleted ' . $deleted . ' extra users' . PHP_EOL;

// Show remaining users
$remaining = User::all();
echo '   Remaining users: ' . $remaining->count() . PHP_EOL;
foreach ($remaining as $u) {
    echo '     - ' . $u->email . ' (' . $u->role . ')' . PHP_EOL;
}
" 2>nul

echo %G%         [OK]%C_R%

echo %W%  [3/3] Verifying...%C_R%
"%PHP%" artisan tinker --execute="echo '   Users: ' . \App\\Models\\User::count() . '  |  Repairs: ' . \App\\Models\\RepairRequest::count() . '  |  Gigs: ' . \App\\Models\\Gig::count();" 2>nul

echo.
echo %G%=========================================================================%R%
echo %G%  DATABASE CLEANED%C_R%
echo %G%=========================================================================%R%
echo.
echo %W%  Login credentials:%C_R%
echo %D%    Admin       admin@smartpchub.test      / password%C_R%
echo %D%    Technician  ali.hassan@smartpchub.test  / password%C_R%
echo %D%    Customer    customer1@smartpchub.test   / password%C_R%
echo.
