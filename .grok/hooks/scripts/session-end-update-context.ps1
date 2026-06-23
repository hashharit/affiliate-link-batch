# SessionEnd hook — run affiliate-link-batch skill SESSION-END via headless Grok.

$Root = $env:GROK_WORKSPACE_ROOT
if (-not $Root -or -not (Test-Path (Join-Path $Root ".grok\skills\affiliate-link-batch\SKILL.md"))) {
    exit 0
}

$grok = Get-Command grok -ErrorAction SilentlyContinue
if (-not $grok) {
    exit 0
}

Set-Location $Root

$prompt = @"
Execute the affiliate-link-batch project skill in SESSION-END mode only.
Read .grok/skills/affiliate-link-batch/SKILL.md and follow SESSION-END instructions.
Update .grok/PROJECT_CONTEXT.md for this session. Preserve section structure.
No personal paths. Do not git commit PROJECT_CONTEXT.md.
"@

try {
    & grok -p $prompt --cwd $Root --yolo --max-turns 15 --output-format plain 2>$null | Out-Null
} catch {
    # Fail-open — session end must not block exit
}

exit 0