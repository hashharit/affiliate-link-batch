# Cursor sessionEnd — delegate to Grok CLI resume save when available.

$Root = $PWD.Path
$grokScript = Join-Path $Root ".grok\hooks\scripts\session-end-update-context.ps1"
if (Test-Path $grokScript) {
    $env:GROK_WORKSPACE_ROOT = $Root
    & pwsh -NoProfile -ExecutionPolicy Bypass -File $grokScript
}
exit 0