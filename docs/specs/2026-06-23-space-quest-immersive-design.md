# Space Quest — Immersive 3D Course Design Spec & Authoring Brief

> **Status:** Design / authoring brief (2026-06-23)
> **Audience:** the generating model (Fugu/Opus/Gemini) **and** Discovery Quest maintainers
> **Deliverable being specified:** a **fully 3D, immersive**, browser-based space-exploration
> learning experience for ages 5–12 — a real-time 3D world (continuous space, planets, stars,
> a chase-cam ship) — *not* a 2D trail-map course like Math/English Quest.
>
> **Control philosophy:** the *visuals and motion are fully 3D and immersive*, but
> **navigation is guided** — the child chooses *where* to go and the ship flies a smooth 3D
> path there. No free 6-DoF piloting (a real getting-lost / motion-sickness risk for young
> kids); guided travel that *feels* like flying, not an arcade flight sim.

You are an expert **instructional designer, gamification specialist, and senior creative
front-end architect (real-time WebGL)**. Produce the design blueprint and the front-end
implementation for **Space Quest**: a "spaceship traveling through the Milky Way" that
gamifies an astronomy & space-science curriculum.

---

## 0. CRITICAL ARCHITECTURAL CONTEXT — read first

Discovery Quest is an **open-core learning engine** (AGPL-3.0). Its existing courses
(Luna's Math Quest, English Quest) follow one rule:

> **Courses are data, not code.** A fixed engine vocabulary (`board` interactions,
> lesson `view`s, `content` collections) is the code; a course is a single validated
> `*.course.yml` file that composes that vocabulary. Authors write data, never UI.

**Space Quest does *not* abandon "data, not code" — it *extends* it.** The existing 2D engine
can't render a 3D world, so Space Quest ships a **second, immersive engine** (the 3D runtime:
flight, scene graph, gate mechanics) **plus its own capability catalog**
(`space.capabilities.json`, Appendix B). Once that engine exists, **the course itself is data
again** — sectors, stations, lessons, facts, questions, and narration in a `space.course.yml`,
the same separation Math/English use. The structure is data; the engine handles flight,
rendering, and the gate mini-games. The only real difference is upfront cost:

| | 2D course (Math/English) | **Space Quest (this spec)** |
|---|---|---|
| Engine | Already exists; you write **zero code** | **New immersive engine** built first (one-time) |
| Capability catalog | `engine.capabilities.json` (boards/views/content) | **New** `space.capabilities.json` (views/questions/**gates**/content) — Appendix B |
| The course | Pure-data `*.course.yml` PR | Pure-data `space.course.yml` PR **on top of** the new engine |
| Irreducible code | A brand-new interaction only | 3D runtime + the 4 gate interaction kinds + shaders/assets |

In short: you're **building a new engine and its first course at the same time**, instead of
adding a course to an engine that already exists. Per the README, *"a brand-new interaction is
the only thing that needs an engine change"* — the four Cosmic Gates are exactly those new
interactions; everything else stays data.

**The hybrid we adopt (do not deviate without flagging):**

1. **Bespoke immersive shell** — Three.js scene graph, flight, HUD. *New code.*
2. **Learning content stays data** — questions, facts, narration live in a
   `space.content.yml`/JSON authored against a small **content vocabulary**, so pedagogy
   is reviewable and not buried in 3D code. (Mirrors the engine's `content:` collections.)
3. **Reuse engine services, don't reinvent them** — shared profiles, derived XP / hero
   levels, the Luna companion persona, and `voice-kit` audio (see §4). A kid who played
   Math Quest opens Space Quest **as the same hero, same level.**

Everything below assumes this hybrid.

---

## 1. Target audience & pedagogical tone

- **Ages 5–12.** Adventurous, curious, encouraging, clear.
- **Scientifically accurate.** Use correct terms (Gas Giant, Event Horizon, Stellar
  Nebula, Heliosphere) but always explain them contextually in kid-readable language.
- **Minimal text barriers**, heavy visual storytelling, immediate interactive feedback.
- **Age-scaled difficulty** via *bands* (see §6): the same station serves a 5-year-old
  and a 12-year-old at different depths.
- **Merge is gated** — this ships to young children; every bit of content is reviewed for
  pedagogy, accuracy, and age-appropriateness. Write to that bar.

---

## 2. Recommended tech stack

| Concern | Choice | Why |
|---|---|---|
| Rendering | **React Three Fiber (R3F)** + `@react-three/drei` | Declarative scene graph; integrates with the React HUD; matches the engine's React/ESM stack |
| Helpers | `drei` (`<Stars>`, `<Html>`, `<Float>`, `<Trail>`, GLTF/`useGLTF`, `<CameraControls>`) | Pre-built star fields, billboards, engine trails, HTML-in-3D for HUD anchors |
| Flight | **Guided 3D flight** — ship auto-flies smooth curved paths (Catmull-Rom / `CatmullRomCurve3`) between beacons on a `useFrame` loop; cinematic chase cam with banking & parallax | Fully-3D *feel* without free-fly; no getting lost or motion sickness for ages 5–12 (see §5) |
| Input | Tap/click a beacon to travel; optional **look-around** drag & gentle steering nudge; touch + **Gamepad API** | Pick-a-destination is the core verb; look/steer is garnish, not required |
| Game/UI state | **Zustand** | Tiny, framework-agnostic store the 3D scene and 2D HUD both subscribe to (event bus, see §8) |
| HUD overlay | **HTML/CSS layer** above the canvas (absolute-positioned React tree) | DOM text = accessible, crisp, localizable; 3D stays for the world |
| Post-processing | `@react-three/postprocessing` (bloom for stars/suns) — *budgeted* | Magic without tanking low-end devices |
| Audio | **`packages/voice-kit`** (existing) | Narration + music already solved; do not rebuild |
| Build | Vite, ESM, React 18 | Matches monorepo conventions |

Place the app at `packages/space` (a new workspace), consistent with `packages/math`,
`packages/english`.

---

## 3. Curriculum → Sectors (the 4 worlds)

Four progressive **Sectors**. Each = a region of the galaxy the ship visits; each contains
3–6 **stations** (planets / gates / waypoints). For every Sector provide: theme, 2–3 core
objectives, scene setting (palette / particles / assets), and the **Cosmic Gate** — the
interactive challenge that unlocks the next warp.

| Sector | Theme | Core objectives | Scene setting (canvas) | Cosmic Gate (challenge) |
|---|---|---|---|---|
| **1 · The Backyard Sky** | Earth, Moon phases, gravity, day/night | (1) Day/night from Earth's spin; (2) Moon phases from Sun angle; (3) gravity pulls toward mass | Warm dawn→dusk gradient skybox; Earth + Moon GLTF; gentle parallax stars; home-base feel | **Phase Lock:** rotate the Sun-light around the Moon to match a shown phase |
| **2 · Cosmic Neighborhood** | The Solar System | (1) inner (rocky) vs outer (gas giant) planets; (2) relative scale; (3) orbits & the Sun's pull | Central Sun (directional + bloom); 8 orbiting planets on rings; asteroid-belt `Points` | **Orbit Sort:** drag planets into correct order / inner-vs-outer bins, then fly the orbit |
| **3 · Deep Space** | Stars, constellations, star lifecycle, nebulae, black holes | (1) stars are born & die; (2) constellations are patterns; (3) black holes bend light | Indigo void; volumetric nebula sprites; dense `THREE.Points` star field; lensing shader near the black hole | **Connect the Stars:** trace a constellation; then survive the **Event Horizon** slingshot |
| **4 · The Human Element** | ISS, satellites, exploration tech, Mars/Lunar bases | (1) what astronauts do & why suits/ISS exist; (2) how we travel there; (3) living off-Earth | Low-Earth orbit; ISS GLTF; satellites; Mars surface base scene | **Docking Maneuver:** align & dock with the ISS; then plan a Hohmann-style transfer to Mars |

The **Cosmic Gates** are the only genuinely "game-y" interactions. Everything else (the
fact-learning inside a station) reuses lightweight question types driven by data (§6).

### 3.1 Curriculum standard & alignment (NGSS primary, UK Year 5 cross-check)

Author against named standards, the same way English Quest is **Common-Core-aligned**. Space
science isn't covered by Common Core, so the anchors are:

- **Primary: NGSS** (Next Generation Science Standards) — *Earth's Place in the Universe*
  (**ESS1**) + gravity (**PS2**), grade-banded K–8.
- **International cross-check: UK National Curriculum**, Science **Year 5 "Earth and Space."**
- **Supporting: NASA Next Gen STEM** — activities/assets, especially Sector 4 mission content.

| Sector | NGSS performance expectations | Band |
|---|---|---|
| 1 · Backyard Sky | `1-ESS1-1` (sun/moon/star patterns), `1-ESS1-2` (daylight by season), `5-PS2-1` (gravity pulls toward Earth), `5-ESS1-2` (day/night, shadows, seasonal stars) | K–5 — **core** |
| 2 · Cosmic Neighborhood | `5-ESS1-1` (apparent brightness ∝ distance), `MS-ESS1-2` (gravity in the solar system), `MS-ESS1-3` (scale of solar-system objects) | 5 → MS |
| 3 · Deep Space | `5-ESS1-1` (partial); star lifecycle / nebulae / black holes are **beyond K–6** | MS+ / **enrichment** |
| 4 · Human Element | `3-5-ETS1-1/2/3` (engineering design) + NASA mission content; **not a science-content standard** | **enrichment / STEM** |

**Honesty rule for banding:** formal elementary space science is thin — Moon phases, day/night,
sun/moon/star patterns, the solar system, and relative distance/brightness. **Sectors 1–2 are
on-grade core; Sectors 3–4 deliberately exceed the standards** — they're the "wow" hook, pitched
at the older end of the band and framed as exploration, not testable mastery. Tag each station in
`space.content.yml` with its standard code(s) and `band` so reviewers can audit coverage; the
grade-band (K / 1–2 / 3–4 / 5–6) *is* the `bands` definition, mirroring English Quest.

---

## 4. Integration with the Discovery Quest engine (reuse, don't rebuild)

These already exist in the monorepo. Wire into them; do not reimplement.

### 4.1 Shared profiles (`packages/engine/src/profiles.js`)
- Device-wide roster in `localStorage` key **`dq-profiles`**: `{ id, name, avatar (emoji,
  default 🦊), age }`, canonical across all courses.
- Use `ensureRegistry`, `resolveActiveProfile(courseId, reg)` → `setup | picker | game`,
  `createProfile`, `setActiveProfile`. **`courseId: 'space'`.**
- Per-course save keyed by `profile.id`. **`profile.age` drives the starting Sector** —
  younger explorers begin in Sector 1; older kids can warp ahead (skipped sectors stay
  reachable, presented as "for younger explorers"). Order Sectors by ascending age.

### 4.2 Derived XP & hero level (`packages/engine/src/xp.js`)
- **Do not invent a points system.** XP is *derived* from play signals already stored in
  the save: stars per station, capped corrects, new concepts seen, active days, reviews.
- Award **0–3 stars per station**; record per-day per-station telemetry
  (`{ correct, reviewsHit }`) exactly like the other courses, so `computeXp(save)` and
  `heroLevel(xp)` "just work" and roll into the cross-course `xpByCourse` ledger.
- Reference weights (for tuning intuition only): +10/correct (cap 15/station), +50/star,
  +30/new concept, +25/active day, +15/review hit; `heroLevel = 1 + floor(√(xp/100))`.
- Surface the hero level in the HUD via the engine's `HeroBadge` (account-gated).

### 4.3 Companion — Luna the owl (now space-suited)
- Luna is the **AI co-pilot**. All narration/feedback speaks in her encouraging voice.
- Reuse the `companion: luna` persona and the `reactions` model (`praise` / `oops` /
  `solved` voice-line pools). In 3D she can be a HUD portrait / comms-channel avatar.
- **Space variant (required asset):** Luna wears a clear bubble **space helmet** so she can
  breathe in the vacuum — a Space-Quest skin of the standard owl. Keep her face fully visible
  through the visor (expressions drive feedback); add a soft helmet-glass reflection and her
  brand crest on the suit. Use it everywhere she appears (HUD portrait, comms avatar, any
  in-scene cameo). It's a re-skin of the existing companion, not a new character — same
  persona, same voice lines.

### 4.4 Audio / narration (`packages/voice-kit`)
- Every spoken line references a **voice-line id** with matching **on-screen caption text**
  (accessibility + literacy — narration and visible text must agree). Reuse the playback +
  music kit; do not build a new audio layer.

### 4.5 Auth & accounts (commercial layer — **do not implement**)
- The open app runs **fully anonymously on-device**. Sign-in, accounts, and cross-device
  sync are the *commercial* layer, injected via slots: `accountSlot` (header),
  `authSlot` (profile setup), account-gated `HeroBadge`.
- Space Quest must work **signed-out**. Expose the same slots; the app shell fills them.

### 4.6 Cross-course header
- Reuse `QuestHeader` / `QuestSettingsSheet` so "More quests" → the catalog and unified
  settings work identically to Math/English.

---

## 5. Interactive game mechanics & control layout

### 5.1 Flight / navigation — *guided travel that feels fully 3D*
The world is continuous 3D (real planets, stars, depth, parallax) and the ship has weight and
motion — but **navigation is guided, not free 6-DoF piloting.** The child decides *where* to
go; the ship flies there for them. This keeps the immersion while removing the getting-lost
and motion-sickness risks of free-fly for ages 5–12.

- **The core verb is "choose a destination."** Each station/point of interest shows a glowing
  **navigation beacon**. Tap/click a beacon → the ship **auto-flies a smooth curved 3D path**
  (a `CatmullRomCurve3` through space) to it, with a cinematic chase cam that banks into turns
  and parallaxes the star field. It *looks and feels* like flying; the child can't crash or
  wander off.
- **Optional garnish, never required:** a gentle look-around drag (clamped) and a small
  steering nudge during cruise for older kids who want to feel hands-on — but doing nothing
  still gets you there.
- **Arrival is diegetic:** as the path completes near a station, the state machine enters
  `STATION_IDLE` (§7.3) and the HUD surfaces its objective — you *arrive*, no menu.
- **No fail-states:** you can't get lost, run out of fuel in a punishing way, or crash. Gates
  retry warmly with a Luna hint.
- **5–12 affordances:** big beacons, clear "where to next" prompts from Luna, optional steering
  scales with `profile.age` (younger = pure tap-to-travel).

### 5.2 Scale management (the vastness problem) — diegetic, stays immersive
Don't break immersion with a 2D level-select. Handle scale *inside the cockpit*:
- **In-ship Star Chart (hologram):** open a holographic 3D galaxy map projected in front of
  the pilot seat — Sectors are glowing nodes you reach into and select. It's a HUD object in
  the 3D world, not a separate 2D screen. Choosing a Sector triggers a **warp jump**.
- **Continuous flight within a Sector:** once warped in, you fly the real 3D scene (planets,
  stars, the ISS) and approach stations by piloting to them.
- **WARP transition** (hyperspace streak + fade) covers the impossible distances *and* the
  asset load between Sectors. Distances are **stylized, never literal** — convey "space is
  huge" through copy and warp, never by making a child fly real AU.
- **Two camera framings** of the *same* world, blended smoothly: a wide **cruise** chase cam
  for travel, easing into a closer **approach** cam near a station — no hard mode switch.

### 5.3 HUD & Discovery Deck (the 2D overlay)
- **Top:** `QuestHeader` (hero level/`HeroBadge`, account slot, settings, "More quests").
- **Co-pilot comms:** Luna portrait + caption line for the current narration beat.
- **Science Log / Discovery Deck:** collectible **fact cards** unlocked per station —
  a swipeable deck of what you've learned (doubles as review surface).
- **Mission objective** chip: the current station/gate goal in one line.
- **Fuel / progress** is *cosmetic motivation*, not a resource that can soft-lock a child.
- All HUD is DOM (crisp text, localizable, screen-reader friendly), layered over the canvas.

---

## 6. Learning content as data (keep pedagogy reviewable)

Even though the shell is bespoke, **author the learning content as data**, mirroring the
engine's `content:` collections. Define a small vocabulary, e.g.:

```yaml
# space.content.yml  (reviewed like a course; powers the in-station learning)
sectors:
  - id: backyard-sky
    title: The Backyard Sky
    emoji: 🌙
    stations:
      - id: moon-phases
        title: Moon Phases
        concept: moon-phases          # drives XP "new concept" + spaced review
        standard: [1-ESS1-1]          # NGSS code(s) — see §3.1; reviewers audit coverage
        bands: [0, 1]                 # difficulty tiers (0 = youngest)
        facts:                        # → Discovery Deck cards + Luna narration
          - say: lspace-0
            caption: The Moon makes no light of its own — it mirrors the Sun!
          - say: lspace-1
            caption: As the Moon orbits Earth, we see more or less of its lit side.
        questions:                    # → graded interactions inside the station
          - kind: pick                # small fixed set of question kinds (below)
            band: 0
            prompt: Which Moon is full?
            answer: full
            options: [full, crescent, new]
        gate:                         # the Cosmic Gate challenge config
          kind: phaseLock
          target: waxing-gibbous
```

- **Fixed question/interaction kinds** (the immersive analogue of `board` kinds): keep a
  *small, typed* set — e.g. `pick`, `match`, `sort`, `order`, `trace`, plus the per-sector
  **gate kinds** (`phaseLock`, `orbitSort`, `connectStars`, `dock`). Each gate kind is real
  engine code; **a brand-new kind is a code change**, so reuse before adding.
- **`bands`** = difficulty tiers; tag every fact/question with a band; a station exposes
  one or more bands by the child's age. This is how one course spans ages 5–12.
- **`concept`** keys make stations reviewable by the spaced-review system.
- Validate this file with a thin validator (reuse `course:check`'s semantic checks:
  every `say` has a `caption`; every referenced kind exists; refs resolve).

---

## 7. Three.js scene composition & state management

### 7.1 Scene graph organization (load/destroy on warp)
```
<Canvas>
  <GameRoot>                         // subscribes to Zustand game store
    <SkyboxFor sector={current}/>    // gradient / nebula / starfield per sector
    <StarField count={…}/>           // THREE.Points — instanced, one draw call
    <Suspense fallback={<WarpLoader/>}>
      <SectorScene id={current}/>    // lazy-loaded; the ONLY heavy subtree
    </Suspense>
    <Ship/>                          // persistent across sectors; follows the guided flight curve
    <CameraRig mode={cruise|approach}/>  // chase cam; eases cruise → approach near a station
  </GameRoot>
</Canvas>
<HudOverlay/>                        // sibling DOM tree, not in canvas
```
- **Exactly one `SectorScene` mounted at a time.** Warping unmounts the old subtree
  (R3F disposes geometries/materials/textures on unmount) and `Suspense`-loads the next.
  Preload the *next* sector's GLTFs during the warp animation (`useGLTF.preload`).
- Ship + CameraRig + StarField persist (cheap, continuous).

### 7.2 Asset & performance strategy (ages 5–12 on school Chromebooks)
- **Background stars:** single `THREE.Points` with a `BufferGeometry` of thousands of
  vertices + a soft sprite texture — *one draw call*, not thousands of meshes.
- **Planets:** low-poly spheres + texture maps; reserve custom shaders for the Sun
  (emissive + bloom) and the black-hole lensing. Reuse one sphere geometry, swap materials.
- **Lighting:** `AmbientLight` (low fill) + a `DirectionalLight` *as the Sun/nearest star*
  (drives Moon phases and planet day-sides). Avoid many dynamic lights.
- **Budgets:** target 60fps desktop / 30fps low-end; `dpr={[1, 1.5]}`; instancing for
  asteroid belts & satellites; lazy-load + dispose; cap post-processing.
- **Emoji/icons:** use the engine's OpenMoji `<Emoji>` pipeline for HUD icons; 3D assets
  are GLTF/textures (credit sources in `CREDITS.md`).

### 7.3 Game state machine (3D triggers → 2D HUD)
```
            ┌─────────┐  pick waypoint   ┌────────┐  arrive trigger  ┌──────────────┐
  BOOT ───▶ │ GALACTIC │ ───────────────▶│ FLYING │ ────────────────▶│ STATION_IDLE │
            └─────────┘                  └────────┘                  └──────┬───────┘
                 ▲                                                          │ start gate
                 │ warp out                                                 ▼
            ┌────┴─────┐  gate passed (stars awarded)              ┌──────────────┐
            │  SECTOR  │◀────────────────────────────────────────│ GATE_ACTIVE  │
            │ COMPLETE │                                           └──────────────┘
            └──────────┘
```
- The **store is the single source of truth**; the 3D scene *dispatches* events
  (`onApproach`, `onGatePassed`) and the HUD *renders* from store state. No direct
  canvas→DOM imperative calls.
- On `GATE_ACTIVE` the HUD swaps to the challenge UI; on success the store awards stars +
  telemetry (→ XP), unlocks the Discovery Deck card, and transitions.
- Persist `save` (stations, stars, telemetry, conceptSeen, profile) via the engine's
  `save.js` so XP/hero level and sync behave like the other courses.

---

## 8. State integration contract (3D ↔ HUD)

```js
// Zustand store (illustrative)
useGame = {
  phase: 'GALACTIC',          // state machine above
  sector: 'backyard-sky',
  station: null,
  cameraMode: 'galactic',     // 'galactic' | 'orbital'
  // events dispatched by the 3D scene:
  approachStation(id),        // FLYING → STATION_IDLE
  startGate(),                // STATION_IDLE → GATE_ACTIVE
  resolveGate({ stars, correct }), // → award, telemetry, SECTOR_COMPLETE?
  warpTo(sectorId),           // → FLYING/GALACTIC + lazy load
}
```
HUD components subscribe with selectors; the canvas calls actions. This is the seam that
keeps the 3D and 2D worlds decoupled and testable.

---

## 9. Accessibility & child-safety

- DOM HUD text for screen readers; captions for every narration line.
- No timed fail-states that punish; gates retry warmly with a Luna hint.
- Reduced-motion setting → skip warp streaks / dampen parallax & bloom.
- Colorblind-safe Sector palettes; never rely on color alone to convey state.
- Works **signed-out, offline-first** (localStorage). No data leaves the device without
  the commercial account layer.

---

## 10. What's reusable vs net-new

| Reuse from engine (don't rebuild) | Net-new code (this app) |
|---|---|
| `profiles.js` (roster, gate, `dq-profiles`) | R3F scene graph, sectors, ship, camera rig |
| `xp.js` (`computeXp`, `heroLevel`, telemetry shape) | Galactic/orbital view + warp transitions |
| `save.js` (persist/migrate/sync) | The 4 Cosmic Gate mini-games |
| `voice-kit` (audio + music) | Discovery Deck / Science Log HUD |
| Luna companion persona + `reactions` | `space.content.yml` schema + thin validator |
| `QuestHeader` / `QuestSettingsSheet` / `HeroBadge` | Zustand game store + state machine |
| OpenMoji `<Emoji>` for HUD icons | GLTF/shader assets (Sun bloom, black-hole lens) |

---

## 11. Expected output (for the generating model)

Deliver, in order:

1. **The design blueprint** — the tables above, finalized (Sectors, gates, stations).
2. **`space.content.yml`** — all 4 sectors populated with stations, banded facts &
   questions, gate configs, concept keys, and narration captions. Reviewable as data.
3. **Front-end implementation** — a runnable R3F app at `packages/space`:
   the `<Canvas>` scene graph, the state machine + Zustand store, the HUD overlay, at least
   one fully-working Sector with its Cosmic Gate, and the engine integrations in §4 stubbed
   to the real APIs (profiles, save/XP, voice-kit, header slots).
4. **Proposed engine touchpoints** — any new shared capability you needed (e.g. a generic
   "experience" save shape) called out separately so maintainers can review it as an
   engine change, not smuggle it into content.

Aim for a maintainer-mergeable starting point: the 3D scaffold + HUD + one complete Sector,
with content fully data-driven and the engine services wired, not reinvented.

---

## 12. Open decisions / risks (resolve with the team before scaling)

1. **Scope of "immersive."** The world is fully 3D and immersive, but **navigation is guided**
   — the ship auto-flies smooth 3D paths to destinations the child picks (§5.1). This is the
   *adopted* design: full free 6-DoF piloting is a bigger build and a real getting-lost /
   motion-sickness risk for 5-year-olds. Immersive *feel*, guided *control*. *(Decided.)*
2. **Asset sourcing.** Production 3D needs licensed/credited GLTF + textures (NASA imagery,
   OpenMoji for HUD). No model will produce final art — plan an asset pipeline.
3. **Gates are real code.** Each Cosmic Gate kind is engine work; keep the set to 4 and
   reuse question kinds elsewhere. New kinds = reviewed code changes.
4. **It's a new engine, not a data-abandonment.** Space Quest keeps the data/code split — it
   just ships a *new* immersive engine + capability catalog (Appendix B) before the data course
   can run. Keep all *learning content* in data (§6); only the 3D runtime, gate mechanics, and
   assets are irreducible code.
5. **One model won't one-shot this.** Expect to generate the scaffold + HUD + one Sector,
   then iterate on 3D polish, performance, and art with real assets.

---

## Appendix A — Engine capability context pack (attach these when prompting)

The generating model can only integrate with the engine if it can *see* the engine's real
APIs and vocabulary. **Before prompting, assemble this context pack** and attach it alongside
this spec. Paste files verbatim — do not summarize; the model needs exact signatures.

### A.1 Files to attach (paths in this monorepo)

| File | Provides | What the model uses it for |
|---|---|---|
| `packages/engine/src/profiles.js` | Device-wide profile roster (`dq-profiles`) | Onboarding gate, identity, `profile.age` → starting Sector |
| `packages/engine/src/xp.js` | Derived XP + hero level | Award stars/telemetry so XP "just works" cross-course |
| `packages/engine/src/save.js` | Per-course save: load/persist/migrate | Persisting Space Quest progress in the standard shape |
| `packages/engine/src/sync.js`, `syncMerge.js` | Roster/save merge for sync | Only if wiring the commercial sync layer |
| `packages/english/engine.capabilities.json` | The **capability catalog** format (boards/views/content) | The pattern to imitate for `space.capabilities.json` (A.2) |
| `packages/english/english.course.yml` | A real, valid course in the data format | Worked example of worlds → stations → lessons → content |
| `packages/voice-kit/src/*` | Audio + music playback API | Narration/`say` playback; don't rebuild audio |
| `packages/engine-ui/src/QuestHeader.jsx`, `HeroBadge.jsx`, `ProfileSetup.jsx`, `ProfilePicker.jsx` | Shared header + hero badge + onboarding UI + slots | Reuse the header, hero level display, and `accountSlot`/`authSlot` |
| `README.md` (root) + `CONTRIBUTING.md` | "Courses are data, not code" philosophy + review bar | Framing so the model respects the data/code split |

### A.2 The exact API surface (so the model calls real functions)

**Profiles** (`packages/engine/src/profiles.js`) — key constant `REGISTRY_KEY = 'dq-profiles'`:
```js
ensureRegistry(storage, sources)            // load or seed the device roster
loadRegistry(storage) / persistRegistry(reg, storage)
resolveActiveProfile(courseId, reg)         // → { mode: 'setup' | 'picker' | 'game', profileId? }
createProfile(storage, { courseId, saveKey, fields })   // fields: { name, avatar, age }
setActiveProfile(storage, { reg, courseId, saveKey, profileId })
editProfile(storage, { reg, saveKey, profileId, fields })
mergeRoster(a, b)                           // pure roster merge (sync); xpByCourse merged by max
// Profile shape: { id, name, avatar (emoji, default '🦊'), age }
// Space Quest uses courseId: 'space'
```

**XP / hero level** (`packages/engine/src/xp.js`) — *derived*, never a stored counter:
```js
computeXp(save)        // from save.telemetry (per-day {stationId:{correct,reviewsHit}}),
                       // save.stations[].stars, save.conceptSeen
xpByStation(save)      // per-station breakdown (capped corrects + stars)
heroLevel(xp)          // 1 + floor(sqrt(xp / 100))
heroProgress(xp)       // { level, into, span, pct }
totalXp(xpByCourse)
// Weights (XP): CORRECT 10 (cap 15/station), PER_STAR 50, REVIEW 15, STREAK 25/day, CONCEPT 30
```
> **Integration rule:** Space Quest must write the **same `save` shape** (stations w/ stars,
> per-day telemetry `{correct, reviewsHit}`, `conceptSeen`, `profile`) so `computeXp`/`heroLevel`
> and the cross-course `xpByCourse` ledger work unchanged. Award 0–3 stars per station; tag each
> station with a `concept` key. **Do not invent a points field.**

### A.3 How the existing capability catalog works (the pattern to copy)

`packages/<subject>/engine.capabilities.json` is the **menu the engine offers** — the only
things a course may compose. Shape:
```json
{
  "version": 1,
  "boards":  [ { "kind": "blendWord", "description": "...", "content": "blendWords", "item": [ ... ] } ],
  "views":   [ { "kind": "phoneme", "description": "...", "fields": [ { "name": "letter", "type": "string", "required": true } ] } ],
  "content": [ { "id": "phonemes", "description": "...", "collection": "objects", "item": [ ... ] } ]
}
```
- **`boards`** = interactive question UIs (+ generators). A board names the `content` collection it draws.
- **`views`** = lesson visuals (the "Learn it" beats), each with typed `fields`.
- **`content`** = the data collections boards/views read.
- It is **generated** from engine code (`npm run course:capabilities`) and **drives validation**:
  `course:schema` turns it into a JSON Schema; `course:check` verifies every `kind` is real and
  every prop is the right type, plus semantic checks (every `say` has a matching `caption`).

**Hand the model `english.capabilities.json` as the format reference** even though it's not
space-specific — it teaches the *shape*, and the model defines Space's own catalog next.

---

## Appendix B — Defining Space Quest's own capability catalog

Because Space Quest is a bespoke app, it brings its **own** capability catalog —
`packages/space/space.capabilities.json` — mirroring the engine's format so the *learning
content* (§6) stays data-driven and reviewable. Define a **small, typed** vocabulary; a
brand-new `kind` is real code, so reuse before adding.

```json
{
  "version": 1,
  "views": [
    { "kind": "factCard", "description": "A Discovery Deck card: emoji/image + caption.",
      "fields": [ { "name": "emoji", "type": "string", "required": true },
                  { "name": "caption", "type": "string", "required": true } ] },
    { "kind": "orbitView", "description": "Bodies orbiting a center; for scale/order lessons.",
      "fields": [ { "name": "bodies", "type": "object[]", "required": true },
                  { "name": "centerOn", "type": "string", "required": true } ] }
  ],
  "questions": [
    { "kind": "pick",  "description": "Choose one correct option.",
      "fields": [ { "name": "prompt", "type": "string", "required": true },
                  { "name": "options", "type": "string[]", "required": true },
                  { "name": "answer", "type": "string", "required": true } ] },
    { "kind": "match", "description": "Match pairs (e.g. planet ↔ trait)." },
    { "kind": "order", "description": "Put items in sequence (e.g. inner→outer planets)." }
  ],
  "gates": [
    { "kind": "phaseLock",    "description": "Rotate the Sun-light to match a target Moon phase.",
      "fields": [ { "name": "target", "type": "string", "required": true } ] },
    { "kind": "orbitSort",    "description": "Drag planets into inner/outer bins, then fly the orbit." },
    { "kind": "connectStars", "description": "Trace a constellation, then slingshot the black hole." },
    { "kind": "dock",         "description": "Align and dock with the ISS; plan a Mars transfer." }
  ],
  "content": [
    { "id": "stations", "collection": "objects", "item": [
      { "name": "id", "type": "string", "required": true },
      { "name": "concept", "type": "string", "required": true },
      { "name": "bands", "type": "number[]", "required": true } ] }
  ]
}
```

**Authoring rules (carry over from the engine):**
- The data file (`space.content.yml`, §6) may only use `view`/`question`/`gate`/`content`
  `kind`s present in this catalog — same guarantee `course:check` gives the YAML courses.
- Write a **thin validator** that reuses the engine's semantic checks: every `say` has a
  matching `caption`; every referenced `kind` exists; every `lesson`/`concept` ref resolves;
  every board/question's content covers the `bands` it uses.
- **Keep `gates` to the four in §3** and reuse `questions` everywhere else. Each new `kind`
  here is engine code that a maintainer reviews — treat additions as expensive.
- When you add a `view`/`question`/`gate` `kind` in code, regenerate this catalog (mirror the
  engine's `npm run course:capabilities` flow) so the schema and validator stay in sync.

### B.1 Scene-as-data vs. bespoke scene (where to draw the line)

A Sector's 3D scene sits on a spectrum. Decide this explicitly — it determines whether adding
a 5th Sector is a *data PR* or an *engine PR*.

| | **Scene-as-data** (recommended default) | **Bespoke scene** (escape hatch) |
|---|---|---|
| What it is | A `scene:` block in `space.course.yml` that the engine renders from a library of primitive components | Hand-written R3F/Three.js for one Sector |
| Adding a Sector | Pure data PR | Engine code PR |
| Good for | Skyboxes, planets/moons, orbits, beacons, lighting, asteroid belts | Black-hole lensing, ISS docking choreography, one-off set-pieces |
| Cost | Build the primitive library once | Re-coded per Sector |

**Recommendation:** make **90% of every scene data-driven**, and reserve bespoke code for the
irreducible set-pieces (mostly the four gate mechanics + shaders). The engine ships a small
**scene-primitive library** (`<Skybox>`, `<Body>`, `<Orbit>`, `<Beacon>`, `<StarField>`,
`<Light>`) whose props are typed in `space.capabilities.json` (a `scenePrimitives` section,
same pattern as `views`). A Sector's scene is then just data:

```yaml
# inside a sector in space.course.yml
scene:
  skybox: dawn-gradient            # a named preset (catalog enum)
  starfield: { count: 4000, depth: far }
  lights:
    - { kind: ambient, intensity: 0.3 }
    - { kind: sun, position: [50, 10, 0], bloom: true }   # doubles as the directional Sun
  bodies:
    - { id: earth, model: earth, radius: 1.0, position: [0, 0, 0], spin: 0.2 }
    - { id: moon,  model: moon,  radius: 0.27, orbit: { around: earth, r: 4, period: 30 } }
  beacons:
    - { station: moon-phases, at: moon, label: "Moon Phases" }   # ties a beacon to a station
  setpiece: null                   # or a registered bespoke component id (escape hatch)
```

**Rules:**
- The renderer reads `scene:` and instantiates primitives; **unknown `model`/`skybox`/`kind`
  values fail validation** (same guarantee as `board`/`view` kinds).
- A Sector needing genuinely custom 3D sets `setpiece: <id>` pointing at a registered bespoke
  component — that registration is the *only* code a new Sector should require. Keep set-pieces
  rare; prefer extending the primitive library so the gain is reusable.
- Gate mechanics stay in code regardless (they're interactions, not scenery), referenced from
  the station's `gate:` block (§6).
- **Net effect:** new planets, moons, beacons, and whole Sectors become **data PRs**; only a
  brand-new *visual primitive* or *set-piece* is an engine PR — the same data/code line the rest
  of Discovery Quest draws.
