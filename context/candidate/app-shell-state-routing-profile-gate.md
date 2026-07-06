---
type: Metatron Decision
scope: packages/*/src/App.jsx
confidence: high
source_refs:
  - packages/space/src/App.jsx
  - platform/apps/space-quest/src/main.jsx
  - examples/space-preview/src/main.jsx
---

## Pattern
Each course app shell (`App.jsx`) uses **in-app state routing** — a `useState`
route object like `{ mode, profileId }` behind a **profile gate** (setup → picker
→ game) — and there is **no `react-router`** and no reading of
`window.location.pathname` in the normal flow. Both the deploy entry
(`platform/apps/space-quest/src/main.jsx`) and the dev preview render the same
`<App/>` from the package. To add a standalone route (e.g. a cold-open experience
that must bypass the profile gate), branch on `window.location.pathname` **as the
first statement inside `App()`** (before any profile hooks) and return the
alternate tree — do not add a router. Lazy-load anything heavy behind that branch
so it stays out of the main bundle.

## Rationale
The apps are single-purpose SPAs where "routing" is really game state, so a router
is unnecessary weight. Putting the pathname branch at the top of the shared `App`
means one edit covers every entry point (deploy + preview) without touching each
`main.jsx`, and keeps profile-free entry points from tripping the gate.
