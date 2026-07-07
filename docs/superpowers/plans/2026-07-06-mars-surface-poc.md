# Mars Surface POC Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone "walk on Mars" experience at `space.discoveryquest.app/mars` — first-person (with third-person toggle) Luna in a spacesuit, real 0.38 g physics, pick-up-and-throw rocks, NASA panorama/rover, and wind/temperature feedback — built to be posted about.

**Architecture:** A self-contained, lazy-loaded module under `packages/space/src/mars/`. Everything world-specific is data in `marsConfig.js` validated by a runtime `validateWorldConfig()`, so a Moon world is a later config, not a rewrite. Mounted by a `window.location.pathname` check at the top of `App.jsx` (no router, no profile gate). Physics via `@react-three/rapier`. Reuses the package's existing `three` / `@react-three/fiber` / `@react-three/drei` stack and `@discoveryquest/voice-kit` audio engine.

**Tech Stack:** React 18, `@react-three/fiber@8`, `@react-three/drei@9`, `three@0.169`, `@react-three/rapier@^1` (pinned to the fiber-v8 line), `@discoveryquest/voice-kit`, Node's built-in test runner (`node --test`, `*.test.mjs`).

**Review response (fugu `.REVIEW.md`, 2026-07-06):** all seven must-fixes applied — **M1** two-repo ownership section + absolute platform paths + two-commit rule (verified `platform` and `discovery-quest` are separate repos and `platform` is not in this worktree); **M2** `/mars` route lazy-loaded from `App.jsx`; **M3** Rapier declared as an optional peer of `@discoveryquest/space`; **M4** removed the `require()`, top-level ESM imports; **M5** terrain uses a matching trimesh collider (heightfield fallback), never a flat cuboid; **M6** voice-kit has no volume setter, so gust swell uses an owned WebAudio gain (bed stays constant); **M7** `preserveDrawingBuffer` set at Canvas creation + same-origin snapshot note. Refinements folded in: **R1** range/logic validator checks, **R2** spec de-vitest'd, **R3** single shared `JUMP_V0`, **R4** recurring build checks (Tasks 2/7/12/19/21), **R5** safe non-destructive rock respawn, **R6** shared `inputStore`, **R7** pointer-lock gesture + `touch-action:none`, **R8** asset perf targets, **R9** route-unmount audio cleanup, **R10** Meshy is non-blocking polish.

---

## Spec

Source spec: `docs/superpowers/specs/2026-07-06-mars-surface-poc-design.md` (read it before starting; this plan implements it).

## Environment Facts (verified, do not re-derive)

- **`packages/space` is a library** (`exports` → `./src/App.jsx`); it declares `three`/`@react-three/fiber`/`@react-three/drei` only as **peerDependencies**. The real 3D deps are installed in the **consuming app** `platform/apps/space-quest` (`three@^0.169`, `@react-three/fiber@^8.17.10`, `@react-three/drei@^9.117.3`).
- **Primary dev/verify app:** `platform/apps/space-quest` (`npm run dev` → Vite, React 18, has the 3D stack, and is the deploy target). Open `http://localhost:5173/mars`. (`examples/space-preview` is React 19 / 2D-only — NOT used for the 3D scene.)
- **Both entry points render `<App/>` from `@discoveryquest/space`**, so the `/mars` branch lives in `packages/space/src/App.jsx` — one change covers preview and deploy.
- **Test runner:** `node --test` (from `packages/space`). Test files are `*.test.mjs` colocated with source. There is **no vitest**.
- **Reduced motion:** reuse `packages/space/src/util/reducedMotion.js` → `usePrefersReducedMotion()`.
- **Audio:** `@discoveryquest/voice-kit/music` exports `playMusic`, `stopMusic`, `setMusicEnabled`; tracks are `public/music/<name>.mp3`; missing file = silent no-op.
- **Static-asset gotcha:** `.dockerignore`/`.gitignore` `**/shots`-style patterns have dropped assets before. Mars assets go in `platform/apps/space-quest/public/mars/` — verify they survive ignore patterns before deploy.
- **Meshy:** `meshy` MCP server is registered and connected (tools `meshy_text_to_3d`, `meshy_rig`, `meshy_animate`, `meshy_download_model`, `meshy_check_balance`, …).

## Repo / Commit Ownership (read before touching files)

**This is two separate git repos.** This plan lives in and the worktree belongs to the open **`discovery-quest`** repo (`/Users/pavel/dev/discoveryquest/discovery-quest`, worktree at `.worktrees/mars-surface`). The **deployed React-18 app is in a *sibling* repo, `platform`** (`/Users/pavel/dev/discoveryquest/platform`) — it is **not** inside this worktree. You cannot `git add` a `platform/...` path from here.

- **`discovery-quest` repo owns (source of truth):** everything under `packages/space/src/mars/**`, `packages/space/package.json`, tests, this plan/spec, and `discovery-quest/scripts/fetch-mars-assets.mjs`.
- **`platform` repo owns:** `apps/space-quest/package.json` + lockfile (the Rapier dep), `apps/space-quest/public/mars/**` and `apps/space-quest/public/music/mars-wind.mp3` (deploy assets), and deploy verification.
- **Always use absolute paths for platform**, e.g. `/Users/pavel/dev/discoveryquest/platform/apps/space-quest/...`, and run `git -C /Users/pavel/dev/discoveryquest/platform ...` for its commits.
- **Cross-repo tasks require two commits** (one per repo), each tagged with the same task number. **Never promise a single atomic commit across both repos.** Tasks 2, 6, 18, 22, 23 are cross-repo.
- **Asset note:** since the fetch script lives in `discovery-quest`, it *writes into the sibling* `platform/apps/space-quest/public/mars/`; committing those files is a separate `platform`-repo commit.

## File Structure

All under `packages/space/src/mars/` unless noted. Each file has one responsibility.

```
mars/
  input/
    inputStore.js          # single source of keyboard/mouse/touch state (R6); consumers subscribe
  world/
    worldConfig.js         # validateWorldConfig(cfg) — runtime validator + JSDoc shape
    worldConfig.test.mjs
    marsConfig.js          # the Mars WorldConfig instance (gravity, sky, assets, wind, temp)
    marsConfig.test.mjs
  physics/
    gravity.js             # pure: apexHeight(v0,g), fallTime(h,g), WORLD gravity consts
    gravity.test.mjs
  fx/
    wind.js                # pure: gustAt(seed,t) deterministic gust profile [0..1]
    wind.test.mjs
    WindProvider.jsx       # React context: exposes live wind value to consumers
    DustParticles.jsx      # points-based dust driven by wind + footstep/impact bursts
  interact/
    selection.js           # pure: pickNearestInRange(player, rocks, maxDist) -> id|null
    selection.test.mjs
    Rock.jsx               # a rapier RigidBody rock: hover highlight, pickup, throw
    RockField.jsx          # spawns N rocks; auto-respawn when out of reach (R1)
    InteractionController.jsx  # raycast/prompt, hold, throw impulse; wires selection.js
  player/
    PlayerController.jsx   # rapier capsule; WASD/joystick move; jump w/ world gravity
    CameraController.jsx   # first-person rig + third-person orbit; view toggle
    Luna.jsx               # astronaut model (placeholder capsule first; Meshy glb later)
    Hands.jsx              # first-person reticle first; gloved-hands glb later (N4)
  scene/
    Terrain.jsx            # procedural terrain + MATCHING trimesh/heightfield collider (M5)
    SkyDome.jsx            # NASA panorama skybox + Mars sky tint + sun
    Rover.jsx              # NASA Perseverance glb, static collider, proximity fact card
    Lander.jsx             # spawn-anchor prop
    Pennant.jsx            # small flag; vertex sway driven by wind
  audio/
    marsSound.js           # constant wind bed (voice-kit) + OWN WebAudio gain for gust swell + positional SFX (M6)
  ui/
    Hud.jsx                # gravity/temp/wind gauges + view + Mars⇄Earth gravity toggles
    FactCard.jsx           # Luna-brand "did you know" popup
    Controls.jsx           # mobile touch joystick + buttons; desktop key hints
    ControlsHint.jsx       # first-touch onboarding overlay (fades after first use)
    LoadingScreen.jsx      # progress + Luna line + fact card; WebGL/old-device fallback
    Snapshot.jsx           # one-tap canvas→PNG with watermark
  store/
    marsStore.js           # tiny zustand-free store (useSyncExternalStore) for HUD state
  MarsSurface.jsx          # the R3F <Canvas>: lights, fog, physics <World>, mounts scene
  MarsRoute.jsx            # fullscreen entry: LoadingScreen + lazy MarsSurface + UI overlay

# discovery-quest repo, but outside the mars module:
packages/space/package.json              # declare @react-three/rapier as (optional) peer (M3)
packages/space/src/App.jsx               # lazy /mars pathname branch, before profile gate (M2)
scripts/fetch-mars-assets.mjs            # reproducible NASA fetch (writes into sibling platform)

# SIBLING platform repo (/Users/pavel/dev/discoveryquest/platform) — separate commits:
apps/space-quest/package.json            # add @react-three/rapier@^1 (pinned, React 18/fiber v8)
apps/space-quest/public/mars/            # NASA assets + generated Meshy assets
apps/space-quest/public/music/mars-wind.mp3  # ambient bed
```

## Milestones

- **M0 — Scaffolding & route** (Tasks 1–2): `/mars` renders a placeholder fullscreen, no profile.
- **M1 — World config** (Tasks 3–4): validated `marsConfig`.
- **M2 — Static scene** (Tasks 5–7): terrain + sky + NASA assets on screen.
- **M3 — Walk & gravity** (Tasks 8–11): physics, movement, jump, camera + view toggle.
- **M4 — Rocks** (Tasks 12–14): pick up, throw, reset.
- **M5 — Environment feedback** (Tasks 15–16): wind + dust + pennant, HUD + gravity toggle.
- **M6 — Landmarks & audio** (Tasks 17–18): rover + fact card + lander, sound.
- **M7 — Cold-visitor UX** (Tasks 19–21): loading/fallback, controls hint, snapshot, reduced-motion.
- **M8 — Meshy Luna & rocks** (Task 22): swap placeholders for generated models.
- **M9 — Ship** (Task 23): mirror + pre-share checklist.

Commit after every task. Prefix commits `feat(mars):` / `test(mars):` / `chore(mars):` and end each message with the `Claude-Session:` trailer.

---

## Task 1: `/mars` route mount (no profile, no router)

**Files:**
- Modify: `packages/space/src/App.jsx` (top of the `App` component, before the profile gate at ~`:40`)
- Create: `packages/space/src/mars/MarsRoute.jsx`

- [ ] **Step 1: Create a trivial MarsRoute placeholder**

```jsx
// packages/space/src/mars/MarsRoute.jsx
// Fullscreen entry for the standalone "walk on Mars" POC. Mounted by a pathname
// check in App.jsx — no profile gate, no router (see spec §3.1).
export default function MarsRoute() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
                  background: '#0b0602', color: '#e8c9a0', fontFamily: 'system-ui' }}>
      <p data-testid="mars-placeholder">Mars surface — coming online…</p>
    </div>
  );
}
```

- [ ] **Step 2: Branch to it at the very top of `App()` in `App.jsx` — and LAZY-load it (M2)**

The whole Mars route (and everything it pulls in: R3F, drei, Rapier WASM, Mars UI) must stay out of the normal Space Quest main bundle. So `App.jsx` imports it via `React.lazy`, not statically:

```jsx
import { lazy, Suspense } from 'react';
const MarsRoute = lazy(() => import('./mars/MarsRoute.jsx'));
// ...
export default function App() {
  // Standalone Mars POC — cold-open link, bypasses the profile gate entirely.
  // Lazy so none of the 3D stack touches the main Space Quest bundle.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/mars')) {
    return (
      <Suspense fallback={null}>
        <MarsRoute />
      </Suspense>
    );
  }
  // ...existing App body unchanged...
}
```

> Note: the early `return` must precede the existing `useState`/`useEffect` calls. Because it is a stable, synchronous branch on `window.location.pathname` (never toggles within a session), it does not violate the rules-of-hooks — the component renders one consistent path for the life of the page. Keep it the first statement.
> **Bundle-hygiene rule for reviewers:** nothing imported by `App.jsx` at module top-level may pull in `three`/`@react-three/*`. Verify with the Task 2 build check that Mars is its own chunk.

- [ ] **Step 3: Run the app and verify the route renders**

Run: `cd platform/apps/space-quest && npm run dev`
Open: `http://localhost:5173/mars`
Expected: the "Mars surface — coming online…" placeholder fills the screen; `http://localhost:5173/` still shows the normal Space Quest home.

- [ ] **Step 4: Commit**

```bash
git add packages/space/src/mars/MarsRoute.jsx packages/space/src/App.jsx
git commit -m "feat(mars): mount /mars fullscreen route, no profile gate"
```

---

## Task 2: Add Rapier dependency (pinned) + R3F canvas stub — CROSS-REPO

**Files:**
- **Sibling `platform` repo:** Modify `/Users/pavel/dev/discoveryquest/platform/apps/space-quest/package.json` (+ lockfile)
- **`discovery-quest` repo:** Modify `packages/space/package.json` (peer decl), `packages/space/src/mars/MarsRoute.jsx`; Create `packages/space/src/mars/MarsSurface.jsx`

- [ ] **Step 1: Install Rapier v1 in the sibling app (matches fiber v8 / React 18)**

Run: `cd /Users/pavel/dev/discoveryquest/platform/apps/space-quest && npm install @react-three/rapier@^1`
Verify the resolved version is 1.x (v2 would signal a React-19 mismatch):
Run: `npm ls @react-three/rapier` → Expected: `@react-three/rapier@1.x.x` (NOT 2.x).

- [ ] **Step 2: Declare Rapier at the package boundary (M3)** — `@discoveryquest/space` now *imports* Rapier, so add it to `packages/space/package.json` `peerDependencies` (optional so 2D-only shells don't break):

```json
"peerDependencies": {
  "react": "*", "framer-motion": "*", "lucide-react": "*",
  "three": "*", "@react-three/fiber": "*", "@react-three/drei": "*",
  "@react-three/rapier": "^1"
},
"peerDependenciesMeta": { "@react-three/rapier": { "optional": true } }
```

- [ ] **Step 3: Create a MarsSurface stub that imports Rapier** — set `preserveDrawingBuffer` now so the Task 21 snapshot works without re-touching Canvas creation (M7):

```jsx
// packages/space/src/mars/MarsSurface.jsx
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

// Root 3D scene. gl.preserveDrawingBuffer is required for the snapshot feature
// (Task 21). gravity is per-world/toggle later; -3.72 = Mars for now.
export default function MarsSurface() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 4], fov: 70 }}
      gl={{ preserveDrawingBuffer: true }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} />
      <Physics gravity={[0, -3.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#c1440e" />
        </mesh>
      </Physics>
    </Canvas>
  );
}
```

- [ ] **Step 4: Lazy-load MarsSurface from MarsRoute** (a second lazy boundary inside the already-lazy route is fine — it splits the Canvas from the loading UI):

```jsx
// packages/space/src/mars/MarsRoute.jsx
import { Suspense, lazy } from 'react';
const MarsSurface = lazy(() => import('./MarsSurface.jsx'));

export default function MarsRoute() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0602', touchAction: 'none' }}>
      <Suspense fallback={<div data-testid="mars-loading" style={{ color: '#e8c9a0' }}>Loading Mars…</div>}>
        <MarsSurface />
      </Suspense>
    </div>
  );
}
```

> `touchAction: 'none'` on the fullscreen root prevents mobile-Safari page-scroll fighting the look-drag (R7).

- [ ] **Step 5: Verify a red cube renders at `/mars`**

Run: `cd /Users/pavel/dev/discoveryquest/platform/apps/space-quest && npm run dev` → open `http://localhost:5173/mars`
Expected: a lit red/orange cube on a dark background; no console errors about Rapier/WASM.

- [ ] **Step 6: Build check (R4) — confirm Mars is a separate lazy chunk**

Run: `cd /Users/pavel/dev/discoveryquest/platform/apps/space-quest && npm run build`
Expected: build succeeds; output shows a **separate chunk** for the Mars route (Rapier/three not in the main/index chunk).

- [ ] **Step 7: Commit — TWO commits (cross-repo, M1)**

```bash
# platform repo (app dependency + lockfile)
git -C /Users/pavel/dev/discoveryquest/platform add apps/space-quest/package.json apps/space-quest/package-lock.json
git -C /Users/pavel/dev/discoveryquest/platform commit -m "feat(mars): add @react-three/rapier@1 to space-quest app [task 2]"
# discovery-quest repo (package peer decl + module stubs)
git add packages/space/package.json packages/space/src/mars/MarsSurface.jsx packages/space/src/mars/MarsRoute.jsx
git commit -m "feat(mars): R3F canvas stub + Rapier optional peer [task 2]"
```

---

## Task 3: WorldConfig runtime validator (TDD)

**Files:**
- Create: `packages/space/src/mars/world/worldConfig.js`
- Test: `packages/space/src/mars/world/worldConfig.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// worldConfig.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWorldConfig } from './worldConfig.js';

const valid = {
  id: 'mars', name: 'Mars',
  gravity: 3.72, earthGravity: 9.81,
  temperatureC: -60,
  sky: { top: '#d7a06a', horizon: '#e8c9a0', sunColor: '#fff3e0' },
  wind: { seed: 7, baseSpeed: 4, gustSpeed: 14 },
  assets: { panorama: '/mars/panorama.jpg', ground: '/mars/regolith.jpg', rover: '/mars/perseverance.glb' },
  ambientTrack: 'mars-wind',
};

test('accepts a complete config', () => {
  assert.deepEqual(validateWorldConfig(valid), { ok: true, errors: [] });
});

test('flags a missing gravity', () => {
  const bad = { ...valid }; delete bad.gravity;
  const res = validateWorldConfig(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('gravity')));
});

test('flags a non-numeric temperature', () => {
  const res = validateWorldConfig({ ...valid, temperatureC: 'cold' });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('temperatureC')));
});

test('flags missing asset urls', () => {
  const res = validateWorldConfig({ ...valid, assets: { panorama: '/x' } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('assets.ground')));
  assert.ok(res.errors.some((e) => e.includes('assets.rover')));
});

// R1: range / logic checks — this validator is the safety rail for Moon later.
test('flags gravity >= earthGravity (should be a fraction of Earth)', () => {
  const res = validateWorldConfig({ ...valid, gravity: 12 });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('gravity')));
});
test('flags implausible temperature', () => {
  assert.equal(validateWorldConfig({ ...valid, temperatureC: -999 }).ok, false);
});
test('flags gustSpeed < baseSpeed', () => {
  const res = validateWorldConfig({ ...valid, wind: { seed: 1, baseSpeed: 10, gustSpeed: 2 } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('wind.gustSpeed')));
});
test('flags a non-same-origin asset path', () => {
  const res = validateWorldConfig({ ...valid, assets: { ...valid.assets, ground: 'https://evil/x.jpg' } });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('assets.ground')));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/space && node --test src/mars/world/worldConfig.test.mjs`
Expected: FAIL — `validateWorldConfig` is not exported.

- [ ] **Step 3: Implement the validator**

```js
// worldConfig.js
/**
 * @typedef {Object} WorldConfig
 * @property {string} id @property {string} name
 * @property {number} gravity  m/s^2 (Mars 3.72) @property {number} earthGravity  9.81
 * @property {number} temperatureC
 * @property {{top:string,horizon:string,sunColor:string}} sky
 * @property {{seed:number,baseSpeed:number,gustSpeed:number}} wind
 * @property {{panorama:string,ground:string,rover:string}} assets
 * @property {string} ambientTrack
 */
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const str = (v) => typeof v === 'string' && v.length > 0;
// Same-origin public asset path (leading '/'), not an off-origin URL.
const asset = (v) => str(v) && v.startsWith('/');

/** Runtime validate a WorldConfig. Returns { ok, errors[] }. This is the guard
 *  that makes "Moon is just another config" safe — types AND ranges/logic (R1). */
export function validateWorldConfig(cfg) {
  const errors = [];
  const need = (cond, path) => { if (!cond) errors.push(`invalid or missing: ${path}`); };
  need(cfg && typeof cfg === 'object', 'config');
  if (!cfg) return { ok: false, errors };
  need(str(cfg.id), 'id'); need(str(cfg.name), 'name');
  // gravity must be a positive fraction of Earth's
  need(num(cfg.earthGravity) && cfg.earthGravity > 0, 'earthGravity');
  need(num(cfg.gravity) && cfg.gravity > 0 && cfg.gravity < cfg.earthGravity, 'gravity');
  need(num(cfg.temperatureC) && cfg.temperatureC > -200 && cfg.temperatureC < 100, 'temperatureC');
  need(cfg.sky && str(cfg.sky.top), 'sky.top');
  need(cfg.sky && str(cfg.sky.horizon), 'sky.horizon');
  need(cfg.sky && str(cfg.sky.sunColor), 'sky.sunColor');
  need(cfg.wind && num(cfg.wind.seed), 'wind.seed');
  need(cfg.wind && num(cfg.wind.baseSpeed) && cfg.wind.baseSpeed >= 0, 'wind.baseSpeed');
  need(cfg.wind && num(cfg.wind.gustSpeed) && cfg.wind.gustSpeed >= cfg.wind.baseSpeed, 'wind.gustSpeed');
  need(cfg.assets && asset(cfg.assets.panorama), 'assets.panorama');
  need(cfg.assets && asset(cfg.assets.ground), 'assets.ground');
  need(cfg.assets && asset(cfg.assets.rover), 'assets.rover');
  // optional assets, but if present must be same-origin paths
  if (cfg.assets && cfg.assets.lander !== undefined) need(asset(cfg.assets.lander), 'assets.lander');
  need(str(cfg.ambientTrack), 'ambientTrack');
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd packages/space && node --test src/mars/world/worldConfig.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/space/src/mars/world/worldConfig.js packages/space/src/mars/world/worldConfig.test.mjs
git commit -m "feat(mars): runtime WorldConfig validator (TDD)"
```

---

## Task 4: The Mars config instance (TDD against the validator)

**Files:**
- Create: `packages/space/src/mars/world/marsConfig.js`
- Test: `packages/space/src/mars/world/marsConfig.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// marsConfig.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marsConfig } from './marsConfig.js';
import { validateWorldConfig } from './worldConfig.js';

test('marsConfig is a valid WorldConfig', () => {
  assert.deepEqual(validateWorldConfig(marsConfig), { ok: true, errors: [] });
});
test('mars gravity is ~0.38 g', () => {
  assert.ok(Math.abs(marsConfig.gravity / marsConfig.earthGravity - 0.38) < 0.01);
});
```

- [ ] **Step 2: Run to verify it fails** — `node --test src/mars/world/marsConfig.test.mjs` → FAIL (no module).

- [ ] **Step 3: Implement `marsConfig`** (asset paths point at `/mars/…`, filled by Task 6):

```js
// marsConfig.js
export const marsConfig = {
  id: 'mars', name: 'Mars',
  gravity: 3.72, earthGravity: 9.81,
  temperatureC: -60,
  sky: { top: '#b5651d', horizon: '#e9c39a', sunColor: '#fff4e6' },
  wind: { seed: 42, baseSpeed: 3, gustSpeed: 12 },
  assets: {
    panorama: '/mars/panorama.jpg',
    ground: '/mars/regolith.jpg',
    rover: '/mars/perseverance.glb',
    lander: '/mars/lander.glb',
  },
  ambientTrack: 'mars-wind',
};
```

- [ ] **Step 4: Run to verify it passes.** — Expected: PASS (2 tests).

- [ ] **Step 5: Commit** — `feat(mars): Mars WorldConfig instance`.

---

## Task 5: Procedural terrain

**Files:**
- Create: `packages/space/src/mars/scene/Terrain.jsx`
- Modify: `packages/space/src/mars/MarsSurface.jsx`

**M5 decision — the collider must MATCH the visible geometry.** A displaced mesh over a flat cuboid collider causes foot sliding/floating and breaks grounded checks in a first-person walker. Use a **`trimesh` auto-collider generated from the exact displaced geometry** (Rapier supports this for `fixed` bodies). All imports are top-level ESM (M4) — no `require()`.

```jsx
// Terrain.jsx
import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Bounded, gently undulating regolith patch. The SAME geometry drives the
// visible mesh AND a trimesh collider, so the player walks exactly on what they
// see (no sliding/floating — M5). Deterministic displacement keeps it stable.
function makeGeometry(size, segments) {
  const g = new THREE.PlaneGeometry(size, size, segments, segments);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.8
            + Math.sin(x * 0.13 + 1.7) * 0.3;
    pos.setY(i, h);
  }
  g.computeVertexNormals();
  return g;
}

export default function Terrain({ size = 200, groundTexture }) {
  // Keep collider segment count modest (trimesh cost); visual can match for POC.
  const geometry = useMemo(() => makeGeometry(size, 96), [size]);
  const tex = useTexture(groundTexture); // regolith; supplied in Task 6
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(size / 8, size / 8);

  return (
    // Auto-generate a trimesh collider from the child mesh geometry.
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
    </RigidBody>
  );
}
```

- [ ] **Step 1: Implement Terrain** as above (top-level imports; trimesh collider from the displaced geometry).
- [ ] **Step 2: Mount Terrain in MarsSurface** (replace the red cube), passing `marsConfig.assets.ground`.
- [ ] **Step 3: Verify** at `/mars`: a reddish undulating, textured ground fills the lower view with a horizon line. **Walk-grounding is verified later in Task 9** — here just confirm it renders with no console errors.
- [ ] **Step 4: Commit** — `feat(mars): procedural regolith terrain + matching trimesh collider [task 5]`.

> If the trimesh collider proves too heavy on mobile in the Task 9 grounding check, the fallback is a Rapier **heightfield collider** built from the same height function (cheaper, still matches). Do not fall back to a flat cuboid.

---

## Task 6: Download NASA assets

**Files (CROSS-REPO, M1):**
- **Sibling `platform` repo:** `/Users/pavel/dev/discoveryquest/platform/apps/space-quest/public/mars/` (panorama.jpg, regolith.jpg, perseverance.glb, lander.glb) — committed in the `platform` repo.
- **`discovery-quest` repo:** `scripts/fetch-mars-assets.mjs` (records exact source URLs + output paths so the fetch is reproducible). The script *writes into* the sibling platform public dir; the fetched binaries are a separate `platform`-repo commit.

**Asset perf targets to record in the fetch script (R8):**
- Panorama ≤ 4k wide, JPG reasonably compressed; note final px + file size (KTX2/Basis is a fast-follow if VRAM is high).
- GLBs: apply Draco/meshopt where supported; verify the rover's real-world scale + pivot once on import.
- Note the dust particle-count cap chosen for mid-range Android.

- [ ] **Step 1: Resolve and download the NASA Perseverance glb** from the pinned source (spec §6): NASA Science 3D Resources "Mars 2020 Perseverance Rover" (`science.nasa.gov/3d-resources/mars-2020-perseverance-rover/`, embed id 25042). Fetch the `.glb` into `public/mars/perseverance.glb`. Verify: `ls -la` shows a multi-MB file; open it once in a glTF viewer or load in a throwaway `<primitive>` to confirm it parses.
- [ ] **Step 2: Download the Mastcam-Z 360° panorama** (`mars.nasa.gov/resources/25640/`, hi-res `25674`) as an equirectangular JPG → `public/mars/panorama.jpg`. **Downsize to ≤4k wide** and note the final resolution in `fetch-mars-assets.mjs` (VRAM lever, spec §6).
- [ ] **Step 3: Crop a regolith tile** from rover raw imagery → `public/mars/regolith.jpg` (seamless-ish, ~1k).
- [ ] **Step 4: Record every source URL + license note (NASA public domain) in `scripts/fetch-mars-assets.mjs`** so a re-fetch is a one-command reproducible step (URLs move over time — spec §6).
- [ ] **Step 5: Confirm files are not swallowed by ignore patterns** — `git -C /Users/pavel/dev/discoveryquest/platform check-ignore -v apps/space-quest/public/mars/perseverance.glb` should print **nothing** (not ignored). If ignored, add a negation and re-verify.
- [ ] **Step 6: Commit — TWO commits (M1):** the `fetch-mars-assets.mjs` script in `discovery-quest` (`git add scripts/fetch-mars-assets.mjs`), and the vendored binaries in `platform` (`git -C /Users/pavel/dev/discoveryquest/platform add apps/space-quest/public/mars && git -C ... commit -m "chore(mars): vendor NASA panorama, regolith, Perseverance glb (public domain) [task 6]"`).

---

## Task 7: SkyDome (NASA panorama)

**Files:** Create `packages/space/src/mars/scene/SkyDome.jsx`; modify `MarsSurface.jsx`.

- [ ] **Step 1: Implement SkyDome** — a large back-side sphere textured with the equirectangular panorama, plus a subtle sky tint gradient from `marsConfig.sky` and a small sun sprite/directional light aligned to the panorama's bright spot. Use drei `useTexture`.

```jsx
// SkyDome.jsx
import { useTexture } from '@react-three/drei';
import { BackSide } from 'three';
export default function SkyDome({ panorama }) {
  const tex = useTexture(panorama);
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={tex} side={BackSide} fog={false} />
    </mesh>
  );
}
```

- [ ] **Step 2: Mount SkyDome + scene fog** in MarsSurface tuned to the panorama palette so near-terrain blends into the horizon (spec §11.3).
- [ ] **Step 3: Verify:** standing on the terrain, the horizon shows the real Martian panorama; fog hides the terrain edge seam; sky reads as Mars. Screenshot for the record.
- [ ] **Step 4: Commit** — `feat(mars): NASA panorama skybox + Mars sky/fog`.

---

## Task 8: Gravity/jump math (TDD)

**Files:** Create `packages/space/src/mars/physics/gravity.js`; test `gravity.test.mjs`.

- [ ] **Step 1: Write the failing test**

```js
// gravity.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apexHeight, hangTime, GRAVITY } from './gravity.js';

test('same jump impulse goes higher on Mars than Earth', () => {
  const v0 = 5; // m/s upward
  assert.ok(apexHeight(v0, GRAVITY.mars) > apexHeight(v0, GRAVITY.earth));
});
test('apex height = v0^2 / (2g)', () => {
  assert.ok(Math.abs(apexHeight(5, 9.81) - (25 / (2 * 9.81))) < 1e-9);
});
test('mars hang time is ~2.6x earth', () => {
  const r = hangTime(5, GRAVITY.mars) / hangTime(5, GRAVITY.earth);
  assert.ok(Math.abs(r - 9.81 / 3.72) < 1e-6);
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**

```js
// gravity.js
export const GRAVITY = { mars: 3.72, earth: 9.81 };
export const apexHeight = (v0, g) => (v0 * v0) / (2 * g);   // metres
export const hangTime = (v0, g) => (2 * v0) / g;            // seconds up+down
```

- [ ] **Step 4: Run → PASS (3 tests).**
- [ ] **Step 5: Commit** — `feat(mars): gravity/jump math (TDD)`.

---

## Task 9: PlayerController (walk + jump)

**Files:** Create `packages/space/src/mars/player/PlayerController.jsx`, `packages/space/src/mars/store/marsStore.js`; modify `MarsSurface.jsx`.

- [ ] **Step 1: Implement `inputStore` (R6) and `marsStore`** — `inputStore` is the single source of movement intent (`{ forward, right, jump, look }`) written by keyboard/mouse now and by touch `Controls` in Task 20; every controller *reads* it so no two components attach competing listeners. `marsStore` (minimal `useSyncExternalStore`, no new dependency) holds `{ view:'first'|'third', gravityMode:'mars'|'earth', wind:0 }` with setters.
- [ ] **Step 2: Implement PlayerController** — a rapier capsule `RigidBody` (locked rotations) at spawn near the lander. Reads movement intent from `inputStore`. Applies horizontal velocity; on jump input, if grounded (short downward raycast), sets upward velocity to a **single shared constant `JUMP_V0`** (R3). **Do NOT scale `JUMP_V0` by gravity mode** — the whole point of the toggle is that the *same* impulse behaves differently under different gravity; scaling per-mode would erase the lesson. Physics `<World gravity>` is driven by `gravityMode` (Task 16). Expose player world-position via a ref for camera + interaction.
- [ ] **Step 3: Verify** at `/mars`: WASD moves across the terrain; Space produces a floaty jump with visibly long hang time; you cannot fall through the ground.
- [ ] **Step 4: Commit** — `feat(mars): rapier player capsule with Mars-gravity movement + jump`.

---

## Task 10: Camera + view toggle

**Files:** Create `packages/space/src/mars/player/CameraController.jsx`, `player/Luna.jsx`, `player/Hands.jsx`.

- [ ] **Step 1: Luna placeholder** — a simple capsule + helmet-sphere in white/orange (real Meshy model swapped in Task 22, behind this same component).
- [ ] **Step 2: Hands placeholder** — a centered reticle dot (real gloves later, N4).
- [ ] **Step 3: CameraController** — first-person: camera follows the player capsule at eye height with pointer-lock mouse-look (desktop) and `Esc` to release (R4). Third-person: orbit behind Luna. Toggle via `marsStore.view` (`V` key + HUD button in Task 15). Hide `Luna` mesh in first-person, show in third.
- [ ] **Step 4: Verify** both views: FP look-around with pointer lock, `Esc` frees the cursor; `V` swaps to third-person showing Luna walking/idle.
- [ ] **Step 5: Commit** — `feat(mars): first/third-person camera with view toggle + Luna placeholder`.

---

## Task 11: Interaction selection (TDD)

**Files:** Create `packages/space/src/mars/interact/selection.js`; test `selection.test.mjs`.

- [ ] **Step 1: Write the failing test**

```js
// selection.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNearestInRange } from './selection.js';

const P = { x: 0, y: 0, z: 0 };
const rocks = [
  { id: 'a', pos: { x: 3, y: 0, z: 0 } },
  { id: 'b', pos: { x: 1, y: 0, z: 0 } },
  { id: 'c', pos: { x: 10, y: 0, z: 0 } },
];
test('returns nearest within range', () => {
  assert.equal(pickNearestInRange(P, rocks, 2.5), 'b');
});
test('returns null when none in range', () => {
  assert.equal(pickNearestInRange(P, rocks, 0.5), null);
});
test('ignores a held rock (pos null)', () => {
  const r = [{ id: 'b', pos: null }, { id: 'a', pos: { x: 3, y: 0, z: 0 } }];
  assert.equal(pickNearestInRange(P, r, 5), 'a');
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**

```js
// selection.js
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
/** id of the nearest rock whose center is within maxDist of player, else null. */
export function pickNearestInRange(player, rocks, maxDist) {
  const max2 = maxDist * maxDist;
  let best = null, bestD = Infinity;
  for (const r of rocks) {
    if (!r.pos) continue;
    const dd = d2(player, r.pos);
    if (dd <= max2 && dd < bestD) { bestD = dd; best = r.id; }
  }
  return best;
}
```

- [ ] **Step 4: Run → PASS (3 tests).**
- [ ] **Step 5: Commit** — `feat(mars): nearest-rock selection (TDD)`.

---

## Task 12: Rock + pick-up + throw

**Files:** Create `packages/space/src/mars/interact/Rock.jsx`, `interact/InteractionController.jsx`.

- [ ] **Step 1: Rock** — a rapier dynamic `RigidBody` (small icosahedron placeholder mesh; Meshy rock in Task 22). Hover/near highlight (emissive) when it is the selected id.
- [ ] **Step 2: InteractionController** — each frame, gather rock positions, call `pickNearestInRange(playerPos, rocks, PICKUP_DIST)`, show a "pick up" prompt; on pick-up input, attach the rock to the hand (kinematic/pos = null in the position list); on release/throw input, re-enable dynamics and apply an impulse along camera-forward. The impulse + Mars gravity produce the slow arc (the money shot).
- [ ] **Step 3: Verify:** walk to a rock, prompt appears, pick it up, throw it — it arcs slowly and lands; in third-person Luna's throw reads clearly.
- [ ] **Step 4: Commit** — `feat(mars): pick up and throw rocks in low gravity`.

---

## Task 13: Rock field + reset/auto-respawn (R1)

**Files:** Create `packages/space/src/mars/interact/RockField.jsx`.

- [ ] **Step 1:** Spawn N rocks (incl. one "interesting" mineral) at scattered spawn points near the lander. Track each rock's distance from the play area; if a rock has been beyond `RECALL_DIST` for `> RECALL_SECS`, respawn it. **Respawn safely (R5):** place it a short distance *in front of* the player at a small height (e.g. 1.5 m ahead, 1 m up), and **zero its linear + angular velocity** before re-enabling dynamics — never at the player's exact feet (a recalled dynamic body there can collide with / launch the capsule).
- [ ] **Step 2: Verify:** throw all rocks far away; within a few seconds a fresh rock appears near Luna. A "reset rocks" HUD button (added in Task 15) also respawns them.
- [ ] **Step 3: Commit** — `feat(mars): rock field with auto-respawn (R1)`.

---

## Task 14: Wind gust profile (TDD)

**Files:** Create `packages/space/src/mars/fx/wind.js`; test `wind.test.mjs`.

- [ ] **Step 1: Write the failing test**

```js
// wind.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gustAt } from './wind.js';

test('gust is bounded [0,1]', () => {
  for (let t = 0; t < 50; t += 0.37) {
    const g = gustAt(42, t);
    assert.ok(g >= 0 && g <= 1, `out of range at ${t}: ${g}`);
  }
});
test('deterministic for a given seed+t', () => {
  assert.equal(gustAt(7, 3.5), gustAt(7, 3.5));
});
test('different seeds differ somewhere', () => {
  const a = Array.from({ length: 20 }, (_, i) => gustAt(1, i));
  const b = Array.from({ length: 20 }, (_, i) => gustAt(2, i));
  assert.notDeepEqual(a, b);
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** a smooth, seeded, bounded gust (sum of sines with seed-derived phases, normalised to [0,1]).

```js
// wind.js
const frac = (x) => x - Math.floor(x);
/** Deterministic gust intensity in [0,1] for a seed and time (seconds). */
export function gustAt(seed, t) {
  const p1 = frac(Math.sin(seed * 12.9898) * 43758.5453) * Math.PI * 2;
  const p2 = frac(Math.sin(seed * 78.233) * 12345.6789) * Math.PI * 2;
  const v = 0.5 * Math.sin(t * 0.6 + p1) + 0.3 * Math.sin(t * 1.7 + p2) + 0.2 * Math.sin(t * 0.23);
  return (v + 1) / 2; // -> [0,1]
}
```

- [ ] **Step 4: Run → PASS (3 tests).**
- [ ] **Step 5: Commit** — `feat(mars): deterministic wind gust profile (TDD)`.

---

## Task 15: Wind visuals — dust + pennant + WindProvider

**Files:** Create `packages/space/src/mars/fx/WindProvider.jsx`, `fx/DustParticles.jsx`, `scene/Pennant.jsx`.

- [ ] **Step 1: WindProvider** — a context that computes `gustAt(marsConfig.wind.seed, clock)` each frame and exposes `{ speed, dir }`; also writes `wind` into `marsStore` for the HUD.
- [ ] **Step 2: DustParticles** — a `Points` field drifting along wind dir at a speed scaled by gust; extra bursts on footstep/landing/rock-impact (subscribe to events from PlayerController/InteractionController). Respect reduced motion (Task 21).
- [ ] **Step 3: Pennant** — a small flag on the lander whose vertices sway by gust amount (cheap vertex displacement). Doubles as the visible wind indicator.
- [ ] **Step 4: Verify:** dust visibly drifts and thickens on gusts; the pennant ripples in time with it.
- [ ] **Step 5: Commit** — `feat(mars): wind-driven dust + swaying pennant`.

---

## Task 16: HUD + gravity toggle + temperature

**Files:** Create `packages/space/src/mars/ui/Hud.jsx`; modify `MarsSurface.jsx` physics `<World gravity>` to read `marsStore.gravityMode`.

- [ ] **Step 1: Hud** — an overlay (outside the Canvas) with suit gauges: **gravity** (Mars 0.38 g), **temperature** (−60 °C, cool-tinted), **wind** (from `marsStore.wind`); plus buttons: **view toggle**, **Mars⇄Earth gravity toggle**, **reset rocks**. Temperature is visual only (spec §8) — add faint visor-frost overlay + cool color grade.
- [ ] **Step 2:** Wire the gravity toggle so the physics world gravity vector switches between `-3.72` and `-9.81` live; jumping/throwing under each makes the difference *felt* (the viral moment).
- [ ] **Step 3: Verify:** toggle gravity, jump — Earth feels heavy/quick, Mars floaty; gauges update; temperature/frost reads correctly.
- [ ] **Step 4: Commit** — `feat(mars): suit HUD + live Mars⇄Earth gravity toggle + temperature`.

---

## Task 17: Rover + fact card + lander

**Files:** Create `packages/space/src/mars/scene/Rover.jsx`, `scene/Lander.jsx`, `ui/FactCard.jsx`.

- [ ] **Step 1: Lander** — load a glb (Meshy or NASA) as the spawn anchor; place player + rocks beside it.
- [ ] **Step 2: Rover** — load the NASA Perseverance glb as a **static (fixed) collider** so thrown rocks bounce off it (spec §6, R8). On proximity, trigger a `FactCard`.
- [ ] **Step 3: FactCard** — a Luna-brand popup ("You found Perseverance — a real robot exploring Mars right now!" + the blue-sunset fact). Dismissible.
- [ ] **Step 4: Verify:** walk to the rover → fact card; throw a rock at it → bounces, rover unmoved.
- [ ] **Step 5: Commit** — `feat(mars): Perseverance rover (static) + lander + fact cards`.

---

## Task 18: Sound — ambient bed + SFX

**Files:** Create `packages/space/src/mars/audio/marsSound.js`; add audio files to `platform/apps/space-quest/public/`.

**M6 decision — voice-kit music has NO public volume/gain setter** (only `playMusic/pauseMusic/resumeMusic/stopMusic/setMusicEnabled/isMusicOn`). So do **not** try to modulate its volume. Approach: `playMusic('mars-wind')` provides a **constant** bed for autoplay/ducking consistency with the rest of the app; the **gust swell is a separate WebAudio graph owned by `marsSound.js`** (its own `<audio>`/buffer → `GainNode` whose `gain.value` tracks `marsStore.wind`). This keeps the shared voice-kit package untouched. (Alternative if you'd rather centralize: add `setMusicIntensity(x)` to voice-kit and test on iOS/desktop — heavier, needs a shared-package change; not the default.)

- [ ] **Step 1:** Generate/obtain a looping Mars wind bed → sibling `platform/apps/space-quest/public/music/mars-wind.mp3`; and SFX (footstep crunch, rock clink, impact puff) → `platform/apps/space-quest/public/mars/sfx/*.mp3`. (These are a **`platform`-repo commit**, M1.)
- [ ] **Step 2: marsSound** — on entry (first user gesture, autoplay-safe) `playMusic('mars-wind')` as the constant bed; separately load a wind-gust loop into an owned WebAudio `GainNode` and set `gain.value` from `marsStore.wind` each frame. Play positional SFX via three `PositionalAudio` on footstep/pickup/impact events.
- [ ] **Step 3: Lifecycle cleanup (R9)** — on MarsRoute unmount (and guard against hot-reload duplicates) call `stopMusic()`, stop/disconnect the gust gain graph, and remove SFX listeners so ambient audio never leaks after leaving `/mars`.
- [ ] **Step 4: Verify:** ambient wind swells with gusts; footsteps/clink/impact fire. **Confirm every mp3 loads** (Network tab 200s) — silence-on-missing is a trap (spec N2). Navigate away/reload → audio stops.
- [ ] **Step 5: Commit** — `feat(mars): constant wind bed + gain-modulated gust + positional SFX [task 18]` (+ separate platform-repo commit for the audio files).

---

## Task 19: Loading screen + WebGL fallback (R3)

**Files:** Create `packages/space/src/mars/ui/LoadingScreen.jsx`; modify `MarsRoute.jsx`.

- [ ] **Step 1:** Replace the bare Suspense fallback with a branded LoadingScreen (progress via drei `useProgress`, a Luna line, a fact card). Detect WebGL availability; if missing/old device, render a graceful "your device can't walk on Mars yet" card instead of the Canvas.
- [ ] **Step 2: Verify:** hard-reload shows the loading screen until assets are ready; simulate no-WebGL (disable in devtools) → fallback card.
- [ ] **Step 3: Commit** — `feat(mars): branded loading screen + WebGL fallback (R3)`.

---

## Task 20: Mobile controls + first-touch hint + orientation (R5, N3)

**Files:** Create `packages/space/src/mars/ui/Controls.jsx`, `ui/ControlsHint.jsx`; wire touch input into PlayerController + CameraController.

- [ ] **Step 1: Controls** — a left virtual joystick (move), right-half drag (look), on-screen Jump button; feed these into the same input path as keyboard. Detect touch to show/hide.
- [ ] **Step 2: ControlsHint** — a first-touch overlay ("drag to look · tap the glowing rock · hit jump") that fades after first use. Portrait → prompt to rotate to landscape (N3).
- [ ] **Step 3: Verify on a real phone** (Vite `host: true`, open the Network URL): joystick walks, drag looks, jump works, tap picks up + throws; hint appears once then fades.
- [ ] **Step 4: Commit** — `feat(mars): mobile touch controls + first-touch hint + orientation prompt`.

---

## Task 21: Reduced motion + Snapshot (R4, R2)

**Files:** Create `packages/space/src/mars/ui/Snapshot.jsx`; use `usePrefersReducedMotion()` in DustParticles/CameraController.

- [ ] **Step 1: Reduced motion** — when `usePrefersReducedMotion()` is true, dampen camera bob/screen dust/shake (keep the world). Confirm `Esc` exits pointer lock.
- [ ] **Step 2: Snapshot** — a HUD camera button that renders the Canvas to a PNG via `gl.domElement.toDataURL('image/png')` (Canvas already has `preserveDrawingBuffer: true` from Task 2 — M7), draws a subtle `discoveryquest.app/mars` watermark, then triggers download/share. **All Mars assets are served same-origin from `/mars/...`, so the canvas is not tainted** — verify the exported PNG is not blank/black. If `preserveDrawingBuffer` measurably hurts the §1 mobile fps target, gate it behind a "snapshot enabled" flag or use an offscreen render pass instead.
- [ ] **Step 3: Verify:** OS reduce-motion dampens effects; snapshot button saves a watermarked PNG of the current view.
- [ ] **Step 4: Commit** — `feat(mars): reduced-motion support + one-tap watermarked snapshot`.

---

## Task 22: Meshy — rigged Luna + rocks

**Files:** Add glbs to `platform/apps/space-quest/public/mars/`; swap models inside `Luna.jsx` / `Hands.jsx` / `Rock.jsx` (component APIs unchanged).

- [ ] **Step 1: Sanity-check Meshy auth** — call `meshy_check_balance`. Confirm credits/plan before generating.
- [ ] **Step 2: Generate Luna** — `meshy_text_to_3d` (preview→refine) for "friendly cartoon astronaut in a white-and-orange spacesuit, full body," then `meshy_rig` (humanoid) + `meshy_animate` (idle, walk, jump, throw). `meshy_download_model` → `public/mars/luna.glb`. **Get Pavel's OK on the on-screen look before finalizing** (memory: verify visuals before baking).
- [ ] **Step 3: Generate rocks** — `meshy_text_to_3d` (or `meshy_image_to_3d` from a NASA rock photo) ×3–4 → `public/mars/rocks/*.glb`.
- [ ] **Step 4: Swap models** behind the existing `Luna`/`Hands`/`Rock` components (placeholder → glb). Because the components' props/interfaces are unchanged, nothing else moves.
- [ ] **Step 5: Verify:** third-person Luna animates (idle/walk/jump/throw); rocks look like real Mars rocks; framerate still meets the §1 target.
- [ ] **Step 6: Commit** — `feat(mars): rigged Meshy Luna + rock models`.

---

## Task 23: Ship — mirror + pre-share checklist

**Files:** whatever the packages/space → platform deploy mirror requires (spec §10).

- [ ] **Step 1:** Run the full test suite: `cd packages/space && node --test` → all green.
- [ ] **Step 2:** Build: `cd platform/apps/space-quest && npm run build` → succeeds; confirm the Mars chunk is a **separate lazy chunk** (Rapier WASM not in the main bundle).
- [ ] **Step 3:** Execute the spec §10 pre-share checklist in order: mirror to the deploy repo → confirm `public/mars/**` survives `.dockerignore`/`.gitignore` → deploy to fly `discoveryquest-space` → `curl` every live asset URL (panorama, rover glb, textures, **and every audio file**) for `200` + correct `content-type` → open live `/mars` **on a real phone** and run the full loop (walk → jump → pick up → throw → find rover → snapshot).
- [ ] **Step 4:** Use superpowers:verification-before-completion — do not claim "done" until the live checklist output is captured.
- [ ] **Step 5: Commit / merge** via superpowers:finishing-a-development-branch.

---

## Notes for the Implementer

- **TDD applies to the pure modules** (`worldConfig`, `marsConfig`, `gravity`, `selection`, `wind`) — write the test first, watch it fail, implement, watch it pass. **R3F/visual components are verified by running the app and looking** (screenshots), not by unit tests — that is the correct testing philosophy for a 3D scene (spec §9).
- **Keep files focused** — if any component grows past its one responsibility (e.g. PlayerController accreting camera logic), split it.
- **DRY the world data** — never hardcode gravity/colors/asset paths in components; read them from `marsConfig`. This is what keeps Moon a config away.
- **Commit after every task.** End every commit message with the `Claude-Session:` trailer. **Cross-repo tasks (2, 6, 18, 22, 23) = two commits**, one per repo, same task number (see Repo/Commit Ownership).
- **Recurring build check (R4)** — unit tests won't catch bundler-only failures (R3F imports, Rapier WASM, dynamic-import chunks, GLB paths). After Tasks **2, 7, 12, 19, and 21**, run:
  ```bash
  cd /Users/pavel/dev/discoveryquest/platform/apps/space-quest && npm run build
  ```
  It must succeed, and Mars must remain a **separate lazy chunk**.
- **Meshy does not block the MVP (R10)** — the branch goal is the gravity/throw/shareable Mars loop. If Meshy quality or credits are bad at Task 22, **ship with the placeholder Luna / reticle / placeholder rocks**. Task 22 is polish, not a gate.
- **Pointer lock (R7)** — request it only from a user gesture; `Esc` must visibly return to UI mode. The fullscreen Mars root already sets `touch-action: none` (Task 2) so mobile look-drag doesn't scroll the page.
