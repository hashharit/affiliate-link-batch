# Project hooks (Grok CLI)

Hooks in `.grok/hooks/` apply to the **Grok CLI / TUI** (`grok` command), not Cursor's Agent UI.

## Verify (Grok CLI)

```bash
cd affiliate-link-batch
grok inspect          # Hooks (N) should include "command project"
```

In a Grok session:

```
/hooks-trust          # once, if project hooks are skipped
/hooks                # Hooks tab → look under "Project"
/hooks-list
```

Press `r` in the Hooks tab to reload after file changes.

## Trust

Project hooks are **silently skipped** until the folder is trusted:

```
/hooks-trust
```

Or launch with `grok --trust`. Recorded in `~/.grok/trusted_folders.toml`.

## Events configured

| Event | Script | When visible |
|-------|--------|--------------|
| `SessionStart` | `scripts/session-start-marker.ps1` | Writes `.grok/.hook-session-start` |
| `SessionEnd` | `scripts/session-end-update-context.ps1` | Runs on `/exit` |

`SessionEnd` only appears in the hooks **list** at session start — it does not run until you exit.

## Cursor IDE

If you use **Cursor Agent** (not Grok CLI), hooks live in `.cursor/hooks.json` instead — see that folder.