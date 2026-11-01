@echo off
title Deploy Sports Auction Platform to Cloud
echo ===================================================
echo   Deploying Updates to GitHub & Render.com
echo ===================================================

cd /d "C:\Users\rishi\.gemini\antigravity\scratch\sports-auction-platform"
set "PATH=C:\Users\rishi\.gemini\antigravity\scratch\tools\nodejs;%PATH%"

echo.
echo [1/3] Compiling frontend and backend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed. Please check code errors.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Staging and committing changes...
git add .
set /p commit_msg="Enter update description (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="Update platform"
git commit -m "%commit_msg%"

echo.
echo [3/3] Pushing to GitHub (Render auto-deploys in ~1 min)...
git push origin main

echo.
echo ===================================================
echo   SUCCESS! Pushed to GitHub.
echo   Render is now deploying your update automatically!
echo ===================================================
pause
