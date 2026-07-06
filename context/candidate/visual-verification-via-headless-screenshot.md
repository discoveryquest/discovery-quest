---
type: Metatron Decision
scope: verification / 3D + UI
confidence: high
source_refs:
  - packages/space/scripts/record-tutorial.mjs
---

## Pattern
Visually verify a running scene/UI by driving a headless browser and capturing a
screenshot, rather than claiming "looks right" from compile success alone —
compilation does NOT catch runtime crashes (e.g. an R3F/Rapier version mismatch
renders a blank canvas that still builds cleanly). Reuse the machinery
`record-tutorial.mjs` already relies on: `puppeteer-core`
(`platform/node_modules/puppeteer-core`) launched with the real Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `headless:'new'`,
WebGL flags (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist`). Start the dev server, `page.goto(...,
{waitUntil:'networkidle0'})`, wait a few seconds for R3F to render frames, then
`page.screenshot()`. Also collect `console`/`pageerror` events and assert a
`<canvas>` exists — a black image + a `pageerror` is the signature of a scene
that mounted but crashed. An agent can then read the PNG to judge the result.

## Rationale
This is a kid-facing, "must look good to be postable" project, and the two-repo /
React-version split makes runtime (not compile-time) failures likely. A cheap,
scriptable screenshot loop turns "I'm headless, so a human must look" into
automated visual evidence, and catches blank-canvas / crash regressions that unit
tests and `vite build` pass straight through. The browser + Chrome + WebGL flags
are already proven in this repo by the tutorial recorder, so there's nothing new
to install.
