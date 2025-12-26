# PostgreSQL Connection Fix Script
# This script helps you set up the database connection

Write-Host "🔧 PostgreSQL Connection Troubleshooter" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "✅ PostgreSQL service found: $($pgService.Name)" -ForegroundColor Green
    Write-Host "   Status: $($pgService.Status)" -ForegroundColor Green
}
else {
    Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL from https://www.postgresql.org/download/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 50
Write-Host "🔐 PASSWORD ISSUE DETECTED" -ForegroundColor Red
Write-Host "=" * 50
Write-Host ""
Write-Host "Your .env file has:" -ForegroundColor Yellow
Write-Host "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pastebin"
Write-Host ""
Write-Host "But the password 'postgres' is not working." -ForegroundColor Red
Write-Host ""

Write-Host "📋 SOLUTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Update .env with your actual PostgreSQL password" -ForegroundColor Green
Write-Host "  1. Open .env file"
Write-Host "  2. Change this line:"
Write-Host "     DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/pastebin"
Write-Host "  3. Replace 'YOUR_ACTUAL_PASSWORD' with your real password"
Write-Host ""

Write-Host "Option 2: Create a new PostgreSQL user for this project" -ForegroundColor Green
Write-Host "  Run these commands in psql:"
Write-Host "  1. psql -U postgres"
Write-Host "  2. CREATE USER pastebin_user WITH PASSWORD 'mypassword';"
Write-Host "  3. CREATE DATABASE pastebin OWNER pastebin_user;"
Write-Host "  4. Update .env:"
Write-Host "     DATABASE_URL=postgresql://pastebin_user:mypassword@localhost:5432/pastebin"
Write-Host ""

Write-Host "Option 3: Use Docker PostgreSQL (easiest)" -ForegroundColor Green
Write-Host "  Run this command:"
Write-Host "  docker run --name pastebin-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pastebin -p 5433:5432 -d postgres:16"
Write-Host "  Then update .env:"
Write-Host "  DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pastebin"
Write-Host ""

Write-Host "Option 4: Use Railway (skip local PostgreSQL entirely)" -ForegroundColor Green
Write-Host "  Deploy to Railway and let them handle the database"
Write-Host "  See RAILWAY_DEPLOY.md for instructions"
Write-Host ""

Write-Host "=" * 50
Write-Host ""
Write-Host "💡 Quick Test:" -ForegroundColor Yellow
Write-Host "Try connecting manually to find your password:"
Write-Host "psql -U postgres -d postgres"
Write-Host ""
Write-Host "If it asks for a password, that's the one you need in .env!"
Write-Host ""
