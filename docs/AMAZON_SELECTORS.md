# Amazon DOM Selectors

Reference for contributors maintaining search-page and SiteStripe integration.

Domain note: selectors were validated on **amazon.in**; **amazon.com** is expected to share the same SiteStripe IDs (verify on first .com test).

---

## SiteStripe toolbar (search + product pages)

| Element | Selector | Notes |
|---------|----------|-------|
| Stripe root | `#nav-AssociateStripe`, `#amzn-ss-wrap` | Present on search and product pages |
| Get Link button | `#amzn-ss-get-link-button` | `title="Get Link."`, `aria-haspopup="dialog"` |
| Text link trigger | `#amzn-ss-text-link` | `data-action="amzn-ss-show-text-popover"` |
| Settings | `#amzn-ss-settings-popover-link` | |

**Login / active check:** `#amzn-ss-get-link-button` visible inside `#nav-AssociateStripe` within timeout.

---

## Get Link popover (dynamic — not in saved HTML)

The popover is injected at runtime when **Get Link** is clicked.

| Element | Selector | Notes |
|---------|----------|-------|
| Popover (AUI) | `[data-a-popover-name="amzn-ss-popover-text-preload-content"]` or `.a-popover:has(#amzn-ss-text-shortlink-textarea)` | |
| Short link radio | `#amzn-ss-short-link-radio-button` | Auto-selected on open (enhanced flow) |
| Full link radio | `#amzn-ss-full-link-radio-button` | |
| Short link value | `#amzn-ss-text-shortlink-textarea` | Textarea populated after XHR |
| Full link value | `#amzn-ss-text-fulllink-textarea` | |
| Copy button | `#amzn-ss-copy-affiliate-link-btn`, `#amzn-ss-copy-affiliate-link-btn-announce` | |
| Loading spinner | `#amzn-ss-loading-spinner`, `.amzn-ss-copy-spinner` | Wait for hide before reading |
| Failure message | `.amzn-ss-popover-link-failure-message` | |

### Short URL API

```
GET /associates/sitestripe/getShortUrl
  ?longUrl=...
  &marketplaceId=...
  &storeId=...
```

The extension calls this API directly from the background (preferred) or from the worker tab page context (bootstrap / fallback). Programmatic clicks on SiteStripe buttons are not used — Amazon ignores untrusted clicks.

---

## Search results (`/s?k=...`) — product cards

### Primary result rows

| Field | Selector / rule |
|-------|-----------------|
| Card root | `[data-component-type="s-search-result"][data-asin]` |
| ASIN | `data-asin` attribute (10-char alphanumeric) |
| Sponsored flag | `.AdHolder` on same card |
| Title | `h2 a span` within card |
| Product URL | `h2 a[href*="/dp/"]` or `a[href*="/dp/"]` → normalize to `https://{host}/dp/{ASIN}` |

### Additional product tiles (carousels / inline widgets)

| Field | Selector / rule |
|-------|-----------------|
| Tile | `.s-result-item[data-asin]` without requiring `s-search-result` |
| ASIN | `data-asin` on tile |
| Layout | Often `desktop-grid-content-view` inside `puis-card-container` |

### Skip rules

- `data-asin=""` — messaging widgets, headers, empty slots
- No `/dp/` or ASIN resolvable → failure at extract time

### Results container (MutationObserver)

Observe: `.s-main-slot.s-result-list` or `[data-component-type="s-search-results"]`

---

## Product detail page

| Field | Selector |
|-------|----------|
| Title | `#productTitle` |
| ASIN | from URL `/dp/{ASIN}` or page metadata |

---

## Implementation notes

1. **Worker tab** navigates to product URL (`/dp/{ASIN}`), not search URL — SiteStripe needs product context.
2. **List vs grid**: list uses `desktop-list-view`; grid uses `desktop-grid-content-view` — title/link selectors still apply within card root.
3. **amazon.com**: reuse selectors; only host prefix and `marketplaceId` differ.