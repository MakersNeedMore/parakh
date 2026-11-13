param([switch]$WithML, [switch]$WithEvaluation)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VenvDir = Join-Path $ScriptDir ".venv"
if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating virtual environment in $VenvDir ..." -ForegroundColor Cyan
    python -m venv $VenvDir
}
$python = Join-Path $VenvDir "Scripts\python.exe"
& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $ScriptDir "requirements.txt")

$EnvFile = Join-Path $ScriptDir ".env"
$EnvExample = Join-Path $ScriptDir ".env.example"
if (-not (Test-Path $EnvFile)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host "Created .env. Generate a unique SECRET_KEY before sharing or deploying this project." -ForegroundColor Yellow
}
if ($WithML) {
    Write-Host "Installing ML runtime dependencies ..." -ForegroundColor Cyan
    & $python -m pip install -r (Join-Path $ScriptDir "requirements-ml.txt")
}
if ($WithEvaluation) {
    Write-Host "Installing evaluation dependencies ..." -ForegroundColor Cyan
    & $python -m pip install -r (Join-Path $ScriptDir "requirements-eval.txt")
}
Write-Host "Setup complete. Run .\run_windows.ps1 to start the API." -ForegroundColor Green
if (-not $WithML) {
    Write-Host "ML dependencies were skipped. For real inference, rerun with -WithML." -ForegroundColor Yellow
}
