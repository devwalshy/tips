# TipJar Fly.io Deployment Script

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "TipJar Fly.io Deployment" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Check if flyctl is installed
try {
    $flyVersion = flyctl version
    Write-Host "Using flyctl: $flyVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: flyctl is not installed" -ForegroundColor Red
    Write-Host "Install it from: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Windows installation:" -ForegroundColor Yellow
    Write-Host "  powershell -Command ""iwr https://fly.io/install.ps1 -useb | iex""" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Step 1: Checking Fly.io authentication..." -ForegroundColor Yellow

# Check if logged in
$authCheck = flyctl auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Fly.io" -ForegroundColor Yellow
    Write-Host "Opening browser for authentication..." -ForegroundColor Cyan
    flyctl auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Authentication failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Authenticated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Creating/Updating Fly.io app..." -ForegroundColor Yellow

# Check if app exists
$appCheck = flyctl apps list 2>&1 | Select-String "tipjar-sbux"
if (-not $appCheck) {
    Write-Host "Creating new Fly.io app..." -ForegroundColor Cyan
    flyctl apps create tipjar-sbux --org personal
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create app" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ App ready" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Setting environment secrets..." -ForegroundColor Yellow

# Generate a random session secret if not set
$sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "Setting Azure Document Intelligence credentials..." -ForegroundColor Cyan
flyctl secrets set `
    SESSION_SECRET="$sessionSecret" `
    AZURE_DI_KEY="2HcPcsSwlImCm4YQkKsCu1bghizqG6KBdaskDT5qoLFBDIdGbnr9JQQJ99BJACHYHv6XJ3w3AAALACOGLORC" `
    AZURE_DI_ENDPOINT="https://sbux-tips.cognitiveservices.azure.com" `
    --app tipjar-sbux

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set secrets" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Secrets configured" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Deploying application..." -ForegroundColor Yellow

flyctl deploy --app tipjar-sbux

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Cyan
Write-Host "  https://tipjar-sbux.fly.dev" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  flyctl logs --app tipjar-sbux           # View logs" -ForegroundColor Gray
Write-Host "  flyctl status --app tipjar-sbux         # Check status" -ForegroundColor Gray
Write-Host "  flyctl open --app tipjar-sbux           # Open in browser" -ForegroundColor Gray
Write-Host "  flyctl secrets list --app tipjar-sbux   # List secrets" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
