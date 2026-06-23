# Contributing

Thanks for helping improve Affiliate Link Batch.

## Setup

1. Clone the repository.
2. Load via `about:debugging` (recommended) or configure `web-ext`:

   ```bash
   cp web-ext-config.example.cjs web-ext-config.cjs
   ```

3. Open an Amazon search page while logged into Associates with SiteStripe enabled.

## Project layout

```
src/content/     Content scripts (UI, adapter, history)
src/background/  Batch orchestration, SiteStripe API, worker tab
docs/            Architecture and selector reference
scripts/         Dev helpers (PowerShell)
icons/           Extension icons
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

## Making changes

- Match existing code style (classic scripts, `window.ALB` namespace, no bundler).
- Content script load order is defined in `manifest.json` — do not reorder without reason.
- Test on both `amazon.in` and `amazon.com` search pages when touching the adapter.
- Debug batches in the **background inspector**, not only the page console.

## Pull requests

1. Describe what changed and why.
2. Note manual test steps (search page, batch size, any failures).
3. Keep diffs focused — avoid unrelated refactors.

## Dev-only branch

HTML analysis scripts for selector research live on the private `dev` branch, not on `main`.

## Reporting issues

Include:

- Firefox version
- Amazon domain (`.in` / `.com`)
- Whether you are logged into Associates / SiteStripe visible
- Background console logs (`[ALB]` lines)
- Steps to reproduce