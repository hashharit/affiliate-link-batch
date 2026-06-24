# Affiliate Link Batch

<!-- repo-context-automation:start -->
## Grok session context

Cross-session memory: `.grok/PROJECT_CONTEXT.md` (gitignored, local).

**Session start (mandatory):** Execute `.grok/skills/project-context/SKILL.md` **SESSION-START** before other work.

**Session end:** SessionEnd hook → **SESSION-END** (skips when nothing significant). Manual: `/project-context save`.

The `project-context` skill is **only** for loading/saving context — not for general coding tasks.
<!-- repo-context-automation:end -->