# @discoveryquest/space — Space Quest

A **fully-3D, guided-navigation** space-science course. Unlike the 2D trail-map
courses (math/english), Space Quest ships a small **immersive engine** (3D scene
graph, guided flight, state machine) **plus its own scene-as-data format** — so the
*course content stays data*, only the runtime is new code. See the design spec:
`docs/specs/2026-06-23-space-quest-immersive-design.md`.

> **Status:** All 4 sectors scaffolded (Backyard Sky / Cosmic Neighborhood / Deep Space /
> The Human Element) with all 4 Cosmic Gates (`phaseLock`, `orbitSort`, `connectStars`,
> `dock`) and a **Star Chart** to warp between them (progress retained per sector). The
> flight model is guided (tap a beacon; the ship auto-flies a smooth 3D path) — not 6-DoF.
> All 4 sectors have full **"Learn it" content** (fact cards + questions before each
> gate, NGSS-aligned) — 12 stations, 36 facts, 24 questions — checked by a data
> validator (`data/sectors.test.mjs`).

## Layout

```
src/
  store/gameStore.js   pure state machine + tiny store (GALACTIC→FLYING→STATION_IDLE→GATE_ACTIVE→SECTOR_COMPLETE)
  store/useGame.js     React binding (useSyncExternalStore)
  flight/path.js       pure Catmull-Rom flight-path math (no three dep → testable)
  flight/{CameraRig,Ship}.jsx   guided chase-cam flight
  scene/SectorScene.jsx         renders a sector from its `scene` DATA
  scene/primitives/*.jsx        Skybox, StarField (1 draw call), Body, Orbit, Beacon, Light
  gates/phaseLock.js + .jsx     "Phase Lock" gate — match a Moon phase (pure scoring + UI)
  gates/orbitSort.js + .jsx     "Orbit Sort" gate — order planets inner→outer (pure + UI)
  gates/connectStars.js + .jsx  "Connect the Stars" gate — trace a constellation (pure + UI)
  gates/dock.js + .jsx          "Docking" gate — align ship with a port (pure + UI)
  gates/eventHorizon.js + .jsx  "Event Horizon" gate — slingshot a black hole (pure + UI)
  lesson.js            pure "Learn it" quiz scoring (questions → correct count)
  StationLesson.jsx    the "Learn it" beat — fact cards + questions, shown before the gate
  progress.js          ENGINE SEAM: record gate + lesson results into the engine save (→ XP)
  data/backyard-sky.scene.js        Sector 1 as data (Earth/Moon, NGSS-tagged stations)
  data/cosmic-neighborhood.scene.js Sector 2 as data (Sun + 8 planets, orbitSort gates)
  data/deep-space.scene.js          Sector 3 as data (black hole + stars, connectStars gates)
  data/human-element.scene.js       Sector 4 as data (ISS/satellite/Mars, dock gates)
  data/sectors.js                   sector registry + findStation/stationTitle lookups
  StarChart.jsx        the warp hub — pick a sector (DOM overlay; shown in GALACTIC)
  DiscoveryDeck.jsx    the Science Log — facts you've collected, grouped by sector (§5.3)
  scene/GalacticBackdrop.jsx        star backdrop shown behind the chart (no sector loaded)
  Hud.jsx              2D DOM HUD overlay (Luna comms, objective, gate UI, Star Chart btn)
  SpaceQuest.jsx       store-driven <Canvas> + HUD (mounts active sector or the chart)
```

## Dependencies

`three`, `@react-three/fiber`, `@react-three/drei` are **peer deps** supplied by the
app shell (like `react`/`framer-motion` in the other packages). The store and
flight math are dependency-free and unit-tested.

## Engine seams

The gate→XP seam is **wired by default** (`progress.js`): `SpaceQuest` calls
`setSaveKey('sq-save')` + `setGatePersister(recordGateResult)`, so resolving a gate
records best-of stars + per-day telemetry + concept into the `@discoveryquest/engine`
save, and `computeXp()`/`heroLevel()` pick it up (verified in `progress.test.mjs`).
The store stays engine-free (the persister is injected), so the app shell can override
it (e.g. to also drive account sync). Profiles, sign-in (`accountSlot`/`authSlot`), and
`voice-kit` audio remain app-shell concerns.

## Not yet built (next passes)

- The 5 gates are DOM overlays — a later pass can make them true 3D (Phase Lock as a
  sun-rotation scene, Dock as a real approach, etc.). All 12 stations have a real gate
  now (no demo fallback in use; the fallback button only triggers for unknown kinds).
- Band-aware content (show easier/harder facts + questions by the child's age/band).
- A 3D holographic Star Chart; GLTF/texture assets; bloom; audio/narration.
- **Not yet verified in a browser** — the `.jsx` runs only in an app shell with R3F
  installed (see the shipping notes the team is tracking).

## Test

```
node --test src/**/*.test.mjs    # state machine, flight math, phaseLock, gate→XP
```
