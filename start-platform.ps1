# 🏏 Launch Real-Time Sports Auction Platform
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🏏 PREMIER REAL-TIME SPORTS AUCTION PLATFORM" -ForegroundColor Yellow
Write-Host "⚡ Sub-50ms Live Concurrency Engine & ACID Integrity" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:PATH = "C:\Users\rishi\.gemini\antigravity\scratch\tools\nodejs;" + $env:PATH
$platformDir = "C:\Users\rishi\.gemini\antigravity\scratch\sports-auction-platform"

Set-Location "$platformDir\backend"
Write-Host "Starting Auction Server on http://localhost:4000..." -ForegroundColor Green
node dist/server.js
