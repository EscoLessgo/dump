# Setup Script for PasteBin Pro
# This script helps you set up the environment file

Write-Host ""
Write-Host "🎉 PasteBin Pro - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled. Using existing .env file." -ForegroundColor Red
        exit 0
    }
}

Write-Host "📝 Let's set up your environment variables..." -ForegroundColor Green
Write-Host ""

# Get database URL
Write-Host "1️⃣  Database Configuration" -ForegroundColor Cyan
Write-Host "   For Railway: Leave blank (Railway will auto-provide)" -ForegroundColor Gray
Write-Host "   For local: postgresql://username:password@localhost:5432/pastebin" -ForegroundColor Gray
Write-Host ""
$dbUrl = Read-Host "   DATABASE_URL (press Enter to use Railway auto-config)"

if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    $dbUrl = "postgresql://username:password@localhost:5432/pastebin"
    Write-Host "   Using placeholder for local dev. Update this before running!" -ForegroundColor Yellow
}

Write-Host ""

# Get environment
Write-Host "2️⃣  Environment" -ForegroundColor Cyan
Write-Host "   Options: development, production" -ForegroundColor Gray
$nodeEnv = Read-Host "   NODE_ENV (default: development)"

if ([string]::IsNullOrWhiteSpace($nodeEnv)) {
    $nodeEnv = "development"
}

Write-Host ""

# Get port
Write-Host "3️⃣  Server Port" -ForegroundColor Cyan
Write-Host "   Railway will override this automatically" -ForegroundColor Gray
$port = Read-Host "   PORT (default: 3000)"

if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "3000"
}

Write-Host ""

# Create .env file
$envContent = @"
# Database
DATABASE_URL=$dbUrl

# Server
PORT=$port
NODE_ENV=$nodeEnv

# Frontend URLs
ADMIN_URL=http://localhost:$port/admin
PUBLIC_URL=http://localhost:$port/public

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:$port,http://127.0.0.1:$port
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update DATABASE_URL in .env if needed" -ForegroundColor White
Write-Host "   2. Run: npm install" -ForegroundColor White
Write-Host "   3. Run: npm start" -ForegroundColor White
Write-Host "   4. Visit: http://localhost:$port/admin" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more help, see QUICKSTART.md" -ForegroundColor Gray
Write-Host ""
