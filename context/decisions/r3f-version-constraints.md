---
type: Metatron Decision
scope: 3D / react-three-fiber
confidence: high
source_refs:
  - platform/apps/space-quest/package.json
  - examples/space-preview/package.json
---

## Pattern
The 3D stack lives in the **`platform/apps/space-quest` deploy app** (React 18,
`three@^0.169`, `@react-three/fiber@^8`, `@react-three/drei@^9`) — the
`examples/space-preview` shell is React 19 and **2D-only**, so run/verify anything
3D against the space-quest app, not the preview. Any new R3F-ecosystem dependency
must match the **fiber v8 / React 18** line: e.g. `@react-three/rapier@^1` (v2
requires fiber v9 / React 19). Check the peer/React requirement of an R3F add-on
before installing; pin to the v8-compatible major.

## Rationale
fiber v8 and v9 are React-18 vs React-19 boundaries, and the R3F add-on ecosystem
(rapier, drei, postprocessing) versions in lockstep with fiber. Installing a
"latest" add-on silently pulls a v9-era release that breaks against the installed
React 18 / fiber 8, with confusing runtime errors rather than a clean install
failure. The two shells run different React majors, so 3D work belongs in the
React-18 app.
