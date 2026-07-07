# Review — Mars Surface POC Design Spec

**Reviewer:** fugu (agent)
**Date:** 2026-07-06
**Spec reviewed:** `docs/superpowers/specs/2026-07-06-mars-surface-poc-design.md` (branch `mars-surface-poc`)
**Verdict:** ✅ **Approved to proceed** — with a few must-fix clarifications and some recommended additions below.

---

## TL;DR

This is a strong, well-scoped spec. The scope discipline (YAGNI section), the
config-driven "Moon is just another config" bet, the placeholder-then-Meshy
de-risking, and the explicit callout of the known static-asset ignore-pattern
gotcha all show it's written by someone who knows this codebase's sharp edges.
I approve it. The gaps below are mostly about *wiring reality* (routing,
dependencies, the two-repo mirror) rather than the vision, which is sound.

---

## What I like (keep as-is)

- **Scope is honest.** §2 Non-Goals is doing real work — no course/XP/schema
  coupling, bounded terrain, no new voice pipeline. This is what keeps a POC a
  POC.
- **The structural bet is the right one.** World-specific data in `marsConfig.js`
  + world-agnostic components is exactly how you make Moon nearly free later.
  Isolating it under `packages/space/src/mars/` and decoupling from
  `quest-runtime`/course loading is the correct call.
- **De-risking the humanoid.** Placeholder capsule → validate the whole loop →
  swap Meshy Luna behind `Luna.jsx` (§11.1) is the single most important
  risk mitigation and it's already baked in.
- **The asset-ignore-pattern warning (§6).** This has actually bitten this repo
  before (`**/shots` dropping course assets). Calling it out *in the spec* is
  excellent.
- **The gravity toggle (§4).** Cheap, high educational payoff, and genuinely the
  most shareable/viral moment. Good instinct to promote it to recommended-MVP.
- **Testing focuses on pure logic** (config shape, jump-apex math, deterministic
  seeded wind, raycast selection) instead of trying to unit-test R3F scenes.
  Correct testing philosophy for a 3D app.

---

## Must-fix / clarify before build (blocking-ish)

### M1. The `/mars` "route" doesn't exist as described — the app has no URL routing
The spec repeatedly says "mounted at a `/mars` route" and targets
`space.discoveryquest.app/mars`. But today:
- `packages/space/src/App.jsx` uses **in-app state routing** (`useState(route)`
  with `{ mode, profileId }`), **not** `react-router` and it never reads
  `window.location.pathname`.
- The deploy server (`platform/apps/space-quest/server/index.mjs`) is a
  **catch-all SPA fallback** — every unknown path serves `index.html`. So
  `/mars` will load the app, but the app will just render the normal Space Quest
  home, *not* Mars.

**Action:** Add an explicit sub-section on how `MarsRoute.jsx` actually gets
mounted. Simplest POC-friendly option: in `App.jsx` (or `main.jsx`), branch on
`window.location.pathname.startsWith('/mars')` and render `<MarsRoute/>`
fullscreen, bypassing the profile gate entirely. Note that this also means Mars
should **not** require a player profile to load (good for a viral cold-open
link — decide this explicitly). Adding `react-router` is overkill for one route;
a pathname check is enough, but say so.

### M2. `@react-three/rapier` is a brand-new dependency — call it out
Rapier is **not** currently a dependency anywhere in the repo. `packages/space`
declares `three`, `@react-three/fiber`, `@react-three/drei` as *peer* deps only.
The spec should:
- Explicitly list `@react-three/rapier` (and note it pulls in a WASM physics
  bundle) as a new dependency, and decide where it's declared (peer vs direct).
- Note the **bundle-size / WASM-init** cost, since §11.2 already worries about
  mobile perf. Rapier's WASM adds startup weight; worth a sentence on lazy-
  loading the whole Mars module (dynamic `import()`) so it never touches the
  main Space Quest bundle.

### M3. The two-repo mirror is a footgun that will silently break the demo
§10 mentions the manual `packages/space` → `platform/apps/space-quest` mirror,
which "silently goes stale if skipped." For a spec whose entire deliverable is a
*shareable live link*, this is the highest-probability failure mode. Strengthen
it into a concrete pre-share checklist:
1. build in `packages/space`,
2. mirror to `platform/apps/space-quest`,
3. confirm `public/mars/**` survives `.dockerignore`/`.gitignore`,
4. deploy to `discoveryquest-space`,
5. `curl` each live asset URL (panorama, rover glb, textures, audio) for `200`
   + correct `content-type`,
6. open the live `/mars` link on a real phone and do the full loop.

### M4. Define "smooth framerate on a mid-range phone" with a number
Success criteria and §11.2 both lean on mobile perf but there's no target.
Pick a testable bar (e.g. "≥30 fps sustained on a ~2021 mid-range Android in
first-person while a rock is in flight and wind is gusting") and a reference
device. Otherwise "smooth" is unfalsifiable and perf work has no stop condition.

---

## Recommended additions (non-blocking, high value)

### R1. A "reset / recall rock" affordance
In real 0.38 g play, kids *will* throw all the rocks off the map or into
unreachable spots. Add a cheap "reset rocks" button (or auto-respawn a rock at
Luna's feet after N seconds out of reach). Prevents a dead-end demo. Very small.

### R2. Photo mode / shareable capture built in
The whole point is a viral clip. Consider a one-tap **"snapshot"** (canvas →
PNG, with a subtle `discoveryquest.app/mars` watermark) and, if time allows, a
short GIF/clip capture of the last few seconds. This directly serves the stated
goal ("watch it arc slowly is the money shot") and turns every player into a
distributor. Even just the still-photo button is high ROI.

### R3. Loading / first-paint experience
3D + WASM + glb/panorama downloads = a non-trivial cold load, especially on
mobile over cellular from a shared link. Spec a **loading screen** (progress +
a Luna line + a fact card so the wait is on-brand) and define behavior on slow
networks. Right now the spec jumps from "open `/mars`" to "immediately standing
on Mars," which won't be instant. Also decide the fallback for WebGL-unavailable
/ very-old devices (a graceful "your device can't walk on Mars yet" card).

### R4. Accessibility / reduced-motion
There's already `packages/space/src/util/reducedMotion.js` in the repo — reuse
it. Wind screen-drift, camera bob, and dust can be nausea triggers. Respect
`prefers-reduced-motion` (dampen camera shake/screen dust, keep the world). Also
note pointer-lock can trap desktop users — ensure `Esc` clearly exits.

### R5. Onboarding for controls (30-second problem)
A cold visitor from a social link has zero context. Spec a **brief first-touch
hint layer** ("drag to look, tap the glowing rock, hit jump") that fades after
first use. Without it, most phone visitors bounce before finding the throw
mechanic — killing the exact viral moment you're building for.

### R6. Analytics on the funnel (lightweight)
If the goal is "does it land," instrument a handful of anonymous events
(loaded, first-move, first-jump, first-throw, found-rover, snapshot-taken) so
Pavel can actually tell whether the post converted to *play*. One counter per
milestone; no PII. Confirm whether the existing app already has an analytics
channel to reuse rather than adding one.

### R7. Name the actual NASA source URLs in the spec
§6 says assets are downloaded from `nasa3d.arc.nasa.gov`, `mars.nasa.gov`,
`science.nasa.gov`. Pin the *specific* Perseverance `.glb` and panorama URLs (or
asset IDs) in the spec now — these NASA URLs move/rename over time, and "verify
network reach" today ≠ "URL still resolves during build." Also record the
chosen panorama's resolution (skybox size is a real mobile perf/VRAM lever).

### R8. Decide the Rock ⇄ Rover interaction edge cases
Small but worth a line: can a thrown rock hit the Perseverance rover (does it
collide, ragdoll, or pass through)? Kids *will* try. Cheapest answer: rover is a
static collider that rocks bounce off — satisfying and safe.

---

## Nits / minor

- **N1.** §3 mentions both `WorldConfig.d/.js` and "WorldConfig shape is valid"
  in tests — clarify whether there's a runtime validator or just a JSDoc/`.d.ts`
  shape. The test in §9 implies a runtime schema check; make sure one exists.
- **N2.** §7 says "Missing file = silently no-op (existing engine behavior)" for
  audio. Good, but for a viral demo silence-on-missing-asset is exactly how you
  ship a broken-feeling demo without noticing — fold audio files into the M3
  `curl` checklist.
- **N3.** Consider stating the intended **orientation** handling on mobile
  (portrait vs landscape). A first-person walking sim is much better in
  landscape; decide whether to prompt/rotate.
- **N4.** `Hands.jsx` (FP gloves) is listed as MVP; given §11.1's placeholder-
  first philosophy, mark FP hands as "nice, can ship with a simple reticle
  first" so they don't block the loop.

---

## Suggested MVP re-cut (small tweak to §12)

Keep the §12 MVP list, and **fold in** the cheap-but-demo-critical items:
add **R1 (rock reset)**, **R3 (loading + WebGL fallback)**, **R5 (controls
hint)**, and **M1 (real `/mars` mount + no-profile entry)** to MVP — none are
big, and without them the shared link underperforms. Keep **R2 (photo/clip
capture)**, **R4 (reduced-motion)**, and **R6 (analytics)** as fast-follow if
time is tight, though R2 arguably belongs in MVP given the viral goal.

**Bottom line:** Approved. Address M1–M4 (they're wiring/reality gaps, not
redesigns), pull the cheap UX items into MVP, and this is a great POC.
