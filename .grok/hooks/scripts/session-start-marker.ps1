# SessionStart hook — confirms hooks are wired. Writes a timestamp file (fail-open).

$Root = $env:GROK_WORKSPACE_ROOT
if (-not $Root) {
    exit 0
}

$markerDir = Join-Path $Root ".grok"
$markerFile = Join-Path $markerDir ".hook-session-start"
try {
    New-Item -ItemType Directory -Force -Path $markerDir | Out-Null
    Get-Date -Format "o" | Set-Content -Path $markerFile -Encoding utf8
} catch {
    # ignore
}

exit 0