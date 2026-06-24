# Project hooks (Grok CLI)

Installed by the global `repo-context-automation` skill. Applies to **Grok CLI** (`grok` command).

## Verify

```bash
cd <repo-root>
grok inspect    # Hooks should include "command project"
```

In a Grok session:

```
/hooks-trust    # once, if project hooks are skipped
/hooks          # Hooks tab → Project
```

Press `r` in the Hooks tab to reload after file changes.

## Events

| Event | Script | Behaviour |
|-------|--------|-----------|
| `SessionStart` | `invoke-hook` → `session-start-marker` | Writes `.grok/.hook-session-start` |
| `SessionEnd` | `invoke-hook` → `session-end-update-context` | Headless `grok --resume` for SESSION-END |

**Empty session:** no user/agent work + clean git → no headless Grok.

**Light session:** chat but nothing significant → Grok runs significance gate, skips `PROJECT_CONTEXT.md`.

## OS dispatch

| Platform | Entry | Runs |
|----------|-------|------|
| Windows | `invoke-hook.ps1` | `*.ps1` |
| Linux/macOS | `invoke-hook.ps1` (pwsh) or `invoke-hook.sh` | `*.sh` |

Default `session-context.json` uses **pwsh** (PowerShell 7+). On bash-only Linux, copy `session-context.bash.json` → `session-context.json`.

## Cross-session memory

`.grok/PROJECT_CONTEXT.md` — local handoff file (gitignored). Loaded at session start, updated at session end when significant.