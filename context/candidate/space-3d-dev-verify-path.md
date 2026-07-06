---
type: Metatron Decision
scope: packages/space / 3D dev + verify
confidence: high
source_refs:
  - platform/apps/space-quest/src/main.jsx
  - examples/space-preview/src/main.jsx
  - packages/space/package.json
---

## Pattern
Editing `discovery-quest/packages/space` source does **not** change what the
`platform/apps/space-quest` build produces: platform resolves
`@discoveryquest/space` via `node_modules/@discoveryquest/space → ../../packages/space`,
a **vendored copy inside the `platform` repo** (the manual mirror), not the open
worktree. So a `vite build` in the platform app that shows an unchanged bundle
hash after open-repo edits is expected, not a bug. To verify open-repo changes to
the space package you must either (a) mirror the changed files into
`platform/packages/space` and build there, or (b) run a dev harness in the **open**
repo that imports the source directly. The only open-repo harness that imports
`packages/space/src` today is `examples/space-preview` — but it is **React 19 and
2D-only (no `three`)**, so it cannot render the 3D scene as-is. Decide the 3D
dev/verify path explicitly per feature; do not assume the platform app builds your
worktree source.

**Resolved harness for the Mars POC:** `examples/mars-preview/` — a Vite dev shell
(React 18 + `@react-three/fiber@8` + `@react-three/drei@9` + `@react-three/rapier@1`,
matching the platform deploy target) that imports `packages/space/src/mars/MarsRoute.jsx`
straight from source. Run `npm install` **in the worktree root first** (a fresh git
worktree has no `node_modules`; pure `node --test` files don't need it, but the 3D
harness does), then `cd examples/mars-preview && npm run dev` → `http://localhost:5173`.
`npm run build` there confirms the scene compiles and that `MarsSurface` (three +
Rapier WASM) splits into its own lazy chunk, off the main bundle.

## Rationale
The two-repo split (open source-of-truth + platform deploy) is wired with a
*vendored copy*, not a live symlink across repos, so the open worktree and the
platform build are decoupled until a human mirrors. The React-version split (open
preview on 19, deploy on 18/fiber v8) means a single 3D dev harness can't trivially
serve both. Knowing this up front prevents wasted "why didn't my change build"
loops and forces a conscious choice of where 3D work is iterated vs shipped.
