# Affiliate Link Batch

Firefox extension to batch-copy Amazon SiteStripe affiliate links from search results (organic + sponsored).

**Repository:** [github.com/hashharit/affiliate-link-batch](https://github.com/hashharit/affiliate-link-batch)

**Supported:** `amazon.in`, `amazon.com` — search pages, desktop.

> Not affiliated with Amazon. You must comply with the [Amazon Associates Program](https://affiliate-program.amazon.com/help/operating/policies) policies.

---

## Install

### Firefox Add-ons (recommended)

Search for **Affiliate Link Batch** on [addons.mozilla.org](https://addons.mozilla.org/) once published.

### GitHub Release

1. Download the latest `.zip` from [Releases](https://github.com/hashharit/affiliate-link-batch/releases).
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Click **Load Temporary Add-on…** and select the `manifest.json` inside the extracted folder.

> Unsigned builds loaded this way are temporary and removed when Firefox restarts. The signed AMO build persists across restarts.

---

## Requirements

- Logged into **Amazon Associates** in the same Firefox profile
- **SiteStripe** enabled on your Associates account
- Amazon **search** results page open (e.g. `https://www.amazon.in/s?k=power+bank`)

---

## Quick start

1. Open an Amazon search page.
2. Check the products you want.
3. Click **Get affiliate links** (floating button, top-right).
4. Copy formatted output from the **Output** tab.

- Checkboxes stay selected after extraction.
- Failed products appear under **Failures** with retry.
- After a batch completes, the button shows **View results** — click again to reopen without re-running.
- **Shift+click** the main button to force a new extraction on the same selection.
- Click the **clock icon** on the button to open **History** (past runs saved on this device).

---

## How link extraction works

The extension does **not** click SiteStripe buttons (Amazon ignores programmatic clicks). It calls the same **`/associates/sitestripe/getShortUrl`** API that SiteStripe uses internally.

### Background API (preferred)

Uses your Firefox **Amazon login cookies** plus saved **Store ID** and **Tracking ID**. No product tab opens.

### Worker tab (bootstrap / fallback)

Opens one reusable tab per product, runs SiteStripe page modules, then returns you to the search tab. Required for the first successful link when credentials are not saved, or when the background API fails.

| Step | What happens |
|------|----------------|
| Product 1 | Worker tab → extract → **auto-save** Store/Tracking IDs (if Settings empty) |
| Products 2+ | Background API first; worker tab only on failure |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---

## Settings

Open the dialog → **Settings** tab.

| Setting | Description |
|---------|-------------|
| Output template | Default `{title} : {affiliate_link}` — placeholders: `{title}`, `{affiliate_link}`, `{url}`, `{asin}` |
| Separator | Preset or custom (`\n` for newline) |
| Store / Tracking ID | Auto-filled after first success; edit for multiple stores |
| Use background API | On by default when IDs are set |
| Delay / timeout | Between products and SiteStripe wait time |

---

## Privacy

See [PRIVACY.md](PRIVACY.md). Summary:

| Stored | Where | Synced |
|--------|-------|--------|
| Settings, Store/Tracking IDs | `storage.sync` | May sync via Firefox Sync |
| Run history (output + failures) | `storage.local` | Device only |
| Amazon session cookies | Firefox cookie jar | Not stored by this extension |

---

## Development

### Load in your existing Firefox (keeps Amazon login)

1. `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → select `manifest.json`
3. Reload the extension after code changes

Or: `powershell -File scripts/open-debugging.ps1`

### web-ext

```bash
cp web-ext-config.example.cjs web-ext-config.cjs
# Edit web-ext-config.cjs with your Firefox path
web-ext run
```

Close all Firefox windows first, or use `about:debugging` instead.

### Build release package

```powershell
powershell -File scripts/package.ps1
```

Output: `web-ext-artifacts/*.zip` — attach to GitHub Releases.

### Debugging batches

Use the **background inspector** (`about:debugging` → Inspect), not only the Amazon page console.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](LICENSE).