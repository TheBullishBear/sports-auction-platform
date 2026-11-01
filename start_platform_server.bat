@echo off
title Premier Auction - Server Engine
echo ================================================================
echo           Premier League Auction Platform - Backend
echo ================================================================
echo.
set "PATH=%~dp0..\tools\nodejs;%PATH%"
cd /d "%~dp0backend"
node dist/server.js
pause
