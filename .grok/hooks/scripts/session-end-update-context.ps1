# SessionEnd hook — run affiliate-link-batch skill SESSION-END via headless Grok.
# Uses --resume <sessionId> so headless Grok sees this session's conversation history.

$Root = $env:GROK_WORKSPACE_ROOT
if (-not $Root -or -not (Test-Path (Join-Path $Root ".grok\skills\affiliate-link-batch\SKILL.md"))) {
    exit 0
}

$grok = Get-Command grok -ErrorAction SilentlyContinue
if (-not $grok) {
    exit 0
}

# SessionEnd JSON on stdin includes sessionId; fall back to env.
$sessionId = $env:GROK_SESSION_ID
try {
    $stdin = [Console]::In.ReadToEnd()
    if ($stdin) {
        $event = $stdin | ConvertFrom-Json
        if ($event.sessionId) {
            $sessionId = $event.sessionId
        }
    }
} catch {
    # ignore parse errors
}

Set-Location $Root

$prompt = @"
Execute the affiliate-link-batch project skill in SESSION-END mode only.
Read .grok/skills/affiliate-link-batch/SKILL.md and follow SESSION-END instructions.
You have the full conversation history of this session (resumed).
Update .grok/PROJECT_CONTEXT.md for what we did this session. Preserve section structure.
Also run git status / git diff if helpful. No personal paths. Do not git commit PROJECT_CONTEXT.md.
"@

try {
    if ($sessionId) {
        & grok -p $prompt --cwd $Root --resume $sessionId --yolo --max-turns 15 --output-format plain 2>$null | Out-Null
    } else {
        # No session id — only disk/git context available (weaker)
        & grok -p $prompt --cwd $Root --yolo --max-turns 15 --output-format plain 2>$null | Out-Null
    }
} catch {
    # Fail-open — session end must not block exit
}

exit 0