# Mars Surface POC — Design Spec

**Date:** 2026-07-06
**Status:** Draft for review — revised after fugu review (`.REVIEW.md`)
**Branch:** `mars-surface-poc`
**Route target:** `space.discoveryquest.app/mars`

## 1. Purpose & Scope

Build a **standalone, self-contained "walk on Mars" experience** as a proof of
concept — not (yet) wired into the Space Quest course. Luna, in a spacesuit,
stands on the Martian surface. You walk, you feel the low gravity, you pick up
a rock and throw it (watching it arc slowly is the money shot), wind kicks up
dust, and you can find the **real Perseverance rover**.

The deliverable is a shareable demo at its own route (`/mars`) that Pavel can
post about ("I made a game where you actually walk on Mars 🔴"). If it lands,
integrating it as an unlockable reward on a course path is a later, easy step
because it already lives inside the space app.

**Success criteria:**
- Open `/mars` (no login/profile needed) on a phone or desktop and, after a
  short on-brand loading screen, be standing on Mars.
- Move Luna around a believable Martian surface (first-person by default,
  toggle to third-person).
- Jump and feel the exaggerated hang-time of 0.38 g.
- Pick up a rock and throw it; watch it arc and land in low gravity.
- Wind gusts visibly move dust and a pennant; ambient wind audio swells.
- Walk up to the Perseverance rover and get a "did you know" fact card.
- **Perf target (falsifiable):** ≥ 30 fps sustained in first-person on a
  ~2021 mid-range Android (reference: Pixel 4a / Galaxy A52 class) while a rock
  is in flight *and* wind is gusting. This is the stop-condition for perf work.

## 2. Non-Goals (YAGNI)

Explicitly **out of scope** for this POC:
- No course integration, no XP, no cross-course profile, no quiz/practice
  stations, no schema changes to `space.course.yml`.
- No Moon world yet — but the design is **config-driven so Moon is a second
  config object later**, reusing 100% of the engine.
- No save state, no multiplayer, no infinite/streaming terrain (a bounded
  surface patch is enough).
- No new Luna voice-recording pipeline; use light on-screen fact cards and at
  most a couple of existing Luna lines.

## 3. Where It Lives (Architecture at a glance)

A new **isolated module** under `packages/space/src/mars/`, mounted at a `/mars`
route in the space app. It reuses the package's existing 3D stack
(`three`, `@react-three/fiber`, `@react-three/drei`) and the shared
`@discoveryquest/voice-kit` audio engine, but is **decoupled** from
`quest-runtime` / course loading so it needs no course wiring.

```
packages/space/src/mars/
  MarsSurface.jsx        # root: R3F <Canvas>, lighting, fog, mounts systems
  world/
    marsConfig.js        # the WorldConfig for Mars (gravity, sky, assets, wind…)
    WorldConfig.d/.js    # shape shared by future worlds (Moon reuses this)
  scene/
    Terrain.jsx          # procedural heightmap ground + collider + NASA texture
    SkyDome.jsx          # NASA panorama skybox + Mars sky shader + sun
    Lander.jsx           # spawn-anchor prop (glb)
    Rover.jsx            # real NASA Perseverance glb + proximity fact trigger
    Pennant.jsx          # small flag; doubles as wind visualizer (vertex sway)
  player/
    PlayerController.jsx  # input → physics body; jump w/ Mars gravity
    CameraController.jsx  # first-person rig + third-person orbit; view toggle
    Luna.jsx             # rigged astronaut glb + anim state machine (3rd person)
    Hands.jsx            # first-person gloved hands (hold/throw)
  interact/
    Rock.jsx             # a pickable/throwable rapier rigidbody
    InteractionSystem.js # raycast selection, pick-up, throw impulse
  fx/
    WindSystem.js        # gust profile → drives dust, pennant, audio, shimmer
    DustParticles.jsx    # footstep / landing / impact / wind particle emitters
  audio/
    marsSound.js         # ambient wind bed (voice-kit) + positional SFX
  ui/
    Hud.jsx              # suit gauges: gravity, temperature, wind, view/gravity toggles
    FactCard.jsx         # Luna-brand "did you know" popups
    Controls.jsx         # touch joystick + buttons (mobile), key hints (desktop)
    ControlsHint.jsx     # first-touch onboarding overlay, fades after first use
    LoadingScreen.jsx    # progress + Luna line + fact card; WebGL/old-device fallback
    Snapshot.jsx         # one-tap canvas→PNG capture with watermark
  MarsRoute.jsx          # thin route entry: mounts MarsSurface fullscreen
```

**Design principle:** everything world-specific is data in `marsConfig.js`; the
components are world-agnostic. Adding the Moon later = write `moonConfig.js`
(gravity 1.62, gray regolith, black sky w/ Earth in it, Apollo flag + lander,
LRO/Apollo imagery) and mount it at `/moon`. This is the main structural bet.

### 3.1 How `/mars` actually mounts (the app has no URL router)

Today `packages/space/src/App.jsx` uses **in-app state routing**
(`useState({ mode, profileId })` behind a profile gate at `App.jsx:40`) — it is
**not** `react-router` and never reads `window.location.pathname`. The deploy
server (`platform/apps/space-quest/server/index.mjs`) is a catch-all SPA
fallback, so `/mars` loads the app but would otherwise just render the normal
Space Quest home.

**Decision (POC-friendly, no new router):** in `main.jsx` / `App.jsx`, branch on
`window.location.pathname.startsWith('/mars')` **before** the profile gate and
render `<MarsRoute/>` fullscreen. Mars must **not** require a player profile —
it's a cold-open link from social, so it loads straight into the experience.
Adding `react-router` for one route is overkill; a pathname check is enough.

### 3.2 New dependency: `@react-three/rapier`

Rapier is **not** currently in the repo (`packages/space` only declares `three`,
`@react-three/fiber`, `@react-three/drei` as peer deps). Adding it means:
- Declare `@react-three/rapier` explicitly (it pulls in a **WASM** physics
  bundle with real startup weight).
- **Lazy-load the entire Mars module via dynamic `import()`** so Rapier's WASM
  and all Mars assets never touch the main Space Quest bundle — you only pay the
  cost when someone actually opens `/mars`.

## 4. Physics (the educational core)

Use **`@react-three/rapier`** (the standard R3F physics wrapper) for a real
physics world so gravity, jumping, and thrown rocks are genuinely simulated
rather than faked.

- **Gravity vector:** Mars = `-3.72 m/s²` (vs Earth `-9.81`, i.e. 0.38 g),
  pulled from `marsConfig`.
- **Jump:** same impulse a kid would expect on Earth produces a noticeably
  higher, floatier arc — the most *felt* demonstration of gravity.
- **Thrown rock:** a rapier rigidbody launched with an impulse; in 0.38 g it
  hangs and arcs slowly. **This is the shareable clip.**
- **Recommended (small, high-value): a "Mars ⇄ Earth gravity" toggle** on the
  HUD that swaps the gravity constant live, so you can *feel* the difference by
  jumping/throwing under each. Strong educational + viral moment. Flagged as
  recommended-MVP, not stretch.

Physics parameters live in `marsConfig` and are covered by unit tests (see §9).

## 5. Player, Camera & Controls

**Default first-person, toggle to third-person** (Luna in her suit visible).
Toggle is a HUD button (mobile) and `V` key (desktop).

- **First-person:** camera is the helmet; a faint visor frame overlay (frost /
  scratches — UI, not geometry); gloved `Hands` hold and throw rocks in view.
- **Third-person:** orbit camera behind the rigged `Luna` model, whose
  animation state machine plays idle / walk / jump / throw / crouch-pickup.

**Controls — touch-first** (the viral link opens on phones):
- *Mobile:* left virtual joystick = move; drag right half = look; on-screen
  Jump button; tap a highlighted rock = pick up; tap/flick = throw; view-toggle
  and gravity-toggle buttons on the HUD.
- *Desktop:* WASD/arrows move, mouse-look (pointer lock in FP), Space = jump,
  E or click = pick up, click/hold-release = throw, V = toggle view.

## 6. Assets

**Legend:** 🛰️ = real NASA public-domain asset (I download via `curl`),
🎨 = generated with Meshy, ⚙️ = procedural in-engine (no asset file).

| Asset | Source | Notes |
|---|---|---|
| Martian surface terrain | ⚙️ | Heightmap-displaced plane + collider; walkable. Bounded patch, fog-hidden edges. |
| Ground texture (regolith) | 🛰️ | Real rover raw-image albedo, tiled. |
| Horizon / distant hills | 🛰️ | **Perseverance/Curiosity 360° panorama as skybox** — biggest realism win. |
| Mars sky + sun | ⚙️/🛰️ | Butterscotch daytime, *blue* sunset (real, counterintuitive → fact card). Color from real imagery. |
| **Luna in spacesuit** | 🎨 | Hardest asset: **rigged + animated** (idle/walk/jump/throw/pickup). Meshy auto-rig. |
| First-person hands/gloves | 🎨 | Small; cut-down of Luna or separate mesh. |
| Mars rocks ×3–4 | 🎨 | Throwable physics objects; incl. one "interesting" mineral. Meshy image-to-3D can match real rock photos. |
| **Perseverance rover** | 🛰️ | **Official NASA `.glb`** — no Meshy needed. The "real object to find." |
| Lander / descent stage | 🛰️ or 🎨 | Spawn anchor; prefer real NASA model, Meshy fallback. |
| Wind pennant | ⚙️/🎨 | Small flag; vertex-shader sway driven by WindSystem. (Full "planted flag to find" is a Moon-world feature.) |
| Dust / footprints | ⚙️ | Particle systems + decals. |

**Assets I download myself** (network reach to `nasa3d.arc.nasa.gov`,
`mars.nasa.gov`, `science.nasa.gov` verified): panorama(s), ground textures,
Perseverance glb, lander glb. **Meshy generations:** Luna (rigged), FP hands,
rocks, (lander fallback). Files land under `packages/space/public/mars/…`.

**Pinned NASA sources** (resolve the direct file from these at build time —
NASA reorganizes URLs, so re-verify each resolves during the build, not just
today):
- **Perseverance rover glb** — NASA Science 3D Resources, "Mars 2020
  Perseverance Rover" (gltf-binary, ~4.76 MB):
  `https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/`
  (mirror: `nasa3d.arc.nasa.gov/detail/M2020-Model-Rover`, embed id `25042`).
- **360° surface panorama** — Mastcam-Z first 360° panorama (equirectangular,
  ideal for a skybox): `https://mars.nasa.gov/resources/25640/` — hi-res
  variant `https://mars.nasa.gov/resources/25674/`.
- **Ground textures** — regolith crops from the above rover raw imagery.

**Record the chosen panorama resolution in the build** — skybox texture size is
a direct mobile VRAM/perf lever (target a downsized equirectangular, e.g. ≤ 4k
wide, KTX2-compressed, not the full research-grade image).

**Rock ⇄ rover collision (edge case kids WILL try):** the Perseverance rover is
a **static collider** — thrown rocks bounce off it (satisfying, safe), it does
not move or ragdoll.

> ⚠️ **Static-asset gotcha (known platform issue):** `.dockerignore` /
> `.gitignore` patterns like `**/shots` have previously silently dropped course
> assets from deploys. Mars assets go in `public/mars/` and the plan **must**
> verify these patterns don't exclude them, and confirm delivery with real
> `curl` + click checks after deploy — not hit-tests.

- **Licensing:** NASA imagery/models are public domain (mind NASA
  logo/branding, which we won't use). Safe for a viral post.

## 7. Sound

Two layers, reusing `@discoveryquest/voice-kit`:
1. **Ambient wind bed** (the ASMR layer) — a looping track via voice-kit's music
   engine (`public/music/mars-wind.mp3`); WindSystem modulates its volume with
   gust intensity. Missing file = silently no-op (existing engine behavior).
2. **Reactive SFX** — three.js `PositionalAudio` (or voice-kit `audio.js`) for
   footstep crunch, rock pick-up *clink*, and thrown-rock impact puff.

Audio is a handful of files generated once (ElevenLabs SFX / Suno-style bed) —
**no separate sound MCP needed.**

> ⚠️ The engine's "missing audio file = silently no-op" behavior is convenient
> in dev but is exactly how you ship a silent, broken-feeling demo without
> noticing. Audio files are therefore part of the §10 `curl` pre-share
> checklist, not just the visual assets.

## 8. Environment Feedback — Wind & Temperature

- **Wind:** `WindSystem` produces a gust profile (noise over time). It drives
  dust particles, pennant sway, ambient-audio volume, and an occasional subtle
  screen dust drift. HUD shows a wind gauge.
- **Temperature:** there is *no physical channel* on a screen, so it becomes a
  **visual/UI language** — a suit thermometer gauge on the HUD (Mars ≈ −60 °C),
  faint visor frost, and cool color grading. It's flavor + a fact card, not a
  mechanic.

## 8.5 Cold-Visitor UX & Resilience

A visitor arriving from a social link has zero context and is probably on a
phone over cellular. These are cheap and directly protect the viral moment:

- **Loading screen (R3).** 3D + WASM + glb/panorama is a non-trivial cold load;
  it will not be instant. Show progress + a Luna line + a fact card so the wait
  is on-brand. On slow networks keep the loader honest (real progress, not a
  fake spinner).
- **WebGL / old-device fallback (R3).** If WebGL is unavailable or the device is
  too weak, show a graceful "your device can't walk on Mars yet" card instead of
  a blank/broken canvas.
- **Controls hint (R5).** A brief first-touch overlay ("drag to look, tap the
  glowing rock, hit jump") that fades after first use. Without it most phone
  visitors bounce before finding the throw mechanic — the exact viral moment.
- **Reset / recall rock (R1).** In 0.38 g kids *will* throw rocks off the map.
  Auto-respawn a rock at Luna's feet after it's been out of reach for N seconds
  (and/or a small "reset rocks" button). Prevents a dead-end demo.
- **Snapshot (R2).** One-tap canvas → PNG with a subtle `discoveryquest.app/mars`
  watermark, so every player becomes a distributor. (Short GIF/clip capture is a
  fast-follow.)
- **Reduced motion (R4).** Reuse the existing `packages/space/src/util/
  reducedMotion.js`. Respect `prefers-reduced-motion`: dampen camera bob, screen
  dust drift, and shake (keep the world). Ensure `Esc` clearly exits desktop
  pointer-lock so users aren't trapped.
- **Orientation (N3).** First-person walking is much better in landscape; on
  mobile portrait, prompt/encourage rotating to landscape.
- **Analytics (R6, fast-follow).** No web-analytics channel exists today (the
  repo's `track()` is local progress stats, not a funnel). If added later,
  instrument a handful of anonymous milestones — loaded, first-move, first-jump,
  first-throw, found-rover, snapshot — so Pavel can tell if the post converted to
  *play*. No PII. Kept as fast-follow.

## 9. Testing & Verification

**Unit tests** (Node's built-in `node --test`, existing `*.test.mjs` convention —
**not** vitest) on pure logic:
- `marsConfig` passes a **runtime `validateWorldConfig()` validator** (a real
  function, not just a `.d.ts` shape) — asserts gravity, sky, asset URLs, wind
  profile, temperature range are all present and well-typed. This validator is
  what makes Moon-as-config safe later.
- Physics params: gravity constant, jump-apex math for 0.38 g vs 1 g.
- `WindSystem` gust profile is bounded and deterministic given a seed.
- `InteractionSystem` raycast selection picks the nearest in-range rock.

**Scene smoke test:** `MarsSurface` mounts/renders without throwing.

**Manual verification** (per the "verify with real clicks, not hit-tests"
rule): run `/mars`, walk, jump, throw a rock, find the rover, toggle view,
exercise mobile touch controls — capture screenshots/clip. Verify deploy with
real clicks + `curl` on the live asset URLs.

## 10. Deployment — Pre-Share Checklist

The entire deliverable is a *shareable live link*, and the manual two-repo
mirror is the **highest-probability failure mode** (it silently goes stale if
skipped). Treat this as a hard gate before posting — every step in order:

1. Build in `packages/space` (open repo).
2. **Mirror** to `platform/apps/space-quest` (manual — do not skip).
3. Confirm `public/mars/**` survives `.dockerignore` / `.gitignore` (the
   `**/shots`-style ignore has dropped assets before).
4. Deploy to fly app `discoveryquest-space`.
5. `curl` **every** live asset URL — panorama, rover glb, ground textures,
   **and every audio file** (silence-on-missing-audio is exactly how you ship a
   broken-feeling demo without noticing) — asserting `200` + correct
   `content-type`.
6. Open the live `/mars` link **on a real phone** and run the full loop
   (walk → jump → pick up → throw → find rover → snapshot). Real clicks, not
   hit-tests.

## 11. Risks & Open Questions

1. **Rigged Meshy humanoid quality is the biggest unknown.** Auto-rigged Luna
   may need cleanup. **Mitigation:** start with a placeholder capsule/simple
   astronaut so the whole loop works, then swap in Meshy Luna once validated —
   the third-person model is isolated behind `Luna.jsx`.
2. **Mobile performance** (stop-condition = the §1 fps target). Mitigate with a
   dynamically-imported Mars module (Rapier WASM off the main bundle), instanced
   rocks, Draco-compressed glb, KTX2/Basis textures, a downsized panorama,
   capped particles, and fog to cull distant terrain.
3. **Panorama vs. near-terrain seam.** The skybox horizon must blend with the
   procedural ground; tune fog + ground color to the panorama's palette.
4. **Physics tuning for "fun-real."** True 0.38 g plus real jump impulses must
   still feel playful, not sluggish — expect iteration on impulse values.

## 12. Recommended MVP Cut vs. Stretch

**MVP (ship the post on this):**
- Real `/mars` pathname mount, **no profile required** (§3.1).
- Procedural terrain + NASA panorama/textures.
- First-person **default** + third-person Luna toggle (placeholder-then-Meshy).
  FP gloved hands can ship as a **simple reticle first** (N4) — they don't block
  the loop.
- Mars-gravity jump + pick-up-and-throw rock + **Mars⇄Earth gravity toggle**.
- **Rock reset / auto-respawn (R1)** — cheap, prevents a dead-end demo.
- Wind (dust + pennant + audio) + temperature HUD.
- Find-the-Perseverance-rover fact card (rover = static collider).
- Ambient wind bed + core SFX.
- **Loading screen + WebGL fallback (R3)** and **first-touch controls hint
  (R5)** — without these the shared link underperforms.
- **Reduced-motion respect (R4)** — cheap, reuses existing util.
- **One-tap snapshot (R2)** — promoted into MVP because it directly serves the
  viral goal.

**Stretch / fast-follow:** short GIF/clip capture; funnel analytics (R6); lander
clutter/equipment crates; extra rock variety; richer fact-card set; a short
cinematic landing intro; and — as a *separate world* — the Moon (`/moon`)
reusing the whole engine via `moonConfig.js`.

## 13. Review Response (fugu `.REVIEW.md`, 2026-07-06)

All review points accepted. Must-fixes resolved: **M1** routing/mount + no-profile
entry (§3.1), **M2** Rapier dependency + lazy-load (§3.2), **M3** pre-share
deploy checklist (§10), **M4** falsifiable fps target (§1). Recommended items
folded in: **R1/R3/R5** promoted to MVP, **R2** snapshot to MVP, **R4**
reduced-motion (§8.5), **R6** analytics as fast-follow, **R7** pinned NASA URLs
+ panorama-resolution note (§6), **R8** rock↔rover collision (§6). Nits: **N1**
runtime `validateWorldConfig()` (§9), **N2** audio in the curl checklist (§10),
**N3** orientation (§8.5), **N4** FP hands can ship as a reticle first (§12).
