# Grok session context

On session start, run the `project-context` skill **SESSION-START** mode (see `AGENTS.md`).

On session end, the SessionEnd hook runs **SESSION-END** to update `.grok/PROJECT_CONTEXT.md` when significant work occurred.