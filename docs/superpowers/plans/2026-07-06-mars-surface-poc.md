# Mars Surface POC Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone "walk on Mars" experience at `space.discoveryquest.app/mars` — first-person (with third-person toggle) Luna in a spacesuit, real 0.38 g physics, pick-up-and-throw rocks, NASA panorama/rover, and wind/temperature feedback — built to be posted about.

**Architecture:** A self-contained, lazy-loaded module under `packages/space/src/mars/`. Everything world-specific is data in `marsConfig.js` validated by a runtime `validateWorldConfig()`, so a Moon world is a later config, not a rewrite. Mounted by a `window.location.pathname` check at the top of `App.jsx` (no router, no profile gate). Physics via `@react-three/rapier`. Reuses the package's existing `three` / `@react-three/fiber` / `@react-three/drei` stack and `@discoveryquest/voice-kit` audio engine.

**Tech Stack:** React 18, `@react-three/fiber@8`, `@react-three/drei@9`, `three@0.169`, `@react-three/rapier@^1` (pinned to the fiber-v8 line), `@discoveryquest/voice-kit`, Node's built-in test runner (`node --test`, `*.test.mjs`).

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

## File Structure

All under `packages/space/src/mars/` unless noted. Each file has one responsibility.

```
mars/
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
    Terrain.jsx            # procedural heightmap ground + collider + regolith texture
    SkyDome.jsx            # NASA panorama skybox + Mars sky tint + sun
    Rover.jsx              # NASA Perseverance glb, static collider, proximity fact card
    Lander.jsx             # spawn-anchor prop
    Pennant.jsx            # small flag; vertex sway driven by wind
  audio/
    marsSound.js           # ambient wind bed (voice-kit) + positional SFX helpers
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

# Outside the package:
platform/apps/space-quest/package.json   # add @react-three/rapier@^1
platform/apps/space-quest/public/mars/   # downloaded NASA assets + generated Meshy assets
packages/space/src/App.jsx               # add /mars pathname branch (before profile gate)
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

- [ ] **Step 2: Branch to it at the very top of `App()` in `App.jsx`**

Add immediately inside the `App` function body, before any hooks that read profiles:

```jsx
import MarsRoute from './mars/MarsRoute.jsx';
// ...
export default function App() {
  // Standalone Mars POC — cold-open link, bypasses the profile gate entirely.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/mars')) {
    return <MarsRoute />;
  }
  // ...existing App body unchanged...
}
```

> Note: the early `return` must precede the existing `useState`/`useEffect` calls. Because it is a stable, synchronous branch on `window.location.pathname` (never toggles within a session), it does not violate the rules-of-hooks — the component renders one consistent path for the life of the page. Keep it the first statement.

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

## Task 2: Add Rapier dependency, pinned + lazy-loaded

**Files:**
- Modify: `platform/apps/space-quest/package.json`
- Modify: `packages/space/src/mars/MarsRoute.jsx`
- Create: `packages/space/src/mars/MarsSurface.jsx` (stub)

- [ ] **Step 1: Install Rapier v1 in the app (matches fiber v8 / React 18)**

Run: `cd platform/apps/space-quest && npm install @react-three/rapier@^1`
Then verify the resolved version is 1.x (v2 would signal a React-19 mismatch):
Run: `npm ls @react-three/rapier`
Expected: `@react-three/rapier@1.x.x` (NOT 2.x).

- [ ] **Step 2: Create a MarsSurface stub that imports Rapier**

```jsx
// packages/space/src/mars/MarsSurface.jsx
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

// Root 3D scene. Physics gravity is set per-world later; -3.72 = Mars for now.
export default function MarsSurface() {
  return (
    <Canvas camera={{ position: [0, 1.6, 4], fov: 70 }} style={{ position: 'fixed', inset: 0 }}>
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

- [ ] **Step 3: Lazy-load MarsSurface from MarsRoute (keeps Rapier WASM off the main bundle)**

```jsx
// packages/space/src/mars/MarsRoute.jsx
import { Suspense, lazy } from 'react';
const MarsSurface = lazy(() => import('./MarsSurface.jsx'));

export default function MarsRoute() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0602' }}>
      <Suspense fallback={<div data-testid="mars-loading" style={{ color: '#e8c9a0' }}>Loading Mars…</div>}>
        <MarsSurface />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 4: Verify a red cube renders in the R3F canvas at `/mars`**

Run: `cd platform/apps/space-quest && npm run dev` → open `/mars`
Expected: a lit red/orange cube on a dark background; no console errors about Rapier or WASM.

- [ ] **Step 5: Commit**

```bash
git add platform/apps/space-quest/package.json platform/apps/space-quest/package-lock.json packages/space/src/mars/MarsSurface.jsx packages/space/src/mars/MarsRoute.jsx
git commit -m "feat(mars): add @react-three/rapier@1 (lazy) + R3F canvas stub"
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

/** Runtime validate a WorldConfig. Returns { ok, errors[] }. This is the guard
 *  that makes "Moon is just another config" safe. */
export function validateWorldConfig(cfg) {
  const errors = [];
  const need = (cond, path) => { if (!cond) errors.push(`invalid or missing: ${path}`); };
  need(cfg && typeof cfg === 'object', 'config');
  if (!cfg) return { ok: false, errors };
  need(str(cfg.id), 'id'); need(str(cfg.name), 'name');
  need(num(cfg.gravity), 'gravity'); need(num(cfg.earthGravity), 'earthGravity');
  need(num(cfg.temperatureC), 'temperatureC');
  need(cfg.sky && str(cfg.sky.top), 'sky.top');
  need(cfg.sky && str(cfg.sky.horizon), 'sky.horizon');
  need(cfg.sky && str(cfg.sky.sunColor), 'sky.sunColor');
  need(cfg.wind && num(cfg.wind.seed), 'wind.seed');
  need(cfg.wind && num(cfg.wind.baseSpeed), 'wind.baseSpeed');
  need(cfg.wind && num(cfg.wind.gustSpeed), 'wind.gustSpeed');
  need(cfg.assets && str(cfg.assets.panorama), 'assets.panorama');
  need(cfg.assets && str(cfg.assets.ground), 'assets.ground');
  need(cfg.assets && str(cfg.assets.rover), 'assets.rover');
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

- [ ] **Step 1: Implement Terrain** — a displaced plane with a heightmap-ish noise, a `CuboidCollider`/`HeightfieldCollider` (rapier) matching it, and the regolith texture (falls back to a flat color until Task 6 supplies the file).

```jsx
// Terrain.jsx
import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// A bounded, gently undulating regolith patch. Displacement is deterministic
// value-noise so the collider (a flat cuboid just below the surface) is a fair
// approximation for a POC (kids won't notice sub-metre mismatch on gentle dunes).
export default function Terrain({ size = 200, color = '#9c5a33' }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 128, 128);
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
  }, [size]);

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* Flat collider just under mean surface height */}
      <CuboidGround size={size} />
    </RigidBody>
  );
}

function CuboidGround({ size }) {
  const { CuboidCollider } = require('@react-three/rapier');
  return <CuboidCollider args={[size / 2, 0.5, size / 2]} position={[0, -0.5, 0]} />;
}
```

> If `require` is unavailable in the app's build, import `CuboidCollider` at top instead. Prefer the top-level import; the inline form is only shown to keep the collider colocated.

- [ ] **Step 2: Mount Terrain in MarsSurface** (replace the red cube).
- [ ] **Step 3: Verify** at `/mars`: a reddish undulating ground plane fills the lower view; camera at eye height sees a horizon line. No console errors.
- [ ] **Step 4: Commit** — `feat(mars): procedural regolith terrain + collider`.

---

## Task 6: Download NASA assets

**Files:**
- Create: `platform/apps/space-quest/public/mars/` (panorama.jpg, regolith.jpg, perseverance.glb, lander.glb)
- Create: `scripts/fetch-mars-assets.mjs` (records exact source URLs so the fetch is reproducible)

- [ ] **Step 1: Resolve and download the NASA Perseverance glb** from the pinned source (spec §6): NASA Science 3D Resources "Mars 2020 Perseverance Rover" (`science.nasa.gov/3d-resources/mars-2020-perseverance-rover/`, embed id 25042). Fetch the `.glb` into `public/mars/perseverance.glb`. Verify: `ls -la` shows a multi-MB file; open it once in a glTF viewer or load in a throwaway `<primitive>` to confirm it parses.
- [ ] **Step 2: Download the Mastcam-Z 360° panorama** (`mars.nasa.gov/resources/25640/`, hi-res `25674`) as an equirectangular JPG → `public/mars/panorama.jpg`. **Downsize to ≤4k wide** and note the final resolution in `fetch-mars-assets.mjs` (VRAM lever, spec §6).
- [ ] **Step 3: Crop a regolith tile** from rover raw imagery → `public/mars/regolith.jpg` (seamless-ish, ~1k).
- [ ] **Step 4: Record every source URL + license note (NASA public domain) in `scripts/fetch-mars-assets.mjs`** so a re-fetch is a one-command reproducible step (URLs move over time — spec §6).
- [ ] **Step 5: Confirm files are not swallowed by ignore patterns** — `git check-ignore -v platform/apps/space-quest/public/mars/perseverance.glb` should print **nothing** (not ignored). If ignored, add a negation and re-verify.
- [ ] **Step 6: Commit** — `chore(mars): vendor NASA panorama, regolith, Perseverance glb (public domain)`.

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

- [ ] **Step 1: Implement `marsStore`** — a minimal `useSyncExternalStore` store holding `{ view:'first'|'third', gravityMode:'mars'|'earth', wind:0, sampleCount:0 }` with setters. (No new dependency.)
- [ ] **Step 2: Implement PlayerController** — a rapier capsule `RigidBody` (locked rotations) at spawn near the lander. Reads input (WASD/arrows now; touch joystick wired in Task 20). Applies horizontal velocity; on jump input, if grounded (short downward raycast), sets upward velocity sized to feel right under the active gravity. Physics `<World gravity>` is driven by `gravityMode` (Task 16). Expose player world-position via a ref for camera + interaction.
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

- [ ] **Step 1:** Spawn N rocks (incl. one "interesting" mineral) at scattered spawn points near the lander. Track each rock's distance from the play area; if a rock has been beyond `RECALL_DIST` for `> RECALL_SECS`, respawn a rock at the player's feet. Prevents a dead-end demo.
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

- [ ] **Step 1:** Generate/obtain a looping Mars wind bed → `public/music/mars-wind.mp3`; and SFX (footstep crunch, rock clink, impact puff) → `public/mars/sfx/*.mp3`.
- [ ] **Step 2: marsSound** — start the ambient bed via `playMusic('mars-wind')` on entry (user-gesture-safe: begin on first interaction), modulate its volume by `marsStore.wind`; play positional SFX via three `PositionalAudio` on footstep/pickup/impact events.
- [ ] **Step 3: Verify:** ambient wind swells with gusts; footsteps/clink/impact fire. **Confirm the mp3s actually load** (Network tab 200s) — silence-on-missing is a trap (spec N2).
- [ ] **Step 4: Commit** — `feat(mars): ambient wind bed + positional SFX`.

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
- [ ] **Step 2: Snapshot** — a HUD camera button that renders the Canvas to a PNG (`gl.domElement.toDataURL` / `preserveDrawingBuffer` as needed) with a subtle `discoveryquest.app/mars` watermark, then triggers a download / share.
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
- **Commit after every task.** End every commit message with the `Claude-Session:` trailer.
