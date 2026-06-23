# Cursor sessionStart — marker file so you can verify hooks ran.

$Root = $PWD.Path
if (-not $Root) { exit 0 }

$markerDir = Join-Path $Root ".grok"
$markerFile = Join-Path $markerDir ".hook-cursor-session-start"
try {
    New-Item -ItemType Directory -Force -Path $markerDir | Out-Null
    Get-Date -Format "o" | Set-Content -Path $markerFile -Encoding utf8
} catch {}

exit 0