# Run Affiliate Link Batch via web-ext.
# web-ext must launch Firefox with remote debugging — it fails if Firefox is already open.

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$Manifest = Join-Path $ProjectRoot "manifest.json"
$FirefoxExe = $env:FIREFOX_EXE
if (-not $FirefoxExe) {
    $FirefoxExe = "C:\Program Files\Mozilla Firefox\firefox.exe"
}

$running = Get-Process firefox -ErrorAction SilentlyContinue
if ($running) {
    Write-Host ""
    Write-Host "Firefox is already running ($($running.Count) processes)." -ForegroundColor Yellow
    Write-Host "web-ext cannot connect (ECONNREFUSED) while your normal Firefox session is active."
    Write-Host ""
    Write-Host "RECOMMENDED - load in your current Firefox (keeps Amazon login + SiteStripe):" -ForegroundColor Green
    Write-Host "  1. Open: about:debugging#/runtime/this-firefox"
    Write-Host "  2. Click: Load Temporary Add-on..."
    Write-Host "  3. Select: $Manifest"
    Write-Host "  4. Open an Amazon search page"
    Write-Host ""
    Write-Host "After code changes: click Reload on the extension card in about:debugging."
    Write-Host ""
    Write-Host "OR close ALL Firefox windows completely, then run:" -ForegroundColor Cyan
    Write-Host "  web-ext run --firefox-profile default-release --keep-profile-changes"
    Write-Host ""
    exit 1
}

Set-Location $ProjectRoot
if (-not (Test-Path "web-ext-config.cjs")) {
    Write-Host "Copy web-ext-config.example.cjs to web-ext-config.cjs and set your Firefox path." -ForegroundColor Yellow
}
web-ext run --verbose