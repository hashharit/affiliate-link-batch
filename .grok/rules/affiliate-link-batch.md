# Context lifecycle

On session start, run the `affiliate-link-batch` skill SESSION-START mode (see `AGENTS.md`).

On session end, the SessionEnd hook runs SESSION-END mode to update `.grok/PROJECT_CONTEXT.md`.