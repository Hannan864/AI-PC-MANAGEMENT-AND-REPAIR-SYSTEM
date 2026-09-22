@echo off
TITLE Smart PC Hub - Launcher
color 0B
SETLOCAL EnableDelayedExpansion

:MENU
cls
echo.
echo  ========================================================
echo           SMART PC HUB - LAUNCHER
echo  ========================================================
echo.
echo   1.  Start System
echo   2.  Shut Down System
echo   3.  Reset Database
echo   4.  Exit
echo.
echo  --------------------------------------------------------
echo.
set /p "CHOICE=  Select an option (1-4): "

IF "%CHOICE%"=="1" (
    echo.
    call "%~dp0bat\START_SYSTEM.bat"
    echo.
    echo  Press any key to return to launcher...
    pause > nul
    goto MENU
)

IF "%CHOICE%"=="2" (
    echo.
    call "%~dp0bat\STOP_SYSTEM.bat"
    echo.
    echo  Press any key to return to launcher...
    pause > nul
    goto MENU
)

IF "%CHOICE%"=="3" (
    echo.
    call "%~dp0bat\RESET_DATABASE.bat"
    echo.
    echo  Press any key to return to launcher...
    pause > nul
    goto MENU
)

IF "%CHOICE%"=="4" (
    echo.
    echo  Goodbye!
    echo.
    exit /b 0
)

echo.
echo  Invalid option. Please select 1-4.
timeout /t 2 > nul
goto MENU
