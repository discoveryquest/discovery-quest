# Mars Surface POC — Design Spec

**Date:** 2026-07-06
**Status:** Draft for review
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
- Open `/mars` on a phone or desktop and immediately be standing on Mars.
- Move Luna around a believable Martian surface (first-person by default,
  toggle to third-person).
- Jump and feel the exaggerated hang-time of 0.38 g.
- Pick up a rock and throw it; watch it arc and land in low gravity.
- Wind gusts visibly move dust and a pennant; ambient wind audio swells.
- Walk up to the Perseverance rover and get a "did you know" fact card.
- Runs at a smooth framerate on a mid-range phone.

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
    Hud.jsx              # suit gauges: gravity, temperature, wind, controls hint
    FactCard.jsx         # Luna-brand "did you know" popups
    Controls.jsx         # touch joystick + buttons (mobile), key hints (desktop)
  MarsRoute.jsx          # thin route entry: mounts MarsSurface fullscreen
```

**Design principle:** everything world-specific is data in `marsConfig.js`; the
components are world-agnostic. Adding the Moon later = write `moonConfig.js`
(gravity 1.62, gray regolith, black sky w/ Earth in it, Apollo flag + lander,
LRO/Apollo imagery) and mount it at `/moon`. This is the main structural bet.

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

## 8. Environment Feedback — Wind & Temperature

- **Wind:** `WindSystem` produces a gust profile (noise over time). It drives
  dust particles, pennant sway, ambient-audio volume, and an occasional subtle
  screen dust drift. HUD shows a wind gauge.
- **Temperature:** there is *no physical channel* on a screen, so it becomes a
  **visual/UI language** — a suit thermometer gauge on the HUD (Mars ≈ −60 °C),
  faint visor frost, and cool color grading. It's flavor + a fact card, not a
  mechanic.

## 9. Testing & Verification

**Unit tests** (`vitest`, existing `*.test.mjs` convention) on pure logic:
- `marsConfig` / WorldConfig shape is valid and complete.
- Physics params: gravity constant, jump-apex math for 0.38 g vs 1 g.
- `WindSystem` gust profile is bounded and deterministic given a seed.
- `InteractionSystem` raycast selection picks the nearest in-range rock.

**Scene smoke test:** `MarsSurface` mounts/renders without throwing.

**Manual verification** (per the "verify with real clicks, not hit-tests"
rule): run `/mars`, walk, jump, throw a rock, find the rover, toggle view,
exercise mobile touch controls — capture screenshots/clip. Verify deploy with
real clicks + `curl` on the live asset URLs.

## 10. Deployment

Route `/mars` in the space app. Per the two-repo setup, build in
`packages/space` (open repo), then **manually mirror** to
`platform/apps/space-quest` for deploy to fly app `discoveryquest-space`
(the packages/space ↔ platform mirror is manual and silently goes stale if
skipped). Confirm assets under `public/mars/` survive the ignore patterns and
serve on the live host.

## 11. Risks & Open Questions

1. **Rigged Meshy humanoid quality is the biggest unknown.** Auto-rigged Luna
   may need cleanup. **Mitigation:** start with a placeholder capsule/simple
   astronaut so the whole loop works, then swap in Meshy Luna once validated —
   the third-person model is isolated behind `Luna.jsx`.
2. **Mobile performance.** Mitigate with instanced rocks, Draco-compressed glb,
   KTX2/Basis textures, capped particles, and fog to cull distant terrain.
3. **Panorama vs. near-terrain seam.** The skybox horizon must blend with the
   procedural ground; tune fog + ground color to the panorama's palette.
4. **Physics tuning for "fun-real."** True 0.38 g plus real jump impulses must
   still feel playful, not sluggish — expect iteration on impulse values.

## 12. Recommended MVP Cut vs. Stretch

**MVP (ship the post on this):** procedural terrain + NASA panorama/textures +
first-person & third-person Luna (placeholder-then-Meshy) + Mars-gravity jump +
pick-up-and-throw rock + Mars⇄Earth gravity toggle + wind (dust + pennant +
audio) + temperature HUD + find-the-Perseverance-rover fact card + ambient wind
bed + core SFX.

**Stretch / fast-follow:** lander clutter/equipment crates, extra rock variety,
richer fact-card set, a short cinematic landing intro, and — as a *separate
world* — the Moon (`/moon`) reusing the whole engine via `moonConfig.js`.
