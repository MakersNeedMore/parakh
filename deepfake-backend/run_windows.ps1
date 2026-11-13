$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Look for virtual environment in script directory or parent directory
$VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"
$ParentVenvPython = Join-Path (Split-Path -Parent $ScriptDir) ".venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
} elseif (Test-Path $ParentVenvPython) {
    $PythonExe = $ParentVenvPython
} elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonExe = "python"
    Write-Host "Virtual environment not detected; using system python on PATH." -ForegroundColor Yellow
} else {
    throw "Python environment missing. Run .\setup_windows.ps1 first."
}

Set-Location $ScriptDir
Write-Host "Starting Parakh FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
& $PythonExe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
