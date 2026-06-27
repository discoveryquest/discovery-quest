# Space Quest — Cinematic, Interactive, Dubbed "Learn it" — Design

Date: 2026-06-27
Status: Approved (brainstorm) — pending spec review + implementation plan
Branch / worktree: `space-learnit` (snapshot of the untracked 2D YAML Space package)

## Problem

Space Quest's "Learn it" is thin. Every one of the 20 stations has the same shape: a
3-beat lesson where each beat is a single static `fact` view — a big emoji plus a line of
text (`packages/space/src/lessons/views.jsx`). There are no animations, the UX is flat,
and although the lesson engine already calls `speak()` per beat and the YAML carries a full
`narration:` map, **no Jessica voice clips have ever been generated** — so nothing is
actually dubbed; only captions show.

## Goals

1. Replace static emoji cards with **cinematic, animated visual scenes** (dark space,
   glowing gradient bodies, drifting star particles, glow/bloom) — visual direction "C"
   chosen during brainstorming.
2. **Deepen each station** from 3 beats to ~5 beats (hook → 3 teach → recap) **plus one
   interactive "explore" beat**.
3. **Dub everything in Jessica's voice** — generate the ElevenLabs MP3s so all narration
   (existing + new, including interactive lines) is audible.
4. Keep lessons **authored in YAML** (no per-lesson code), consistent with how Math/English
   courses work.
5. **Renderer-independence**: the visuals must be swappable to 3D later with no content
   changes — flip a switch (globally or per-scene-kind) and the same lessons render in 3D.

## Non-goals

- Building the 3D renderers now (only the abstraction that makes them droppable later).
- Changing the quiz/board side of stations, the TrailMap, or progression.
- Migrating the deployed `platform` app (separate repo, manual mirror — see Follow-ups).

## Key decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | More content **and** better visuals |
| Visual style | Cinematic / immersive (option C) |
| Lesson depth | ~5 beats (hook + 3 teach + recap) **+ interactive explore** |
| Dubbing | Generate Jessica clips now (ElevenLabs key available) |
| Architecture | Reusable parameterized "Scene Kit" with a pluggable renderer registry |
| 3D | Must be interchangeable later — renderer-agnostic scene descriptors |

## Architecture

### Renderer-agnostic scene descriptors

A beat's `view` stops describing pixels and describes the scene **semantically**: what
bodies/elements exist and how they behave (who orbits whom, periods, phase-lit, particle
fields, rings, tilt, comparison pairs, interactive states). It never references SVG vs
WebGL. Example:

```yaml
view:
  kind: orbit
  key: mp1
  bodies:
    - { id: sun,   role: star }
    - { id: earth, role: planet }
    - { id: moon,  role: moon, orbits: earth, period: 6, phaseLit: true }
```

### Pluggable Scene-renderer registry

A single dispatcher resolves a descriptor to a renderer by `(mode, kind)`:

```
<Scene descriptor={view} mode={mode} />
  └─ SCENE_RENDERERS[mode][kind]
       mode '2d' → Body2D, Orbit2D, Field2D, Scrub2D, Reveal2D, Launch2D, Compare2D  (now)
       mode '3d' → Body3D, Orbit3D, …                                                 (later)
```

- `mode` defaults to `'2d'`. It originates as a single exported constant in
  `src/scenes/registry.js` (e.g. `export const SCENE_MODE = '2d'`); `views.jsx` reads it and
  passes it into `<Scene>`, so `CourseLesson`'s `renderView(view)` contract is unchanged.
  Switching the whole course to 3D is editing that one constant; per-kind override is
  supported via the fallback below. (A future enhancement could read it from
  `space.course.yml`, but that is out of scope here.)
- **Fallback:** if `SCENE_RENDERERS[mode][kind]` is missing, fall back to `'2d'` for that
  kind (so a partial 3D rollout never breaks a lesson).
- The same descriptors/YAML feed both renderers — **zero content changes when 3D arrives**.
- The dormant `src/scene` scaffold (and the `space-3d-fugu` prototype) become the eventual
  home for the `3d` renderers.
- This replaces today's `renderLessonView`. `LessonScreen` and `CourseLesson` are untouched
  except that `renderView` now returns `<Scene descriptor={view} mode={mode} />`.

### The 2D Scene Kit (cinematic style C) — initial vocabulary

| kind | renders | example stations |
|---|---|---|
| `body` | one glowing gradient body; opts: rings, tilt, glow, label | the-sun, gas-giants, mars-base, black-holes |
| `orbit` | central body + orbiting bodies on dashed paths | moon-phases, day-night, satellites, life-in-orbit |
| `field` | drifting particle cloud (stars/nebula/galaxy), tintable | nebulae, galaxies, constellations, deep-space |
| `scrub` | **interactive**: drag through N states; each speaks its line | moon phases, seasons, star-life lifecycle |
| `reveal` | **interactive**: tap hotspots to reveal + speak a fact | inner-outer, whole-system, asteroids-comets |
| `launch` | rocket thrust/launch animation | getting-there, spacewalks |
| `compare` | side-by-side size/scale comparison | gas-giants (Jupiter vs Earth), whole-system |
| `fact` | legacy emoji + caption (kept registered for back-compat) | migration safety net |

All scenes share a cinematic base component (space-gradient backdrop + particle starfield +
glow), use framer-motion, and **honor `useReducedMotion`** (fall back to a calm static
frame). A concept that genuinely doesn't fit gets a bespoke component that still registers
as a `kind`, so authoring stays uniform.

## Lesson structure

Each station's `lessons.<id>.sections[0].beats` becomes ~6 beats:

1. **Hook** — a question / striking visual ("Why does the Moon change shape?").
2–4. **Teach** — three teaching beats, each a scene + Jessica line.
5. **Recap** — one-line takeaway, celebratory tone.
6. **Explore** — interactive (`advance: hold`), a `scrub` or `reveal` scene; never
   auto-advances; the learner leaves via "Let's practice!". The engine already supports
   `advance: hold`.

Authored entirely in YAML. Every spoken line is added to the `narration:` map (the source
of truth for both runtime playback and voice generation).

### Interactive beat mechanics (both dubbed)

- **`scrub`** — a draggable handle / slider moves through ordered states (phases, seasons,
  lifecycle). Entering a state shows its caption and calls voice-kit `speak()` with that
  state's line.
- **`reveal`** — tappable hotspots on a scene; tapping reveals a label and speaks the
  fact's clip. The learner explores at their own pace.

Both reuse the same descriptor data and call into `@discoveryquest/voice-kit/audio`'s
`speak()` so exploration is dubbed too.

### Interactive descriptor shapes

Each interactive state/hotspot carries **both** a `caption` (shown) and a `say` key (the
narration key, so the line lives in `narration:` and gets generated + spoken):

```yaml
# scrub — ordered states the learner drags through
view:
  kind: scrub
  key: mp-explore
  base: { kind: orbit, bodies: [ { id: earth, role: planet }, { id: moon, role: moon, orbits: earth, phaseLit: true } ] }
  states:
    - { id: new,     label: New Moon,     say: mp-x-new,     caption: "New Moon — the lit side faces away from us." }
    - { id: quarter, label: First Quarter, say: mp-x-quarter, caption: "First Quarter — we see half the lit side." }
    - { id: full,    label: Full Moon,    say: mp-x-full,    caption: "Full Moon — the whole lit side faces Earth." }

# reveal — tappable hotspots on a scene
view:
  kind: reveal
  key: io-explore
  base: { kind: field, tint: deep-space }
  hotspots:
    - { id: mercury, label: Mercury, say: io-x-mercury, caption: "Mercury — closest to the Sun, small and rocky." }
    - { id: jupiter, label: Jupiter, say: io-x-jupiter, caption: "Jupiter — the largest planet, a gas giant." }
```

`scrub`/`reveal` may carry a `base` descriptor (a non-interactive scene kind) they render
the interaction on top of, or render standalone.

### Narration key convention

Existing keys are `<station>-<n>` (`mp-0..2`). The expanded structure extends this:

- Hook / teach / recap beats: continue the numeric sequence — `mp-0` (hook), `mp-1..3`
  (teach), `mp-4` (recap).
- Interactive per-state / per-hotspot lines: `<station>-x-<stateId>` (e.g. `mp-x-full`,
  `io-x-jupiter`) so they're visually distinct from the linear beats.

## Dubbing pipeline (Jessica, generate now)

- New `packages/space/scripts/gen-voice.mjs`, mirroring
  `platform/apps/*/scripts/gen-voice.mjs`:
  - Reads `space.course.yml`'s `narration:` map (authoritative).
  - Calls ElevenLabs TTS with voice **Jessica**, teaching-slow profile.
  - Writes `examples/space-preview/public/voice/jessica/*.mp3` + a `manifest.json` that
    bakes each clip's text, so a changed line is regenerated (not just missing ones).
  - Sources `ELEVENLABS_API_KEY` from `platform/apps/math-quest/.env` (the established
    single source on this machine).
- Add an npm script (e.g. `voice:space`) at the discovery-quest root.
- Run it to generate **all** clips: the original ~60 lines plus every new hook/recap/
  teach/explore line.
- Runtime already plays `/voice/jessica/<key>.mp3` via `setActiveVoice('jessica')` +
  `speak()`; the course already declares `voice: { id: jessica, profile: teaching-slow }`.

### Clip location nuance

The dev server (and your phone test) serves from `examples/space-preview/public/voice/
jessica/`, so clips are generated there. The deployed `platform` app is a separate repo
with a manual mirror — see Follow-ups.

## Module layout

```
packages/space/src/scenes/
  Scene.jsx          # dispatcher: SCENE_RENDERERS[mode][kind] with 2D fallback
  registry.js        # { '2d': { body, orbit, field, scrub, reveal, launch, compare, fact } }
  2d/
    base.jsx         # shared cinematic backdrop (space gradient + starfield + glow)
    Body2D.jsx Orbit2D.jsx Field2D.jsx Scrub2D.jsx Reveal2D.jsx Launch2D.jsx Compare2D.jsx
    Fact2D.jsx       # legacy emoji card, re-homed
  scenes.test.mjs    # each descriptor renders without crashing; registry fallback works
```

- `lessons/views.jsx` becomes a thin shim returning `<Scene descriptor={view} mode={mode} />`
  (keeps `CourseLesson`'s `renderView` contract stable).
- **Naming note:** new code lives in `src/scenes/` (plural). The pre-existing dormant 3D
  scaffold is `src/scene/` (singular) and is intentionally left as the future home for `3d`
  renderers — the near-identical names are deliberate, not a typo.
- `space.course.yml` lessons + `narration:` are rewritten/extended per the new structure.

## Testing & validation

- **Unit/smoke** (`node --test`): each 2D scene renders for a representative descriptor;
  the registry falls back to `'2d'` when a `(mode, kind)` is missing; the `scrub`/`reveal`
  state→`speak()` wiring is covered with a stubbed voice-kit.
- **Course validation:** `npm run validate` (gen-capabilities + gen-schema + gen-changelog
  `--check`). `gen-schema.mjs` already includes `packages/space`; the schema/capabilities
  may need the new view `kind`s added.
- **Manual (TDD's outer loop):** run the space-preview dev server from this worktree, open
  it on the phone, click through a station, and confirm: cinematic animation plays, Jessica
  narrates each beat, captions match, and the interactive explore beat responds + speaks.

## Risks / mitigations

- **20 stations is a lot of content** → the reusable Scene Kit + YAML authoring keeps it
  tractable; build the kit + one world fully first to prove the template, then replicate.
- **ElevenLabs cost/rate limits** → manifest-based skip of unchanged clips; teaching-slow
  profile matches existing courses.
- **Scene-kit abstraction leaking visual specifics** → descriptors are reviewed to ensure
  they're semantic (no SVG/DOM terms) so 3D renderers can consume them unchanged.
- **Reduced-motion / no-audio devices** → engine already advances beats off clip duration
  with an `ended` early-out and a hard cap; scenes honor `useReducedMotion`.

## Follow-ups (out of scope here)

- Mirror generated `jessica/*.mp3` + course YAML into the deployed `platform` repo (manual
  two-repo mirror per project notes), or wire a sync.
- Implement the `3d` renderer set under `src/scene` and flip `mode` per-kind.
- Reconcile this branch with `space-3d-fugu` (divergent App.jsx/MapScreen + 3D prototype).
