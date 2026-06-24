# Changelog

All notable changes to Affiliate Link Batch are documented here.

## [1.0.4] — 2026-06-24

### Changed

- Extension icons (chain link + batch motif, orange gradient)

## [1.0.3] — 2026-06-24

### Fixed

- Replace `innerHTML` with DOM APIs in dialog and floating button (AMO lint clean)

## [1.0.2] — 2026-06-24

### Fixed

- `icon-128.png` corrected to 128×128 (AMO validation)
- `strict_min_version` bumped to 142.0 for `data_collection_permissions` compatibility

## [1.0.1] — 2026-06-24

### Fixed

- Move `homepage_url` to manifest root (MV3) — removes Firefox load warning

## [1.0.0] — 2026-06-24

First public release.

### Added

- Batch affiliate link extraction from Amazon search results (organic + sponsored)
- Background SiteStripe API path (no product tab when credentials are known)
- Worker tab fallback and credential bootstrap
- Auto-save Store ID and Tracking ID from first successful extraction
- Floating button with progress, View results mode, Shift+click re-run
- Dialog: Extract, Output, Failures, History, Settings
- Local run history (up to 20 runs, `storage.local`) with clock icon
- Separator presets and custom separator
- Retry failed products, cancel batch

### Supported

- `amazon.in` and `amazon.com` search pages (desktop)

---

## Pre-release history

### [0.5.0]

- Run history with clock icon on floating button

### [0.4.3]

- Fix floating button re-running batch after completion (View results)

### [0.4.2]

- Background API MD5 fix; worker tab fallback on API errors

### [0.4.1]

- Auto-save SiteStripe credentials; background API for products 2+

### [0.3.x]

- SiteStripe API via page modules; worker tab focus fix

### [0.2.x]

- Search UI, batch dialog, worker tab extraction