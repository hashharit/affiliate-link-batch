# Build a distributable .zip for GitHub Releases or manual install.

$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

if (-not (Get-Command web-ext -ErrorAction SilentlyContinue)) {
    Write-Error "web-ext is not installed. Run: npm install -g web-ext"
    exit 1
}

web-ext build --overwrite-dest
Write-Host ""
Write-Host "Package written to web-ext-artifacts/" -ForegroundColor Green