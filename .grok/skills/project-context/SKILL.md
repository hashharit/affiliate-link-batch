---
name: project-context
description: >
  Project context lifecycle only — load at session start, save at session end.
  Cross-session memory lives in .grok/PROJECT_CONTEXT.md (gitignored, local).
  Do not use for feature work. Invoked via AGENTS.md, SessionEnd hook, or /project-context start|save.
disable-model-invocation: true
user-invocable: true
metadata:
  short-description: "Load/save .grok/PROJECT_CONTEXT.md"
---

# project-context — context lifecycle only

**Scope:** This repo only. **Not** a general coding skill.

| Mode | When | Trigger |
|------|------|---------|
| **SESSION-START** | Beginning of session | `AGENTS.md`, `/project-context start` |
| **SESSION-END** | End of session | `SessionEnd` hook, `/project-context save` |

---

## SESSION-START — load context

Do this silently before any other work. Do not summarize the whole file to the user unless they ask.

1. Read `.grok/PROJECT_CONTEXT.md` if it exists — primary handoff.
2. If missing, bootstrap from project files (first ones that exist):
   - `README.md`
   - `docs/ARCHITECTURE.md`, `ARCHITECTURE.md`
   - `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `manifest.json`
   - `CHANGELOG.md`
3. Note git branch and latest tag (`git describe --tags --always` when in a git repo).
4. Proceed with the user's task. Do not re-explain the project unless asked.

---

## SESSION-END — save context (only if significant)

**Context sources (best → weakest):**

1. **Same interactive session** (`/project-context save` before `/exit`) — full conversation.
2. **SessionEnd hook** — headless `grok --resume <sessionId>`. Skipped when no user/agent activity and git is clean.
3. **Fallback** — `git status`, `git diff`, files on disk only.

### Step 0 — significance gate (mandatory)

Before touching any file, decide whether **this session** changed anything worth carrying forward.

Review the conversation and run `git status` / `git diff` when in a git repo.

**Significant** — proceed:

- Code, manifest, docs, hooks, or config changed
- Version bumps, releases, or tags
- Features, fixes, or architecture decisions
- User preferences or conventions agreed
- Open todos or known issues to remember

**Not significant** — **skip entirely**:

- Pure Q&A with no repo impact
- Setup/hook verification only
- Re-explaining existing docs
- Casual chat with nothing to persist

If **not significant**: stop. Do **not** edit `.grok/PROJECT_CONTEXT.md`. Reply: `SESSION-END: skipped (no significant changes)`.

### Step 1 — update (only when significant)

1. Read `.grok/PROJECT_CONTEXT.md` (or bootstrap per SESSION-START if missing and significant).
2. Update for **this session** — version, features, fixes, releases, conventions, todos.
3. **Preserve** section structure (One-liner, Repo, Architecture, etc.).
4. Update `Last updated` **only when** other content changed.
5. No personal paths, machine-specific paths, or secrets.
6. Do **not** commit `.grok/PROJECT_CONTEXT.md` (gitignored).
7. Keep concise — trim obsolete notes.

---

## Slash commands

```
/project-context start   → SESSION-START
/project-context save    → SESSION-END
```