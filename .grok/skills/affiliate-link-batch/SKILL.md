---
name: affiliate-link-batch
description: >
  Work on the Affiliate Link Batch Firefox extension (Amazon SiteStripe batch
  affiliate links). Use for any task in this repo — features, bugs, manifest,
  content/background scripts, releases, AMO, debugging batches, run history,
  worker tab, background API. Triggers on affiliate-link-batch, SiteStripe,
  Amazon extension, floating button, batch extraction.
metadata:
  short-description: "Affiliate Link Batch extension — context + conventions"
compatibility: Firefox MV3, web-ext, amazon.in/amazon.com search pages
---

# Affiliate Link Batch (project skill)

**Scope:** This skill applies only in the `affiliate-link-batch` repository. It is not global.

## Session start (always)

1. Read `.grok/PROJECT_CONTEXT.md` if it exists (full handoff).
2. Else read `docs/ARCHITECTURE.md`, `README.md`, and `manifest.json` for version/ID.
3. Respect `AGENTS.md` and `.grok/rules/` (auto-loaded).

## Project summary

Firefox extension that batch-extracts SiteStripe affiliate links from Amazon **search** pages.

- **Do not** click SiteStripe buttons programmatically (`isTrusted` fails).
- **Do** use background `getShortUrl` API (`sitestripe-api-bg.js`) or worker tab page modules (`worker-tab.js`).
- **Repo:** https://github.com/hashharit/affiliate-link-batch
- **Releases:** GitHub Releases (zip), not GitHub Packages.
- **`dev` branch:** local only — never push.

## File map (quick)

| Area | Path |
|------|------|
| Bootstrap / batch UI | `src/content/07-main.js` |
| Dialog + tabs | `src/content/06-dialog.js` |
| Run history | `src/content/06-run-history.js` |
| Amazon cards | `src/content/03-amazon-adapter.js` |
| Orchestrator | `src/background/batch-orchestrator.js` |
| Background API | `src/background/sitestripe-api-bg.js` |
| Worker tab | `src/background/worker-tab.js` |

Content script order in `manifest.json` is fixed — do not reorder without strong reason.

## Debugging

- Batch issues: **background inspector** (`about:debugging` → Inspect), look for `[ALB]` logs.
- Preferred dev load: `about:debugging` temporary add-on (keeps Amazon login).
- `web-ext-config.cjs` is local/gitignored; copy from `web-ext-config.example.cjs`.

## Releases

1. Bump `manifest.json` + `CHANGELOG.md`
2. `git push origin main` + `git tag vX.Y.Z` + `git push origin vX.Y.Z`
3. `web-ext build --overwrite-dest` or `scripts/package.ps1`
4. `gh release create vX.Y.Z web-ext-artifacts/*.zip --title ... --notes ...`

## Hygiene

- No personal PC paths or real Associate store IDs in committed files.
- Do not resurrect deleted scaffold (`src/shared/`, `src/adapters/`, `src/worker/`).
- Checkboxes stay selected after batch; history is `storage.local` only.

## After major changes

Update `.grok/PROJECT_CONTEXT.md` (local) to match.