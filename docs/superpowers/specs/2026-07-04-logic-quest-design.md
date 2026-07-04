# Logic Quest — Design Spec (creative thinking & puzzles)

*Written 2026-07-04 for a future build session (possibly a different model —
this spec assumes zero session context; every convention is spelled out).*

**Goal:** a Discovery Quest course that trains creative/lateral thinking for
ages 6–10: matchstick puzzles, count-the-shapes, pattern matrices,
riddles/analogies, and grid deduction — many worlds with increasing difficulty.

**Name (APPROVED by Pavel 2026-07-04):** Logic Quest (`logic`, save key
`lq-save`, fly app `discoveryquest-logic`, subdomain
`logic.discoveryquest.app`). Kid-facing brand on the map:
**Logic <span cyan>Quest</span>**.

## 1. Why this shape

Unlike Math/Space, the *subject* here is thinking strategies, not facts. So each
station's **Learn-it lesson teaches a strategy** ("count the small triangles
first, then the ones made of two…", "when you move a match, the number of
matches stays the same — count them!") and the **practice applies it**. Stars
reward flawless application (existing `flawedRef` mechanic: hint used = flawed
mission; clean ≥ total → 3⭐).

## 2. Course structure — 6 worlds × 4 stations to start, open-ended

Pavel's guidance: structure is whatever the content supports — the course can
grow to many worlds (he floated "20 × 5") as long as difficulty keeps ramping.
So: ship the 6-world arc below first, and treat it as the spine of an
**extensible ladder** — new worlds append harder remixes of the same mechanics
(the YAML pipeline makes adding a world pure content work, no code). Worlds are
themed by mechanic family early (kids master one tool at a time) and mix at the
end; difficulty ramps both across stations within a world and across worlds.
`startWorldForAge` gates like Space (older kids start higher).

| # | World | Mechanic focus | Sample stations (each = lesson + 3-5 missions) |
|---|-------|----------------|--------------------------------------------|
| 1 | Matchstick Meadow | `matchstick` | fix a digit (move 1), make the biggest number, fix an equation (6+3=8), two-move equations |
| 2 | Shape Shore | `shapeCount` | count squares in a grid, triangles easy (no overlaps), triangles with composites, hidden rectangles |
| 3 | Pattern Peaks | `patternPick` | what comes next (ABAB…), growing patterns, odd one out, 3×3 matrices (Raven-style) |
| 4 | Riddle Rapids | `riverCross`, `pourJugs`, `whichFills` | ferry the fox/chicken/grain across, measure 4 with a 3-jug and a 5-jug, which cup fills first (animated pipe maze), analogies (A:B :: C:?) |
| 5 | Logic Lagoon | `logicGrid`, `balance` | balance scales (which is heavier, given A>B, B>C), who-owns-what 3×3 deduction, mini-sudoku 4×4 with emoji, true/false detectives |
| 6 | Master Mountain | all, hard | 2-move matchsticks, big composite shape counts, 3×3 matrices hard, mixed gauntlet |

Worlds 1–3 = MVP ship; 4–6 = fast-follow (4 adds the three riddle engines,
5 adds two mechanics, 6 adds none — pure content).

## 3. New practice mechanics (the real work)

All follow the existing pattern: a component in
`packages/logic/src/practice/*.jsx` hosted by PracticeScreen, receiving
`{ scene, target, onCorrect, onFlaw }`. **Capture `onCorrect` in a ref, never in
effect deps** (PracticeScreen re-renders on Luna's `talking` flips and will
cancel pending timers — this bug shipped twice in Space).

### 3.1 `matchstick` — the flagship
Digits rendered as **seven-segment stick layouts** (SVG rounded-cap lines, warm
match color + red tip), operators (+ − =) as 1-2 stick slots. Every segment
position is a *slot*: filled or empty. The learner **drags a filled stick to an
empty slot** (or taps stick → taps slot, for small fingers); a move counter
shows moves left; a reset button restores the start state.

- Validation: segment-state bitmask per digit position → lookup table of the 10
  digits (+ operators). After each move, if all positions decode AND the
  equation is arithmetically true (or the number matches an accepted answer)
  AND moves used ≤ allowed → correct. **Accept every valid solution**, not one
  golden answer — matchstick puzzles famously have alternates. YAML lists
  `accept:` patterns only when the prompt demands a specific outcome ("make the
  biggest number").
- YAML: `scene: { kind: matchstick, start: "6+3=8", moves: 1 }`,
  `target: { valid: equation }` or `target: { accept: ["9"] , goal: largest }`.
- Lesson view kind `matchstick` (non-interactive, `fraction`-scrubbable like
  Space's `spin`): Luna slides one stick from a 6 to make an 8, showing the
  stick count never changes.

### 3.2 `shapeCount` — count the triangles
Figure defined in YAML as **vertices + edges**; all claimable shapes
**precomputed by the author** (list of vertex-id triples/quads) — do not detect
at runtime. Two difficulty variants:

- *Easy (choose)*: kid counts, picks from 4 number choices. On answer, the
  payoff animation highlights each shape one-by-one with a count-up chime —
  this reveal IS the lesson.
- *Hard (claim)*: kid **taps 3 vertices to claim a triangle**; valid claims tint
  and stay (each shape claimable once), invalid shake. Done when all found.
  A progress chip shows `found / total`.
- YAML: `scene: { kind: shapeCount, vertices: [...], edges: [...], shapes: [[a,b,c],...] }`,
  `target: { mode: choose|claim, count: 9 }`.

### 3.3 `patternPick` — sequences, matrices, odd-one-out
A prompt row (sequence with a `?`, or 3×3 matrix with one empty cell, or a set
with one impostor) + 3-4 answer tiles. Tiles and cells are **emoji or tiny
inline SVG motifs** (rotations/counts of shapes — needed for Raven-style items,
which emoji can't express). Tap a tile → it flies into the `?` slot → check.
This is close enough to quiz that it could extend the quiz board, but the visual
grid prompt earns its own mechanic.
- YAML: `scene: { kind: patternPick, grid: [[...],[...],[...]] | sequence: [...] , choices: [...] }`,
  `target: { answer: <choice id> }`.

### 3.4 Riddle mechanics (world 4) — interactive, animated, touch + mouse
Pavel's requirement (2026-07-04): riddles must NOT be static picture
multiple-choice — they are **manipulable animated scenes**, working equally on
phone (tap/drag) and desktop. Three classic-riddle engines:

- `riverCross`: the fox/chicken/grain family. Emoji characters on a river bank,
  a boat that holds the farmer + one passenger; tap a character to load, tap GO
  to row across (spring-animated boat + bobbing water). Forbidden pairs left
  alone trigger a playful fail animation (🦊 chases 🐔) and reset the trip —
  the fail IS the feedback. YAML: `scene: { kind: riverCross, cast: [...],
  boatSeats: 1, forbidden: [[fox,chicken],[chicken,grain]] }`,
  `target: { allAcross: true }`. Variants rethemed (🐺🐐🥬, aliens…) and scaled
  (2-seat boats, 4 characters) for harder worlds.
- `pourJugs`: water-measuring riddles. 2-3 jugs with animated fill levels
  (liquid wobble on pour); tap source jug → tap destination to pour (fills to
  capacity or empties source); tap the tap 🚰 to refill, drain to empty.
  Move counter optional. `target: { amount: 4 }` in any jug.
- `whichFills`: an animated pipe/cup maze — water pours from the top through
  branching pipes, some secretly blocked; kid predicts which cup fills first by
  tapping it, THEN the water animates down and proves it. Wrong guess still
  gets the full animation (the payoff teaches), then retry on a sibling puzzle.
  YAML declares the pipe graph + blocked edges; the renderer animates flow
  along it.

All three obey standard touch rules: tap-to-select (no precision dragging
required), ≥44px touch targets, works with the draggable Luna overlay.

### 3.5 `logicGrid` + `balance` (world 5, fast-follow)
- `logicGrid`: 3×3 board, clue list read by Luna one at a time, drag emoji from
  a tray into cells; check button validates against the unique solution.
- `balance`: a see-saw scale (spring-animated tilt); given pictured
  inequalities, tap the heaviest item, or place weights to balance.

## 4. What's reused verbatim (do NOT rebuild)

- App shell: copy `packages/space/src/App.jsx` shape — ProfileSetup/Picker gate
  (avatars e.g. 🦊🦉🤖🧠🔍🧩⭐🎩, submit label "Let's puzzle! 🧩"), MapScreen with
  QuestHeader + HeroBadge + Parents chip + settings + `onSwitchPlayer`,
  StationPopover ("📖 Learn it" / Play), CourseLesson with `onClose` +
  autoAdvance, PracticeScreen host (Done ✓ button, draggable corner Luna, stars
  via `flawedRef`, tutorial modal OFF until recorded).
- Course pipeline: `logic.course.yml` validated by a new
  `npm run course:check:logic`; `engine.capabilities.json` for the new kinds
  (write it — authoring models depend on it); narration keys per prompt
  (`say` must equal `prompt` text), baked with gen-voice/Jessica **only after
  Pavel approves visuals** (standing rule).
- Music: 2-3 loops per world family reusing the voice-kit music player (ducks
  under Luna for free, iOS-safe).
- Map art: TrailMap works art-less (dashed zigzag) from day one; painted
  per-world panels + `TRAIL_X` tuning later, same as Space.

## 5. Visual direction

Warm workshop-at-night vibe to contrast Space's deep blue: aubergine→amber
gradient shell, matchsticks with glowing tips, chalk-on-slate figures for
shapeCount. **Luna stays byte-identical to every other course** (Pavel's call —
no per-course accessories; do not fork LunaOwl). Keep all typography/buttons
identical to other courses (consistency directive).

## 6. Build plan (phases, each independently shippable)

1. **Scaffold** — `packages/logic` + `apps/logic-quest` (copy Space's platform
   app), YAML with worlds 1-3 skeleton, quiz-only placeholder boards, deploy to
   fly behind no links. *Proves the pipeline.*
2. **Matchstick** — mechanic + lesson view + world 1 content, headless-verified
   (puppeteer recipe in memory `space-cinematic-learnit`).
3. **ShapeCount** — both variants + world 2 content.
4. **PatternPick** — + world 3 content. → **MVP review with Pavel on live
   visuals**, then bake voice, then public: landing card + subdomain.
5. **Worlds 4-6** — riddles content, logicGrid + balance, Master Mountain.

## 7. Decisions (answered by Pavel 2026-07-04 — spec is build-ready)

1. **Name:** Logic Quest. ✅
2. **Structure:** flexible — whatever the content supports; grow past 6 worlds
   freely (even 20×5) as long as difficulty keeps climbing. Ship the 6-world
   spine first.
3. **Luna:** identical across all courses, no accessories.
4. **Riddles:** not picture-only MCQ — real interactive animated scenes
   (riverCross / pourJugs / whichFills, §3.4), first-class on both mobile and
   desktop.
