#!/usr/bin/env bash
# SessionEnd hook — run project-context SESSION-END via headless Grok.
# Skips when session was trivial (no user/agent work, clean git).

set -euo pipefail

ROOT="${GROK_WORKSPACE_ROOT:-}"
[[ -z "$ROOT" || ! -f "$ROOT/.grok/skills/project-context/SKILL.md" ]] && exit 0
command -v grok >/dev/null 2>&1 || exit 0

SESSION_ID="${GROK_SESSION_ID:-}"
if [[ -t 0 ]]; then
  : # no stdin
else
  STDIN="$(cat)" || true
  if [[ -n "$STDIN" ]]; then
    PARSED="$(printf '%s' "$STDIN" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("sessionId",""))' 2>/dev/null || true)"
    [[ -n "$PARSED" ]] && SESSION_ID="$PARSED"
  fi
fi

cd "$ROOT"

git_clean() {
  command -v git >/dev/null 2>&1 || return 0
  [[ -z "$(git status --porcelain 2>/dev/null)" ]]
}

grok_home() {
  if [[ -n "${GROK_HOME:-}" ]]; then
    printf '%s' "$GROK_HOME"
  else
    printf '%s/.grok' "$HOME"
  fi
}

trivial_session() {
  git_clean || return 1
  [[ -z "$SESSION_ID" ]] && return 0

  local sessions_root ghome session_dir
  ghome="$(grok_home)"
  sessions_root="$ghome/sessions"
  [[ -d "$sessions_root" ]] || return 1

  session_dir="$(find "$sessions_root" -type d -name "$SESSION_ID" 2>/dev/null | head -n 1)"
  [[ -n "$session_dir" ]] || return 1

  if [[ -f "$session_dir/summary.json" ]]; then
    local count
    count="$(python3 -c 'import json; print(json.load(open(sys.argv[1])).get("num_chat_messages",0))' "$session_dir/summary.json" 2>/dev/null || echo 0)"
    [[ "${count:-0}" -gt 1 ]] && return 1
  fi

  if [[ -f "$session_dir/chat_history.jsonl" ]]; then
    if grep -q '"type":"user"' "$session_dir/chat_history.jsonl" 2>/dev/null; then return 1; fi
    if grep -qE '"type":"(assistant|tool_result|reasoning)"' "$session_dir/chat_history.jsonl" 2>/dev/null; then return 1; fi
  fi

  return 0
}

if trivial_session; then
  exit 0
fi

PROMPT='Execute the project-context skill in SESSION-END mode only.
Read .grok/skills/project-context/SKILL.md and follow SESSION-END instructions.
You have the full conversation history of this session (resumed).

First run the significance gate (Step 0). Review this session and git status/diff.
If nothing significant happened, do NOT edit any files — reply only: SESSION-END: skipped (no significant changes)
If significant, update .grok/PROJECT_CONTEXT.md. Preserve section structure. No personal paths or secrets.
Do not git commit PROJECT_CONTEXT.md. Do not bump Last updated unless content actually changed.'

if [[ -n "$SESSION_ID" ]]; then
  grok -p "$PROMPT" --cwd "$ROOT" --resume "$SESSION_ID" --yolo --max-turns 15 --output-format plain >/dev/null 2>&1 || true
else
  grok -p "$PROMPT" --cwd "$ROOT" --yolo --max-turns 15 --output-format plain >/dev/null 2>&1 || true
fi

exit 0