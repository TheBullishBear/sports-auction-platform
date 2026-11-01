@echo off
title Premier Auction - Public Internet Tunnel (4G/5G)
echo ================================================================
echo    Starting Premier League Auction Public Cloudflare Tunnel
echo ================================================================
echo.
echo Connecting local port 4000 to Cloudflare edge network...
echo Your secure https://*.trycloudflare.com link will appear below:
echo.
"%~dp0..\tools\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
pause
