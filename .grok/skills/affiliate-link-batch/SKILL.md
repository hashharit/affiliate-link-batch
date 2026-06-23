---
name: affiliate-link-batch
description: >
  Project context lifecycle only — load at session start, save at session end.
  Do not use for feature work, debugging, or releases. Invoked via AGENTS.md
  on start, SessionEnd hook on exit, or /affiliate-link-batch start|save.
disable-model-invocation: true
user-invocable: true
metadata:
  short-description: "Load/save .grok/PROJECT_CONTEXT.md"
---

# affiliate-link-batch — context lifecycle only

**Scope:** This repo only. **Not** a general coding skill.

Determine which mode to run:

| Mode | When | Trigger |
|------|------|---------|
| **SESSION-START** | Beginning of session | `AGENTS.md`, `/affiliate-link-batch start` |
| **SESSION-END** | End of session | `SessionEnd` hook, `/affiliate-link-batch save` |

---

## SESSION-START — load context

Do this silently before any other work. Do not summarize the whole file to the user unless they ask.

1. Read `.grok/PROJECT_CONTEXT.md` if it exists — this is the primary context.
2. If missing, create it from:
   - `docs/ARCHITECTURE.md`
   - `README.md`
   - `manifest.json` (version, extension ID)
   - `CHANGELOG.md` (latest entry)
3. Also note current git branch and latest tag (`git describe --tags --always` if available).
4. Proceed with the user's task using loaded context. Do not re-explain the project unless asked.

---

## SESSION-END — save context

Run when the session is ending or user runs `/affiliate-link-batch save`.

**Context sources (best → weakest):**

1. **Same interactive session** (`/affiliate-link-batch save` before `/exit`) — full conversation memory.
2. **SessionEnd hook** — headless `grok --resume <sessionId>` reloads `~/.grok/sessions/.../updates.jsonl` for this chat.
3. **Fallback** — `git status`, `git diff`, and files on disk only (no chat history).

1. Read the current `.grok/PROJECT_CONTEXT.md` (or create from SESSION-START sources if missing).
2. Update it to reflect **this session**:
   - Version number if `manifest.json` changed
   - New features, bug fixes, or architecture changes
   - Release tags pushed
   - New conventions or user preferences discovered
   - Open todos or known issues
3. **Preserve** the existing section structure (One-liner, Repo, Architecture, Storage, etc.).
4. Update the `Last updated` line at the bottom with today's date.
5. **Do not** add personal PC paths, real Associate store IDs, or secrets.
6. **Do not** commit `.grok/PROJECT_CONTEXT.md` (gitignored).
7. Keep the file concise — trim obsolete pre-release notes if no longer relevant.

If there was no meaningful change this session, only bump `Last updated` or skip writes.

---

## Slash commands

```
/affiliate-link-batch start   → SESSION-START
/affiliate-link-batch save    → SESSION-END
```