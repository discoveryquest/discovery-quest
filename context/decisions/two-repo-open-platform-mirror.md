---
type: Metatron Decision
scope: repo-wide / deployment
confidence: high
source_refs:
  - packages/space/package.json
  - platform/apps/space-quest/src/main.jsx
---

## Pattern
Treat `discovery-quest` (open, source-of-truth) and `platform` (deploy app) as
**two separate git repositories** — `platform` is NOT a subdirectory of the
`discovery-quest` worktree. Runtime/library code is authored under
`discovery-quest/packages/**`; the deployed React app and its public assets live
in the sibling `platform/apps/<course>-quest/**`. When a change spans both (e.g.
new dependency + new public asset), make **two commits, one per repo**, and use
absolute paths / `git -C /Users/pavel/dev/discoveryquest/platform ...` for the
platform side. Never attempt a single atomic `git add platform/...` from the
open-repo worktree. The `packages/space` ↔ `platform` mirror is manual and goes
stale silently if skipped.

## Rationale
The two repos have different visibility (open vs deploy) and different histories;
they are linked only by a manual mirror and npm workspace symlinks. Assuming one
repo leads to `git add` failures or, worse, losing track of which repo owns which
change. The manual mirror is a known footgun, so any deploy-affecting change must
be consciously applied on the platform side.
