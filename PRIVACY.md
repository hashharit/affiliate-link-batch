# Privacy Policy

**Affiliate Link Batch** processes data entirely in your browser. This extension does not send data to the developer or any third-party server.

## What the extension stores

### Settings (`browser.storage.sync`)

May sync across Firefox instances if you use Firefox Sync:

- Output template and separator preferences
- Delay and timeout values
- Associate Store ID and Tracking ID strings (SiteStripe identifiers you can also see in Amazon's UI)
- UI preferences (e.g. show dialog on extract)

### Run history (`browser.storage.local`)

Stored on this device only — not synced:

- Timestamp and summary of each batch run
- Formatted affiliate output text
- Failure details (product title, URL, error reason)
- Search page URL at time of run

Up to **20** recent runs are kept. Use **Clear history** in the History tab to delete them.

## What the extension does not store

- Amazon passwords or login tokens
- Amazon session cookies (these remain in Firefox's normal cookie store, managed by Firefox and Amazon)
- Analytics or telemetry
- Product selections across browser sessions (checkbox state is page-only)

## Network access

The extension only communicates with:

- `https://www.amazon.in/*`
- `https://amazon.in/*`
- `https://www.amazon.com/*`
- `https://amazon.com/*`

Requests use your existing Amazon login session (cookies) to call SiteStripe's `getShortUrl` API — the same mechanism SiteStripe uses in the page. No other hosts are contacted.

## Permissions

| Permission | Why |
|------------|-----|
| `tabs` | Worker tab navigation during extraction |
| `scripting` | Run SiteStripe logic in the worker tab |
| `storage` | Settings and run history |
| `clipboardWrite` | Copy output to clipboard |
| `clipboardRead` | Fallback read if SiteStripe copy path is used in worker tab |

## Your controls

- Clear run history: History tab → **Clear history**
- Clear settings: remove the extension or clear extension data in Firefox
- Disable background API: Settings tab (worker tab used instead)

## Amazon affiliation

This extension is not developed by or affiliated with Amazon. You are responsible for complying with the Amazon Associates Program policies when using affiliate links.

## Changes

This policy applies to version 1.0.0 and later. Updates will be noted in the repository changelog.