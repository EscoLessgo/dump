# Quick PostgreSQL Setup with Docker
# This creates a fresh PostgreSQL database for your pastebin

Write-Host ""
Write-Host "🐳 Setting up PostgreSQL with Docker..." -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Check if container already exists
$existing = docker ps -a --filter "name=pastebin-postgres" --format "{{.Names}}" 2>$null

if ($existing -eq "pastebin-postgres") {
    Write-Host "⚠️  Container 'pastebin-postgres' already exists" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Removing old container..." -ForegroundColor Yellow
    docker rm -f pastebin-postgres 2>$null | Out-Null
    Write-Host "✅ Old container removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Creating new PostgreSQL container..." -ForegroundColor Yellow
Write-Host "  Name: pastebin-postgres"
Write-Host "  Port: 5433 (to avoid conflicts with your existing PostgreSQL)"
Write-Host "  User: postgres"  
Write-Host "  Password: postgres"
Write-Host "  Database: pastebin"
Write-Host ""

# Create container
$result = docker run --name pastebin-postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=pastebin `
    -p 5433:5432 `
    -d postgres:16 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL container created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=" * 50
    Write-Host "📝 NEXT STEP: Update your .env file" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host ""
    Write-Host "Replace the DATABASE_URL line with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pastebin" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Using port 5433 (not 5432) to avoid conflict with your existing PostgreSQL"
    Write-Host ""
    Write-Host "After updating .env, run: npm start" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host "❌ Failed to create container" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host "=" * 50
Write-Host "📊 Container Info:" -ForegroundColor Cyan
docker ps --filter "name=pastebin-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
