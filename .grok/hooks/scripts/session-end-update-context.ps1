# SessionEnd hook — run project-context SESSION-END via headless Grok.
# Skips when session was trivial (no user/agent work, clean git).

$Root = $env:GROK_WORKSPACE_ROOT
if (-not $Root -or -not (Test-Path (Join-Path $Root ".grok\skills\project-context\SKILL.md"))) {
    exit 0
}

$grok = Get-Command grok -ErrorAction SilentlyContinue
if (-not $grok) { exit 0 }

$sessionId = $env:GROK_SESSION_ID
try {
    $stdin = [Console]::In.ReadToEnd()
    if ($stdin) {
        $event = $stdin | ConvertFrom-Json
        if ($event.sessionId) { $sessionId = $event.sessionId }
    }
} catch { }

Set-Location $Root

function Test-GitClean {
    param([string]$RepoRoot)
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $true }
    $status = & git -C $RepoRoot status --porcelain 2>$null
    return -not $status
}

function Get-GrokHome {
    if ($env:GROK_HOME) { return $env:GROK_HOME }
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        return Join-Path $env:USERPROFILE ".grok"
    }
    return Join-Path $env:HOME ".grok"
}

function Test-TrivialGrokSession {
    param([string]$SessionId, [string]$RepoRoot, [string]$GrokHome)

    if (-not (Test-GitClean -RepoRoot $RepoRoot)) { return $false }
    if (-not $SessionId) { return $true }

    $sessionsRoot = Join-Path $GrokHome "sessions"
    if (-not (Test-Path $sessionsRoot)) { return $false }

    $sessionDir = Get-ChildItem -Path $sessionsRoot -Recurse -Directory -Filter $SessionId -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $sessionDir) { return $false }

    $summaryFile = Join-Path $sessionDir.FullName "summary.json"
    if (Test-Path $summaryFile) {
        try {
            $summary = Get-Content $summaryFile -Raw | ConvertFrom-Json
            if ($summary.num_chat_messages -and $summary.num_chat_messages -gt 1) { return $false }
        } catch { }
    }

    $chatFile = Join-Path $sessionDir.FullName "chat_history.jsonl"
    if (-not (Test-Path $chatFile)) { return $true }

    foreach ($line in Get-Content $chatFile) {
        if (-not $line) { continue }
        try {
            $entry = $line | ConvertFrom-Json
            if ($entry.type -eq "user") { return $false }
            if ($entry.type -in @("assistant", "tool_result", "reasoning")) { return $false }
        } catch { }
    }

    return $true
}

$grokHome = Get-GrokHome
if (Test-TrivialGrokSession -SessionId $sessionId -RepoRoot $Root -GrokHome $grokHome) {
    exit 0
}

$prompt = @"
Execute the project-context skill in SESSION-END mode only.
Read .grok/skills/project-context/SKILL.md and follow SESSION-END instructions.
You have the full conversation history of this session (resumed).

First run the significance gate (Step 0). Review this session and git status/diff.
If nothing significant happened, do NOT edit any files — reply only: SESSION-END: skipped (no significant changes)
If significant, update .grok/PROJECT_CONTEXT.md. Preserve section structure. No personal paths or secrets.
Do not git commit PROJECT_CONTEXT.md. Do not bump Last updated unless content actually changed.
"@

try {
    if ($sessionId) {
        & grok -p $prompt --cwd $Root --resume $sessionId --yolo --max-turns 15 --output-format plain 2>$null | Out-Null
    } else {
        & grok -p $prompt --cwd $Root --yolo --max-turns 15 --output-format plain 2>$null | Out-Null
    }
} catch { }

exit 0