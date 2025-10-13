@echo off
REM Environment Switcher Script for Melode Frontend (Windows)
REM Usage: switch-env.bat [development|staging|production]

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "JS_DIR=%SCRIPT_DIR%js"

REM Check if environment argument is provided
if "%1"=="" (
    call :usage
    exit /b 1
)

set "ENV=%1"

REM Handle environment aliases
if /i "%ENV%"=="dev" set "ENV=development"
if /i "%ENV%"=="stage" set "ENV=staging"
if /i "%ENV%"=="prod" set "ENV=production"

REM Validate environment
if /i not "%ENV%"=="development" (
    if /i not "%ENV%"=="staging" (
        if /i not "%ENV%"=="production" (
            echo [31mError: Unknown environment '%1'[0m
            echo.
            call :usage
            exit /b 1
        )
    )
)

REM Switch environment
call :switch_environment "%ENV%"
exit /b 0

REM Function to display usage
:usage
echo [34m================================[0m
echo [34mMelode Frontend - Environment Switcher[0m
echo [34m================================[0m
echo.
echo Usage: switch-env.bat [environment]
echo.
echo Available environments:
echo   development  - Local development (http://127.0.0.1:8000)
echo   staging      - Staging server (https://melode-api-staging.onrender.com)
echo   production   - Production server (https://api.melode.com)
echo.
echo Aliases:
echo   dev  = development
echo   stage = staging
echo   prod = production
echo.
echo Example: switch-env.bat staging
goto :eof

REM Function to switch environment
:switch_environment
set "env_name=%~1"
set "source_file=%JS_DIR%\config.%env_name%.js"
set "target_file=%JS_DIR%\config.js"

if not exist "%source_file%" (
    echo [31mError: Configuration file not found: %source_file%[0m
    exit /b 1
)

REM Backup current config if it exists
if exist "%target_file%" (
    copy /Y "%target_file%" "%target_file%.backup" >nul 2>&1
    echo [33mBacked up current config to config.js.backup[0m
)

REM Copy the new config
copy /Y "%source_file%" "%target_file%" >nul 2>&1

if !errorlevel! equ 0 (
    echo.
    echo [32mSuccessfully switched to %env_name% environment![0m
    echo.
    
    REM Display the API URL
    if /i "%env_name%"=="development" (
        echo [34mAPI URL: http://127.0.0.1:8000/api/v1[0m
    )
    if /i "%env_name%"=="staging" (
        echo [34mAPI URL: https://melode-api-staging.onrender.com/api/v1[0m
    )
    if /i "%env_name%"=="production" (
        echo [34mAPI URL: https://api.melode.com/api/v1[0m
    )
    
    echo.
    echo [33mTip: Clear your browser cache (Ctrl+Shift+R) to apply changes[0m
    echo.
) else (
    echo [31mFailed to switch environment[0m
    exit /b 1
)
goto :eof

