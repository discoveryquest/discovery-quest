---
type: Metatron Decision
scope: packages/*
confidence: high
source_refs:
  - packages/space/package.json
  - platform/apps/space-quest/package.json
---

## Pattern
`packages/*` (e.g. `@discoveryquest/space`) are **libraries consumed from source**
(they `exports` `./src/App.jsx` and are imported via workspace symlinks), not
standalone apps. Heavy runtime dependencies — React, framer-motion, `three`,
`@react-three/fiber`, `@react-three/drei` — are declared as **`peerDependencies`**
in the package and **actually installed in the consuming app** (e.g.
`platform/apps/space-quest`). When adding a new runtime dep that a package
imports: install the real version **in the app**, and **also declare it as a peer**
(optional via `peerDependenciesMeta` if not every shell needs it) in the package.

## Rationale
Keeping the package free of concrete dep versions lets multiple app shells (deploy
app, dev preview) supply their own compatible versions and avoids duplicate/
conflicting copies of singletons like React and three.js. Declaring the peer keeps
the package honest about what it needs so installs surface mismatches.
