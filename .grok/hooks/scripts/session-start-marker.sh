#!/usr/bin/env bash
# SessionStart hook — writes a timestamp marker (fail-open).

ROOT="${GROK_WORKSPACE_ROOT:-}"
[[ -z "$ROOT" ]] && exit 0

MARKER_DIR="$ROOT/.grok"
MARKER_FILE="$MARKER_DIR/.hook-session-start"
mkdir -p "$MARKER_DIR" 2>/dev/null || exit 0
date -Iseconds >"$MARKER_FILE" 2>/dev/null || date >"$MARKER_FILE" 2>/dev/null || true
exit 0