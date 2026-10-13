@echo off
setlocal
chcp 65001 >nul
title ProLink - Deploy to GitHub and Netlify

:: Navigate to project directory containing .git
if exist "%~dp0.git" (
    cd /d "%~dp0"
) else if exist "%~dp0PROFES~1\.git" (
    cd /d "%~dp0PROFES~1"
) else (
    for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-ChildItem -Directory | Where-Object { Test-Path (Join-Path $_.FullName '.git') })[0].FullName"`) do cd /d "%%I"
)

if not exist ".git" (
    echo.
    echo [ERROR] Git repository not found!
    echo Please make sure this file is in the project folder.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo       ProLink - Push to GitHub and Trigger Netlify
echo ========================================================
echo Working Directory: %CD%
echo ========================================================
echo.

echo Git Status:
git status
echo.

set "msg="
set /p msg="Commit message (press Enter for default): "
if "%msg%"=="" set msg=Update ProLink project

echo.
echo [1/3] Adding changes...
git add -A

echo [2/3] Committing changes...
git commit -m "%msg%" 2>nul
if %errorlevel% neq 0 (
    echo No new changes to commit, or commit already created.
)

echo.
echo [3/3] Pushing to GitHub (origin main)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Successfully pushed to GitHub!
    echo Netlify will automatically build and deploy the update.
    echo GitHub Repo: https://github.com/nhdtcc100-ui/keokai
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo [NOTE] Push did not complete automatically.
    echo If GitHub opened a browser window for login, please sign in.
    echo Or run: git push -u origin main --force
    echo ========================================================
)

echo.
pause
