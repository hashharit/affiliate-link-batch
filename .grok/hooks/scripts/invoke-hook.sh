#!/usr/bin/env bash
# OS-aware hook dispatcher. Windows Git Bash → *.ps1; Unix → *.sh
set -euo pipefail

HOOK="${1:?hook name required}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*|Windows*)
    exec pwsh -NoProfile -ExecutionPolicy Bypass -File "$DIR/${HOOK}.ps1"
    ;;
  *)
    exec bash "$DIR/${HOOK}.sh"
    ;;
esac