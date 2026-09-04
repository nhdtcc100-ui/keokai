@echo off
cd /d "%~dp0"
set "PATH=%CD%\node-v25.9.0-win-x64;%PATH%"
echo Starting ProLink App on http://localhost:3000 ...
call npm run dev
pause
