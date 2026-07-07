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

**Resolved harness for the Mars POC:** `tools/mars-preview/` — a **standalone (NON-
workspace) Vite app**, deliberately outside `packages/*` and `examples/*`. Why not a
workspace member: the workspace hoists React 19 + `@react-three/fiber@9` (dragged in
by `space-preview`/`logic-preview` which pin `react@^19`, plus the course packages'
wildcard `react:"*"`/`@react-three/*:"*"` peers), and `@react-three/rapier@1` — though
its peer range says `fiber>=8.9.0` — actually breaks at runtime against fiber 9 /
React 19 (blank canvas + `Cannot read properties of undefined (reading 'S')`). The
Mars 3D stack is hard-pinned to the **deploy-matching** React 18 + fiber v8 + drei v9
+ rapier v1. To get that without disturbing the other previews: keep `tools/mars-
preview` out of the workspace so `npm install` **run inside it** creates its own
`node_modules` (react 18.3.1 / fiber 8.18 / rapier 1.5), and set vite
`resolve.dedupe: ['react','react-dom','@react-three/fiber','@react-three/drei',
'@react-three/rapier','three']` so the imported mars source (which lives up in
`packages/space`) resolves those singletons to this app's single copy. Run: `cd
tools/mars-preview && npm install` (once), then `npm run dev` → `http://localhost:5173`.
`npm run build` confirms the scene compiles and that `MarsSurface` (three + Rapier
WASM) splits into its own lazy chunk. **Do not force React 18 via root `overrides`** —
it ERESOLVE-conflicts with the React-19 previews. Visual-verify with the headless
screenshot method (`tools/mars-preview/shot.mjs`; see candidate
`visual-verification-via-headless-screenshot`).

## Rationale
The two-repo split (open source-of-truth + platform deploy) is wired with a
*vendored copy*, not a live symlink across repos, so the open worktree and the
platform build are decoupled until a human mirrors. The React-version split (open
preview on 19, deploy on 18/fiber v8) means a single 3D dev harness can't trivially
serve both. Knowing this up front prevents wasted "why didn't my change build"
loops and forces a conscious choice of where 3D work is iterated vs shipped.
