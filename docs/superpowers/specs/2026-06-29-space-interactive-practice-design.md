# Space Quest — Interactive, Dubbed Practice — Design

Date: 2026-06-29
Status: Draft — pending spec review + implementation plan sign-off
Branch / worktree: `space-learnit`
Companion plan: `docs/superpowers/plans/2026-06-29-space-interactive-practice-redesign.md`

## Problem

Space Quest's practice is thin and uniform. Every one of the 20 stations uses the same
`quiz` board: six multiple-choice questions drawn from a band-sliced `content.questions`
pool (`packages/space/src/boardGenerators.js` → `genQuiz`, rendered by `QuizScreen.jsx`).
It is recognition-only (tap A/B/C/D), it does not reuse the cinematic scene kit built for
"Learn it", and Luna only gives generic encouragement ("You've got this!") rather than
narrating the actual question. The user feedback: practice is repetitive and "just
quiz-like, not fun."

The cinematic, Jessica-dubbed "Learn it" flow (see the companion 2026-06-27 design) proved
that a semantic scene kit plus per-beat narration feels great. Practice should reach the
same bar: the child should *do* space science, not answer a worksheet.

## Goals

1. Turn each station's practice into one or more **embodied interactive missions** — drag,
   spin, sort, arrange, tap, trace, match, or build — where the **interaction determines
   correctness**, not a tapped answer tile.
2. **Luna narrates every prompt.** Each practice item carries a `say` key; the host speaks
   it on mount and on a replay button.
3. **Reuse the existing 2D scene kit** (`packages/space/src/scenes/`) so practice visuals
   match the cinematic lessons and stay renderer-agnostic (3D-droppable later).
4. Keep practice **authored in YAML** as data, with a **small reusable mechanic
   vocabulary** — station content is data, not bespoke per-station code.
5. **Validate + dub practice exactly like lessons**: prompt text equals narration text,
   every referenced key has a fresh generated clip.
6. Deliver **world-by-world**: finish, voice, check, and verify one world's practice before
   starting the next.

## Non-goals

- Redesigning the cinematic "Learn it" flow again (it is done and approved).
- Changing map progression, star persistence, XP, or spaced-review semantics.
- Requiring 3D — first pass is 2D scene-kit-compatible only.
- Immediately deleting multiple-choice: `quiz` stays as a fallback board for not-yet-
  migrated content during the migration.
- Migrating the deployed `platform` repo (separate, manual mirror — see Follow-ups).

## Key decisions

| Decision | Choice |
|---|---|
| Interaction model | Embodied mechanics; correctness comes from manipulation |
| Narration | Luna narrates every prompt (`say` key) + replay button |
| Authoring | YAML data + small mechanic vocabulary (no per-station code) |
| Board kind | New `practice` board; `quiz` kept as fallback during migration |
| Visual layer | Reuse 2D scene kit; renderer-agnostic for later 3D |
| Rollout | World-by-world (W1 → W2 → W3 → W4), voiced + checked per world |
| Flagship | Moon Phases moon-drag (`move the Moon to a Full Moon`) proves the model first |

## Architecture

### Current practice pipeline

```txt
space.course.yml content.questions[]
  → loadCourse slices by band
  → BOARD_GENERATORS.quiz.generate()
  → QuizScreen renders prompt + answer tiles
```

### New practice pipeline

```txt
space.course.yml content.practice[]
  → loadCourse slices by station/band
  → BOARD_GENERATORS.practice.generate()
  → PracticeScreen selects a mechanic component by step.kind
  → Luna speaks step.say (+ replay)
  → mechanic emits { correct } | { incorrect } result
```

`quiz` and `practice` coexist station-by-station; the loader binds whichever `board:` the
station declares.

### Course schema

Add a `practice` board kind to the hand-maintained
`packages/space/engine.capabilities.json` (Space is NOT in `gen-capabilities.mjs`'s APPS,
so this file is authored by hand; then `npm run course:schema` + `npm run validate`).

```json
{
  "kind": "practice",
  "description": "Interactive mission practice. Learners answer by manipulating a scene: drag, spin, sort, arrange, tap, trace, or match.",
  "content": "practice",
  "item": [
    { "name": "station", "type": "string", "required": true },
    { "name": "band", "type": "number", "required": true },
    { "name": "kind", "type": "string", "required": true },
    { "name": "say", "type": "string", "required": true },
    { "name": "prompt", "type": "string", "required": true },
    { "name": "scene", "type": "object", "required": false },
    { "name": "target", "type": "object", "required": true },
    { "name": "feedback", "type": "object", "required": false }
  ]
}
```

Add a `content.practice:` collection to `space.course.yml`, tagged by `band` exactly like
`questions` (the loader's `sliceByBand` already partitions any collection where items carry
`band`). Keep `content.questions:` during migration.

> Open issue (see Review §R1): the loader slices ONLY by `band`, and each station owns a
> unique band. The `station` field above is therefore redundant for routing but useful for
> authoring clarity and cross-checks. Decision: keep `station` for human/lint use; routing
> stays band-based to avoid loader changes.

### Example: Moon-phase drag item

```yaml
content:
  practice:
    - station: moon-phases
      band: 0
      kind: moon-position
      say: pr-mp-full
      prompt: "Move the Moon to make a Full Moon."
      scene: { kind: moonPhase, interactive: true }
      target: { phase: full, toleranceDeg: 16 }
      feedback: { correctSay: pr-mp-full-ok, hintSay: pr-mp-full-hint }
```

```yaml
narration:
  pr-mp-full: "Move the Moon to make a Full Moon."
  pr-mp-full-ok: "Yes — the Moon is opposite the Sun, so we see its whole lit face."
  pr-mp-full-hint: "Try the far side of Earth, away from the Sun."
```

### Step contract

`generate()` returns the host-compatible shape (`{ word, steps: [step] }`). A practice step:

```js
{
  kind: 'moon-position',
  say: 'pr-mp-full',
  prompt: 'Move the Moon to make a Full Moon.',
  scene: { kind: 'moonPhase', interactive: true },
  target: { phase: 'full', toleranceDeg: 16 },
  feedback: { correctSay: 'pr-mp-full-ok', hintSay: 'pr-mp-full-hint' },
}
```

`PracticeScreen` owns: question counter, Luna prompt bubble + replay, voice playback of
`say`, scoring/stars, persistence (existing `mutateSave` + telemetry). Mechanic components
own: touch/drag UI, live state, target checking, hints, and emitting correct/incorrect.

## Mechanic vocabulary (v1)

| kind | interaction | stations |
|---|---|---|
| `moon-position` | drag Moon around Earth to a target phase (angular tolerance) | moon-phases |
| `earth-spin` | rotate Earth to a time-of-day target | day-night |
| `orbit-season` | drag Earth around the Sun to a season/tilt target | seasons |
| `tap-hotspot` | tap a requested feature/part of a scene | the-sun, gas-giants, nebulae, galaxies, black-holes, spacewalks, mars-base |
| `sort-zones` | drag tokens into correct bins | inner-outer, asteroids-comets, satellites, mars-base |
| `order-line` | arrange tokens into the correct order | whole-system, star-life, getting-there |
| `orbit-match` | place a body in the correct orbit / match orbit↔job | moons-rings, life-in-orbit, satellites |
| `compare-strength` | drag toward stronger/weaker gravity or scale | gravity, gas-giants |
| `connect-stars` | trace/join constellation points | constellations |

Pure, node-testable helpers back each mechanic (e.g. `practice/phaseTargets.js`,
`practice/order.js`, `practice/sortZones.js`, `practice/scoring.js`) so logic is verified by
`node --test` without a browser, mirroring the lesson kit's split.

## Station-by-station redesign map

See the companion plan for the full per-station prompt list. Summary by world:

- **World 1 — Backyard Sky:** moon-phases (`moon-position`), day-night (`earth-spin`),
  the-sun (`tap-hotspot`), seasons (`orbit-season`), gravity (`compare-strength`).
- **World 2 — Cosmic Neighborhood:** inner-outer (`sort-zones`), gas-giants
  (`tap-hotspot`/`compare-strength`), moons-rings (`orbit-match`), asteroids-comets
  (`sort-zones`), whole-system (`order-line`).
- **World 3 — Deep Space:** constellations (`connect-stars`), star-life (`order-line`),
  nebulae (`tap-hotspot`), galaxies (`tap-hotspot`), black-holes (`tap-hotspot`).
- **World 4 — The Human Element:** life-in-orbit (`orbit-match`), getting-there
  (`order-line`), satellites (`sort-zones`/`orbit-match`), spacewalks (`tap-hotspot`),
  mars-base (`tap-hotspot`+`sort-zones`).

## Audio / narration contract

Practice narration is generated and validated like lessons. Extend the Space checker
(`scripts/course-check.mjs` semantic layer, or a space-specific helper) so that:

1. Every `practice[].say` exists in `narration`.
2. Every `practice[].prompt === narration[practice.say]`.
3. Every `feedback.*Say` and any nested `target`/state `say` exists in `narration`.
4. Every used practice narration key has a fresh generated clip (manifest baked text
   matches `forSpeech(text)`).

Runtime: speak `say` on mount and on replay; speak `feedback.correctSay` on success and
`feedback.hintSay` on a miss (falling back to existing `reactions.praise`/`oops`).

## UX details

- Layout: header (title, progress dots, back) · Luna bubble (prompt + replay) · interactive
  stage · feedback strip · continue button after success.
- Attempts/hints: 1st miss → conceptual hint; 2nd → stronger visual guidance; 3rd → "show
  me" ghost target, then retry.
- Stars: 3 = mostly first-try, 2 = corrected after hints, 1 = completed with help.
- Accessibility: keyboard fallback for every drag; visible prompt-replay; honor
  `useReducedMotion` (disable idle animation, keep interaction); ARIA labels on targets.

## Validation & tests

- Schema: regenerate `course.schema.json`; `npm run validate` green.
- Course integrity: extended `course:check:space` green (practice narration + audio).
- Unit (`node --test`): scoring helpers (angular tolerance, order, sort-zone, hotspot id),
  generator step-shape legality, prompt/narration equality, fallback `quiz` still valid.
- Manual: real-browser walkthrough of one practice mission per world, plus reduced-motion.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Practice becomes too custom per station | Small mechanic vocabulary; content is data |
| Audio generation cost grows | Incremental generation by changed key; reuse feedback lines |
| Drag is hard on small screens | Large targets, snap zones, generous tolerances, tap/keyboard fallback |
| Schema too permissive (generic `target`) | Start generic, tighten per-kind once mechanics stabilize |
| Headless verification can't drive drag/audio | Verify mechanic logic via unit tests + DOM dump; confirm feel in a real browser |

## Implementation phases (summary)

0. Preserve `quiz` fallback (no `content.questions` removal yet).
1. Core practice host: `practice` board kind, schema, generator, `PracticeScreen` with Luna
   narration, existing scoring/persistence.
2. Build reusable mechanics + pure scoring helpers under `packages/space/src/practice/`.
3. World 1 migration + voice + checks + real-browser walkthrough (flagship: moon-drag).
4. World 2 migration + voice + checks.
5. World 3 migration + voice + checks.
6. World 4 migration + voice + checks.
7. Optional: retire/relegate `quiz` fallback once all 20 stations are interactive.

## Follow-ups

- Mirror updated YAML + generated practice clips into the deployed `platform` repo (manual
  mirror, per project memory). Clips remain gitignored (`**/public/voice/`).
- Consider wiring Space into `gen-capabilities.mjs` so capabilities aren't hand-maintained.

---

## Spec review (2026-06-29)

Reviewer pass against the current codebase. Severity: **[H]** must fix before build,
**[M]** decide during Phase 1, **[L]** nice-to-have.

### Findings

- **[H] R1 — Routing is band-based, not station-based.** `loadCourse`'s `sliceByBand`
  partitions a content collection purely by `band`, and each station already owns a unique
  band (0–19). So `content.practice` items route to a station via their `band`, and the
  `station` field is descriptive only. The spec now states this explicitly; do NOT assume a
  `station`-keyed loader without changing `loadCourse`. Keep `band` authoritative.
- **[H] R2 — `genQuiz` returns ONE problem; the host loops 6×.** `QuizScreen` calls
  `station.generate()` `QUEST_LEN` times. A practice mission is usually a *fixed sequence*
  of distinct steps, not 6 random draws. Decision: `PracticeScreen` should consume the
  station's authored practice list as an ordered set (length = number of authored items),
  rather than calling a random single-problem generator 6×. `generate()` should return the
  full ordered step list for the station (shape `{ steps: [...] }`), and the host paces it.
  This is a real divergence from the quiz host and must be designed in Phase 1.
- **[M] R3 — Star scoring lives in the host, duplicated.** Both `QuizScreen` and the store's
  `resolveGate` compute stars; `QuizScreen` writes to `save.stations` directly via
  `mutateSave` (it does NOT go through `resolveGate`). `PracticeScreen` must mirror the same
  persistence path (`save.stations[id]` best-of stars + telemetry `track(...)`) to keep map
  progression working. Confirm whether practice should also flow through the store's
  gate persister; current quiz does not, so match quiz to avoid scope creep.
- **[M] R4 — `caption === narration[say]` invariant is lesson-only today.** The checker's
  caption check walks `lessons[].sections[].beats[]`. Practice items live under
  `content.practice`, so the new equality/audio checks (Audio contract 1–4) need NEW checker
  code; they are not free. Budget a `course-check` extension task in Phase 1.
- **[M] R5 — Reuse vs. fork of interactive scene components.** `MoonPhase2D` (interactive
  slider), `Scrub2D`, and `Reveal2D` already `speak()` and manage drag/tap. `moon-position`,
  `earth-spin`, and `tap-hotspot` should *wrap/extend* these rather than reimplement, but
  note a key difference: lesson interactives are open-ended ("explore"), while practice
  needs a **target + pass/fail + attempts**. Plan a thin "evaluation" layer around the
  existing components instead of duplicating their rendering.
- **[L] R6 — `connect-stars` scoring may already exist.** Tests reference path-trace star
  scoring ("perfect trace → 3 stars", `pathEdges`, `samplePath`). Investigate
  `packages/space/src/**` trace utilities before writing new constellation scoring.
- **[L] R7 — Keyboard/drag a11y is non-trivial.** Drag-to-target on touch + keyboard
  fallback is the riskiest UX. Recommend the flagship `moon-position` ship with an explicit
  keyboard control (arrow keys nudge angle) as the reference a11y pattern for all mechanics.
- **[L] R8 — Band/difficulty semantics.** Today `band` is identity (one per station), not
  difficulty tiers. If practice later wants multiple difficulty levels per station, that
  needs a separate field; do not overload `band`.

### Verdict

Design is **sound and buildable** with two must-resolve items folded in before coding:
R1 (band routing is authoritative) and R2 (practice is an authored ordered sequence, not 6
random draws — the host must differ from `QuizScreen`). R3–R5 are Phase-1 design tasks.
R6–R8 are refinements. No blockers to starting Phase 1 with World 1's flagship
`moon-position` mission.
