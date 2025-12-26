# ========================================
# 🔧 QUICK FIX FOR DATABASE CONNECTION
# ========================================

Write-Host ""
Write-Host "🎯 You have PostgreSQL installed and running!" -ForegroundColor Green
Write-Host "   The issue is just the password in your .env file" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60
Write-Host ""

Write-Host "📋 STEP-BY-STEP FIX:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Find your PostgreSQL password" -ForegroundColor Yellow
Write-Host "    Common places to check:" 
Write-Host "    • Check if you wrote it down during installation"
Write-Host "    • Common defaults: 'postgres', 'admin', 'root', '1234'"
Write-Host "    • Windows: Check pgAdmin if you have it installed"
Write-Host ""

Write-Host "2️⃣  Test the password" -ForegroundColor Yellow  
Write-Host "    Try connecting with psql:"
Write-Host "    psql -U postgres -d postgres" -ForegroundColor Cyan
Write-Host "    (Type the password when prompted)"
Write-Host ""

Write-Host "3️⃣  Update .env file" -ForegroundColor Yellow
Write-Host "    Open: .env"
Write-Host "    Find this line:"
Write-Host "    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pastebin"
Write-Host ""
Write-Host "    Change 'postgres' (the second one) to YOUR password:"
Write-Host "    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pastebin" -ForegroundColor Green
Write-Host ""

Write-Host "4️⃣  Create the database (if needed)" -ForegroundColor Yellow
Write-Host "    In psql, run:"
Write-Host "    CREATE DATABASE pastebin;" -ForegroundColor Cyan
Write-Host ""

Write-Host "5️⃣  Run the app" -ForegroundColor Yellow
Write-Host "    npm start" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 60
Write-Host "💡 QUICK ALTERNATIVE: Reset PostgreSQL Password" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""
Write-Host "If you don't know/remember the password, you can reset it:"
Write-Host ""
Write-Host "Windows Method:"
Write-Host "1. Open pgAdmin (if installed)"
Write-Host "2. Right-click the postgres user → Properties"
Write-Host "3. Set a new password"
Write-Host ""
Write-Host "OR use psql as Windows admin:"
Write-Host "1. Open Command Prompt as Administrator"
Write-Host "2. Run: psql -U postgres"
Write-Host "3. ALTER USER postgres WITH PASSWORD 'newpassword';" -ForegroundColor Cyan
Write-Host "4. Update .env with the new password"
Write-Host ""

Write-Host "=" * 60
Write-Host "🚀 EASIEST OPTION: Skip Local Database" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""
Write-Host "Deploy directly to Railway and skip the local database setup!"
Write-Host "Railway provides PostgreSQL automatically."
Write-Host ""
Write-Host "See: RAILWAY_DEPLOY.md for instructions"
Write-Host ""

Write-Host "Need help? Check DATABASE_FIX_GUIDE.txt for more options!" -ForegroundColor Green
Write-Host ""
