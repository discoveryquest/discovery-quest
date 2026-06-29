# Space Quest — Interactive Practice Redesign Plan

Date: 2026-06-29  
Branch/worktree: `space-learnit`  
Status: proposed implementation plan

## Problem

The current Space Quest practice (`QuizScreen`) is a six-question multiple-choice loop:

- Luna gives generic encouragement, not the actual question narration.
- Practice does not reuse the cinematic lesson scene vocabulary.
- Questions are recognition-only: pick A/B/C/D.
- The content feels repetitive and disconnected from the interactive lesson moments.

The new practice should feel like *doing space science*, not answering a worksheet.

## Product goal

Each station's practice becomes a small interactive mission. Luna narrates the prompt, the child manipulates a scene, and the answer is determined by the interaction.

Example target behavior:

> Luna: "Move the Moon to make a full moon."  
> The child drags the Moon around Earth.  
> When the Moon reaches the full-moon position, the answer is correct.

## Non-goals for the first redesign pass

- Do not redesign the cinematic `Learn it` flow again.
- Do not change map progression/star persistence semantics.
- Do not require 3D; use 2D scene-kit-compatible interactions first.
- Do not remove multiple-choice support immediately; keep it as a fallback board for content not migrated yet.

## Core design principles

1. **One station = one or more embodied actions.**  
   Practice should ask the learner to move, sort, arrange, tap, trace, match, or build.

2. **Luna narrates every prompt.**  
   Every practice item has a `say` key. The host speaks `say` at the start of each step and can replay it.

3. **Prompt text equals narrated text.**  
   Like lesson beats, shown prompt text should match `narration[say]` exactly for validation and stale-audio detection.

4. **Interaction determines correctness.**  
   Avoid "tap the right answer tile" except as fallback.

5. **Use station-specific mechanics, not one generic mechanic.**  
   Moon phases should be a moon-orbit drag. Whole System should be planet ordering. Satellites should be orbit/job matching.

6. **World-by-world implementation.**  
   Finish all practice missions for one world, voice/check/test that world, then continue to the next world.

## Proposed runtime architecture

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
  → loadCourse slices by band/station
  → BOARD_GENERATORS.practice.generate()
  → PracticeScreen selects a mechanic component by step.kind
  → Luna speaks step.say
  → component emits correct/incorrect/completed result
```

Keep `quiz` as a fallback board, but migrate Space stations to a new board kind such as `practice` or `mission`.

## Course schema proposal

Add a new board kind in `packages/space/engine.capabilities.json`:

```json
{
  "kind": "practice",
  "description": "Interactive mission practice. Learners answer by manipulating a scene: drag, sort, arrange, tap, trace, or match.",
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

Add `content.practice:` to `space.course.yml`. Keep `content.questions:` during migration.

### Example: Moon phase drag item

```yaml
content:
  practice:
    - station: moon-phases
      band: 0
      kind: moon-position
      say: pr-mp-full
      prompt: "Move the Moon to make a Full Moon."
      scene:
        kind: moonPhase
        interactive: true
      target:
        phase: full
        angle: 180
        toleranceDeg: 16
      feedback:
        correctSay: pr-good-full
        hintSay: pr-hint-full
```

Narration:

```yaml
narration:
  pr-mp-full: "Move the Moon to make a Full Moon."
  pr-good-full: "Yes — the Moon is opposite the Sun, so we see its whole lit face."
  pr-hint-full: "Try placing the Moon on the far side of Earth, away from the Sun."
```

## Practice step contract

A generated practice problem should return:

```js
{
  word: step.target?.label,
  steps: [{
    kind: 'moon-position',
    say: 'pr-mp-full',
    prompt: 'Move the Moon to make a Full Moon.',
    scene: { kind: 'moonPhase', interactive: true },
    target: { phase: 'full', angle: 180, toleranceDeg: 16 },
    feedback: { correctSay: '...', hintSay: '...' }
  }]
}
```

`PracticeScreen` owns:

- question counter
- Luna prompt bubble
- voice playback for `step.say`
- replay button for Luna's prompt
- scoring/stars
- persistence via existing `mutateSave`/telemetry flow

Mechanic components own:

- touch/drag UI
- live state
- checking target correctness
- showing visual affordances/hints
- emitting `{ correct: true }` or `{ incorrect: true }`

## Audio/narration requirements

Practice narration should be generated and validated exactly like lessons.

Add course-check invariants:

1. Every `practice[].say` exists in `narration`.
2. Every `practice[].prompt === narration[practice.say]`.
3. Every `feedback.correctSay`, `feedback.hintSay`, etc. exists in narration.
4. Every used practice narration key has a fresh generated clip.

Runtime:

- On step mount: `speak(step.say, { important: true })`.
- On replay prompt: `speak(step.say, { important: true })`.
- On correct: speak `feedback.correctSay` if present, else existing praise line.
- On incorrect/hint: speak `feedback.hintSay` if present, else existing oops line.

## Mechanic vocabulary v1

### `moon-position`

Learner drags Moon around Earth to target phase.

- Use/refactor `MoonPhase2D` geometry.
- Target by `phase` or `angle`.
- Correct when angular error <= tolerance.
- Shows phase disc as live feedback.

Needed for:

- `moon-phases`

### `earth-spin`

Learner rotates Earth to a time-of-day target: dawn/noon/dusk/night.

- Could extend `scrub` into a continuous/stepped practice control.
- Target by state id.

Needed for:

- `day-night`

### `orbit-season`

Learner drags Earth around the Sun to match season/hemisphere sunlight.

- Reuse orbit drag with target positions.
- Include tilt marker.

Needed for:

- `seasons`

### `tap-hotspot`

Learner taps a requested part/feature in a scene.

- Prompt: "Tap the Sun's core." / "Tap Saturn's rings."
- Correct when tapped hotspot id matches target.
- Can reuse `Reveal2D` visual affordances, but answer checking should be explicit.

Needed for:

- `the-sun`
- `gas-giants`
- `nebulae`
- `black-holes`
- `spacewalks`
- `mars-base`

### `sort-zones`

Learner drags tokens into zones.

- Example zones: Inner planets / Outer planets.
- Correct when all tokens are in correct zones.

Needed for:

- `inner-outer`
- `asteroids-comets`
- `satellites`

### `order-line`

Learner arranges tokens in order.

- Planet order, star lifecycle, rocket sequence.
- Correct when ordered ids match target order.

Needed for:

- `whole-system`
- `star-life`
- `getting-there`

### `compare-strength`

Learner chooses/drags toward stronger/weaker gravity or scale relation.

- Could be drag an astronaut/object to the world with stronger pull.
- Better than plain answer tiles because the scene reacts.

Needed for:

- `gravity`

### `connect-stars`

Learner traces/joins constellation points.

- Correct when edges match target pattern within tolerance.
- Existing path-trace scoring utilities may be reusable.

Needed for:

- `constellations`

### `orbit-match`

Learner places a satellite/ISS/moon into the correct orbit or matches orbit to job.

- Drag to low/high/geostationary orbit lane.
- Or drag job chips to orbiting satellites.

Needed for:

- `moons-rings`
- `life-in-orbit`
- `satellites`

## Station-by-station redesign map

### World 1 — Backyard Sky

1. `moon-phases`
   - Primary mechanic: `moon-position`.
   - Prompts:
     - "Move the Moon to make a Full Moon."
     - "Move the Moon to make a First Quarter Moon."
     - "Move the Moon to make a Waning Crescent."
   - Success: Moon angle within tolerance.

2. `day-night`
   - Mechanic: `earth-spin`.
   - Prompts:
     - "Spin Earth until your town has noon."
     - "Spin Earth until your town has night."
   - Success: scrub/rotation state matches target.

3. `the-sun`
   - Mechanic: `tap-hotspot`.
   - Prompts:
     - "Tap the part of the Sun where energy is made."
     - "Tap the rays that carry light and heat to Earth."

4. `seasons`
   - Mechanic: `orbit-season`.
   - Prompts:
     - "Move Earth to the place where the northern half tilts toward the Sun."
     - "Move Earth to winter for the northern half."

5. `gravity`
   - Mechanic: `compare-strength`.
   - Prompts:
     - "Drag the astronaut to the world with the strongest gravity."
     - "Drop the rock toward Earth's center."

### World 2 — Cosmic Neighborhood

6. `inner-outer`
   - Mechanic: `sort-zones`.
   - Sort Mercury/Earth/Mars vs Jupiter/Neptune into inner rocky / outer giant.

7. `gas-giants`
   - Mechanic: `tap-hotspot` + `compare-strength`.
   - Tap Saturn's rings, Jupiter's storm, Uranus tipped axis.

8. `moons-rings`
   - Mechanic: `orbit-match`.
   - Place one large moon on a moon orbit; place many small chunks into ring lane.

9. `asteroids-comets`
   - Mechanic: `sort-zones`.
   - Drag rocky asteroid / icy comet / asteroid belt clues to correct bins.

10. `whole-system`
   - Mechanic: `order-line`.
   - Arrange Mercury → Neptune.

### World 3 — Deep Space

11. `constellations`
   - Mechanic: `connect-stars`.
   - Trace a simple star pattern, then tap how it helps navigation/season finding.

12. `star-life`
   - Mechanic: `order-line`.
   - Order Nebula → New star → Red giant → Supernova.

13. `nebulae`
   - Mechanic: `tap-hotspot`.
   - Tap gas, dust, and forming stars in a nebula field.

14. `galaxies`
   - Mechanic: `tap-hotspot` or `sort-scale`.
   - Identify Milky Way/home, stars, and billions-of-galaxies scale.

15. `black-holes`
   - Mechanic: `tap-hotspot` / `orbit-match`.
   - Tap evidence: bent light, hot gas, star tug.

### World 4 — The Human Element

16. `life-in-orbit`
   - Mechanic: `orbit-match`.
   - Place the ISS in continuous orbit/free-fall; match lab/exercise tasks.

17. `getting-there`
   - Mechanic: `order-line`.
   - Order launch sequence: thrust → stage drop → orbit → reusable landing.

18. `satellites`
   - Mechanic: `sort-zones` or `orbit-match`.
   - Match GPS/comms/weather to orbit/job signals.

19. `spacewalks`
   - Mechanic: `tap-hotspot`.
   - Tap air, cooling, tether, protection systems.

20. `mars-base`
   - Mechanic: `tap-hotspot` + `sort-zones`.
   - Select habitat/power/rover/air/water systems needed for Mars survival.

## Implementation phases

### Phase 0 — Preserve current fallback

- Keep `quiz` board and `QuizScreen` working.
- Do not remove `content.questions` yet.
- New practice board can coexist station-by-station.

### Phase 1 — Core practice host

Files likely touched:

- `packages/space/engine.capabilities.json`
- `packages/space/src/boardGenerators.js`
- `packages/space/src/boardRegistry.js`
- `packages/space/src/PracticeScreen.jsx` or refactor `QuizScreen.jsx`
- `packages/space/src/App.jsx`
- `scripts/course-check.mjs` or a space-specific practice checker helper

Tasks:

- Add `practice` board kind.
- Add `content.practice` schema.
- Generate steps from authored practice items.
- Make `PracticeScreen` speak step prompts with Luna.
- Preserve existing star scoring/persistence.

### Phase 2 — Build reusable mechanics

Create components under `packages/space/src/practice/`:

- `MoonPositionPractice.jsx`
- `EarthSpinPractice.jsx`
- `TapHotspotPractice.jsx`
- `SortZonesPractice.jsx`
- `OrderLinePractice.jsx`
- `OrbitMatchPractice.jsx`
- `CompareStrengthPractice.jsx`
- `ConnectStarsPractice.jsx`

Also create pure testable helpers:

- `practice/scoring.js`
- `practice/phaseTargets.js`
- `practice/order.js`
- `practice/sortZones.js`

### Phase 3 — World 1 migration and validation

Migrate Backyard Sky first, all 5 stations.

Acceptance criteria:

- `moon-phases` includes the moon-drag full/quarter/crescent mechanic.
- Luna narrates every practice prompt.
- Practice audio clips generated/fresh.
- Fallback multiple-choice not shown for World 1.
- `npm run course:check:space`, `npm run validate`, `cd packages/space && node --test` pass.
- Real-browser walkthrough on phone/desktop.

### Phase 4 — World 2 migration

Migrate all Cosmic Neighborhood stations.

Acceptance criteria:

- Sorting/order/orbit mechanics replace answer tiles.
- World 2 validated and voiced before World 3 begins.

### Phase 5 — World 3 migration

Migrate all Deep Space stations.

Acceptance criteria:

- Constellation tracing works touch-first.
- Star-life ordering works.
- Deep-space scenes use existing cinematic field/body visuals.

### Phase 6 — World 4 migration

Migrate all Human Element stations.

Acceptance criteria:

- Launch sequence and satellite/ISS orbit tasks are touch-friendly.
- Mars base systems practice is interactive, narrated, and voiced.

### Phase 7 — Retire fallback if desired

After all 20 stations have interactive practice:

- Decide whether to keep `quiz` as hidden fallback or remove it from Space.
- Update `engine.capabilities.json` description.
- Consider moving old `content.questions` to review/deck use only.

## UX details

### Practice screen layout

- Header: station title, progress dots, back button.
- Luna bubble: prompt text, replay-audio button.
- Main stage: the interactive mechanic.
- Feedback strip: "Almost — try the far side of Earth" / "Yes! That's Full Moon."
- Continue button appears after correct answer or after feedback animation.

### Attempts and hints

- First wrong attempt: Luna gives a conceptual hint.
- Second wrong attempt: show stronger visual guidance.
- Third wrong attempt: offer "Show me" ghost target, then allow retry.
- Stars can still be based on correctness/attempts:
  - 3 stars: mostly first-try correct.
  - 2 stars: corrected after hints.
  - 1 star: completed with help.

### Accessibility

- All drag tasks need keyboard fallback controls.
- Prompt replay button must be visible.
- Reduced motion should disable continuous animations but keep interaction.
- Targets need ARIA labels.

## Validation and tests

Add tests for:

- practice content schema generation
- prompt/narration equality
- missing/stale practice audio detection
- each scoring helper:
  - angular tolerance for moon phases
  - order correctness
  - sort-zone correctness
  - hotspot id correctness
- station generator returns legal step shapes
- fallback quiz remains valid until removed

## Risks and mitigations

1. **Practice content becomes too custom per station.**  
   Mitigation: small mechanic vocabulary; station content is data, not bespoke code.

2. **Audio generation cost grows.**  
   Mitigation: incremental generation by changed keys; reuse feedback lines where appropriate.

3. **Drag mechanics are hard on small screens.**  
   Mitigation: large targets, snap zones, generous tolerances, keyboard/tap alternatives.

4. **Course schema gets too permissive.**  
   Mitigation: start with generic `target` object, then tighten with per-kind schema once mechanics stabilize.

## First implementation recommendation

Start with World 1 and implement only the mechanics needed there:

1. `moon-position`
2. `earth-spin`
3. `tap-hotspot`
4. `orbit-season`
5. `compare-strength`

This delivers the clearest proof that practice can feel like interaction, especially the Moon Phases example, before migrating the remaining worlds.
