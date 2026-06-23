# Open Firefox temporary extension debugging page (for manual load)

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$Manifest = Join-Path $ProjectRoot "manifest.json"
$FirefoxExe = $env:FIREFOX_EXE
if (-not $FirefoxExe) {
    $FirefoxExe = "C:\Program Files\Mozilla Firefox\firefox.exe"
}

Write-Host "Load the extension manually:"
Write-Host "  1. about:debugging opens in Firefox"
Write-Host "  2. This Firefox -> Load Temporary Add-on..."
Write-Host "  3. Select: $Manifest"
Write-Host ""

Start-Process $FirefoxExe "about:debugging#/runtime/this-firefox"