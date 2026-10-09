# Obecno Live Guide

Dual-tab local host for **architecture** (Archify diagrams) and **QA Agent** (scenarios + results). Lives entirely under `~/Documents/obecno-archify/`.

**The Obecno Flutter app repo (`Downloads/obecno`) is never touched by this guide.**

## Start

From the archify root:

```bash
cd /Users/hassan/Documents/obecno-archify
node live-guide/server.mjs
```

Then open [http://127.0.0.1:8765/live-guide/](http://127.0.0.1:8765/live-guide/).

The server serves `obecno-archify/` as document root (port **8765**) so relative paths to `architecture-*` and `qa/` work. `/` redirects to `/live-guide/`.

## Tabs

### 1 · Current system

Embeds the single-scroll full architecture guide:

`../architecture-obecno-api-guide-20261006-222000/obecno-api-full-guide.html`

That page uses a **sticky section nav** and roomier iframes. Section order:

1. **Mobile runtime** — `enhanced/runtime.html`
2. **Screen flows** — `enhanced/auth-screens.html`, `employee-screens.html`, `manager-screens.html`, `more-screens.html`
3. **Detailed / API maps** — `enhanced/auth.html`, `employee.html`, `manager-tabs.html`, `manager-people.html`, `more.html`

Dashed edges on detailed employee / manager / more maps are **bottom-sheet flows**. Click nodes for APIs + sheets (`screen-catalog.js` + `passport-enhance.js`); each section also has a catalog-powered API grid under the diagram.

**Runtime recovery:** original `obecno-runtime.html` was missing (JSON only). Regenerated via Archify `deliver` from frozen `candidate.json` (evidence fields stripped because local `git` is blocked by the Xcode license). See `enhanced/RUNTIME_RECOVERY.md`.

### 2 · QA Agent

Live UI over:

| Path | Role |
|------|------|
| `../qa/catalog/scenarios.json` | Test scenario catalog |
| `../qa/results/<run_id>/summary.json` | Pass/fail counts, bug notes |
| `../qa/reports/**` | Human / evidence report links |

Shows module groups, role filters, run list, and pass/fail/blocked/skip counts. Empty states appear until catalog/results exist.

## Live updates

- `app.js` cache-busts fetches with `?t=timestamp`
- Polls every **2s**
- Prefers **SSE** at `/api/watch` (server watches `qa/catalog`, `qa/results`, `qa/reports`, and architecture `enhanced/`)

No manual rebuild needed when those files change on disk.

## Files

```
live-guide/
  index.html      Two tabs only
  styles.css      Dark Archify-adjacent UI
  app.js          Tabs + live QA fetch/SSE
  server.mjs      Static root + /api/watch + QA list APIs
  README.md       This file
```
