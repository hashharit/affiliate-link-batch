# Affiliate Link Batch — Grok project rules

**At the start of every session in this repo**, before answering or editing anything:

1. Read `.grok/PROJECT_CONTEXT.md` if it exists (full project handoff).
2. If missing, read `docs/ARCHITECTURE.md` and `README.md`.

---

## Project

Firefox MV3 extension: batch-copy Amazon SiteStripe affiliate links from search pages (`amazon.in`, `amazon.com`).

- **Repo:** https://github.com/hashharit/affiliate-link-batch
- **Version:** see `manifest.json`
- **Extension ID:** `affiliate-link-batch@github.com`

## Non-negotiables

- **No programmatic SiteStripe button clicks** — use background API or worker tab page modules.
- **Content script load order** is fixed in `manifest.json` — do not reorder casually.
- **Debug batches** in the background inspector (`about:debugging`), not only the Amazon page console.
- **Dead code removed** — do not resurrect `src/shared/`, `src/adapters/`, `src/worker/`.
- **Release builds** go to GitHub **Releases** (not GitHub Packages): `web-ext build` → `gh release create`.
- **`dev` branch** is local only (Python analysis scripts) — do not push.
- **No personal paths or store IDs** in committed files.

## Code layout

- `src/content/` — UI, adapter, history, dialog, main bootstrap
- `src/background/` — orchestrator, SiteStripe API, worker tab, settings

## User preferences

- Checkboxes stay selected after batch.
- Run history is `storage.local` only.
- `web-ext-config.cjs` is gitignored (local); `web-ext-config.example.cjs` is the template.