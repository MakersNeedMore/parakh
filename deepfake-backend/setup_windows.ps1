param([switch]$WithML, [switch]$WithEvaluation)
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
$python = Join-Path (Get-Location) ".venv\Scripts\python.exe"
& $python -m pip install --upgrade pip
& $python -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env. Generate a unique SECRET_KEY before sharing or deploying this project." -ForegroundColor Yellow
}
if ($WithML) {
    & $python -m pip install -r requirements-ml.txt
}
if ($WithEvaluation) {
    & $python -m pip install -r requirements-eval.txt
}
Write-Host "Setup complete. Run .\run_windows.ps1 to start the API." -ForegroundColor Green
if (-not $WithML) {
    Write-Host "ML dependencies were skipped. For real inference, rerun with -WithML." -ForegroundColor Yellow
}
