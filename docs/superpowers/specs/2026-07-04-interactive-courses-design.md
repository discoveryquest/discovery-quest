# Interactive Courses — Master Design Spec

*Written 2026-07-04 (Fable session) for implementation across future sessions.
Directive from Pavel: every course should play like a REAL GAME — draggable
pieces, animated blocks, highlighting — not tap-a-choice quizzes. Math is the
flagship. Assumes zero session context; grounded in the actual code as of
branch `space-learnit`.*

**Goal:** upgrade Math, English, and EFL from choice/number-pad answering to
manipulative-first play, on one shared drag-and-drop kit; Space is already
there; Logic Quest (specced separately) builds on the same kit.

---

## 0. Where each course stands today (survey, 2026-07-04)

| Course | Answering today | Interactive assets already in the code |
|---|---|---|
| **Math** | number pad / tap-a-choice (`facts` board) + column algorithm boards (add/sub/mul/div) | `interactiveHints.jsx` (1.1k lines): Numberblocks-style 3D cubes (`cubeFace`), CombineBlocks, TakeAwayBlocks, ArrayModel, ShareGroups, MulTableHint (animated row/col sweep), Pie, ClockFace, Coin — **all hidden behind the 💡 hint tap** |
| **English** | 13 boards (`packages/english/src/boards/`), mostly tap-to-choose; builders (WordBuilder, SentenceBuilder, BlendBuilder, GrammarSort) are tap-to-place | board registry + generators cleanly separated — renderers swappable |
| **EFL** | word cards + sentenceRu board, tap-based | shares english's board patterns |
| **Space** | ✅ already manipulative-first: 6 practice mechanics (drag moon, spin dial, sort zones, order line, connect stars, target tap) | the model to generalize |
| **Logic** | future — specced build-ready in `2026-07-04-logic-quest-design.md` | consumes the shared kit below |

**The big insight for Math:** the game already owns a beautiful manipulative
vocabulary — it's just demoted to hints. The upgrade is to **promote the
manipulatives to the primary answering surface** and make the number pad the
fluency fallback, not the default.

---

## 1. Shared foundation: `engine-ui/interact` kit (build FIRST)

One drag/manipulation kit in `packages/engine-ui/src/interact/`, used by every
course. Space's six mechanics prove the patterns; extract and harden them.

**Components/hooks:**
- `useDragPiece` — pointer-events–based dragging (mouse + touch unified), with:
  scroll-lock while dragging on mobile, spring return on invalid drop,
  `dragConstraints` optional, works inside scrolling pages. Tap-to-select →
  tap-to-place as an automatic alternative on every draggable (small fingers,
  accessibility) — Space's rule, now law.
- `DropSlot` — registers a target region; highlights (pulsing ring) when a
  compatible piece hovers; `onDrop(pieceId)`; snap animation into the slot.
- `PieceTray` — the shelf pieces live on; pieces return here on wrong drop.
- Feedback primitives: `shake()` (wrong), `snapGlow()` (right), `Confetti`
  burst, count-up chime hooks; all respect `useReducedMotion`.
- `BlockCube` / `BlockRod` / `BlockFlat` — the Numberblocks cube language
  (ones = cubes, tens = 10-rods, hundreds = 10×10 flats) lifted from math's
  `cubeFace` so ALL courses share one manipulative look.
- Rules: ≥44px touch targets; framer-motion **11.18.2 only**; SVG rotation via
  native `rotate(deg cx cy)`; every `onCorrect` captured in a ref (the
  timer-cancel bug family); works under the draggable Luna overlay.

**Definition of done for the kit:** Space's SortZones + MoonPosition rebuilt on
it with zero behavior change (the regression proof), verified headless.

---

## 2. Math Quest — the flagship rework

### 2.1 Principle: answer BY doing, numbers as the receipt

Every topic gets a **manipulative mode** where the kid physically constructs
the answer, and the digits appear as a *consequence* of what they built. Bands
map to modes: **band 0-1 = manipulative** (learning), **band 2 = fluency**
(number pad, timed feel) — mastery means graduating from blocks to digits.
Stars/XP unchanged.

### 2.2 Per-topic interactive mechanics

New boards in `packages/math/src/boards/` (topic generators unchanged — same
`generate(band)` problems, new renderers):

- **Counting / bonds / ten-frames** (`blockCount`): drag cubes from a tray into
  a ten-frame; frame cells light as they fill; bond questions show two colored
  cube groups to combine. Answer = the frame state.
- **Addition** (`blockAdd`): two cube groups; kid drags one group onto the
  other; on contact they **merge with the combine animation** (already in
  CombineBlocks) and the sum counts up. Two-digit: when 10 loose cubes gather,
  they **audibly snap into a rod** — regrouping/carrying made physical. This
  snap IS the "carry the 1" lesson.
- **Subtraction** (`blockTake`): the minuend as cubes/rods; kid drags away the
  subtrahend into a "take away" bin; borrowing = tap a rod → it **bursts into
  10 cubes** (animated scatter-and-settle), then keep taking.
- **Long algorithms (add/sub/mul/div columns):** keep the column boards (they
  teach the notation) but add a **live block sidekick panel**: as the kid
  enters each column digit, the corresponding blocks animate (carry → rod
  flies to the tens pile; borrow → rod bursts). Highlight the active column
  with the sweep style from MulTableHint. Column entry stays keypad — the
  animation makes it a game without breaking the algorithm drill.
- **Multiplication concept** (`blockArray`): build the array — drag rows of
  cubes onto a grid ("make 3 rows of 4"); completed array pulses row-by-row
  then column-by-column (the MulTableHint sweep, now the main event) and the
  product pops. Tables fluency (band 2): keypad against the animated grid.
- **Division** (`blockShare`): deal cubes one-by-one (drag or rapid-tap) into
  N plates; leftovers stay in the tray = remainder, visually obvious.
- **Fractions** (`fracBuild`): drag pie slices into a circle / fraction-bar
  segments into a bar to build ¾; equivalence = drag a second bar underneath
  and see the edges align (animated alignment flash); compare = build both,
  the bigger one crowns. Reuses `Pie`/`FracLabel`.
- **Decimals** (`decBuild`): place-value drag — flats=ones, rods=tenths,
  cubes=hundredths into labeled columns; ×/÷ by 10 animates every piece
  sliding one column (the shift IS the lesson).
- **Money** (`coinPay`): a shop scene — price tag on an item (OpenMoji), drag
  coins from a purse onto the pay plate; running total counts up; overpay →
  change comes back animated. Reuses `Coin`.
- **Time** (`clockSet`): drag the clock hands (StateDial pattern from Space —
  spring + native SVG rotate); elapsed time = drag the hand forward and watch
  a day/night arc tint behind the dial (Spin2D's palette).
- **Geometry** (`shapeForge`): symmetry = paint cells on one side of a mirror
  line, the reflection paints itself live; angles = drag a ray around a
  protractor dial; area/perimeter = drag unit squares to tile a rectangle,
  perimeter walks itself with a glowing ant 🐜.

### 2.3 Engine contract (keeps the 43 topic plugins untouched)

Each problem step already carries `prompt/expected/hint/effects`. Add an
optional `manip: { kind, ...props }` descriptor emitted by generators (same
pattern as `interactiveHint`), and QuestScreen routes: `manip` present AND
band < 2 → manipulative board; else facts/column board. Fallback is always the
existing board, so the rollout can go topic-by-topic with zero breakage. The
existing `interactiveHint` stays for band-2 fluency mode (hints keep working).

### 2.4 Math rollout order

1. Kit (§1) → 2. `blockAdd`+`blockTake` (K-2 core, biggest audience) →
3. `blockArray`+`blockShare` → 4. `fracBuild` → 5. `coinPay`+`clockSet` →
6. column-board sidekick animations → 7. `decBuild`+`shapeForge`+ten-frames.
Each phase ships independently (per-topic routing makes this safe).

---

## 3. English Quest — living letters

Upgrade the four builder boards to the kit; keep the pure-knowledge boards
(RuleQuiz etc.) as tap boards — not everything should drag; reading questions
ARE tap questions. What changes:

- **WordBuilder / BlendBuilder** (`tileBuild`): letter/morpheme tiles become
  physical drag tiles with snap slots; on word completion the tiles **bounce
  in sequence as Luna sounds them out** (blend animation), then fuse into the
  whole word with a glow. Wrong tile shakes out.
- **SentenceBuilder** (`sentenceDrag`): drag words into order on a sentence
  line; the sentence **acts itself out** when correct — an OpenMoji mini-scene
  (「The dog runs」→ 🐕 dashes across). A small scene library keyed by
  verb/noun tags in the content; fallback = tile fusion glow when no scene
  matches (content stays authorable).
- **GrammarSort** (`binSort`): drag words into labeled bins (nouns/verbs…);
  bins gulp (squash-and-stretch) on correct feed; a full bin does a roll call,
  highlighting each resident word as Luna reads it.
- **PunctuationChoice** (`markDrop`): drag the mark (?, !, .) from a tray onto
  the sentence-end slot; the sentence re-reads itself with matching Luna
  intonation clip — hear WHY the mark matters. (Voice note: needs per-mark
  narration variants — bake AFTER visual approval, standing rule.)
- **SpellingBee**: keyboard entry stays (spelling is recall) but letters fly
  in as tiles as typed, and the reveal animates missed letters into place.

## 4. EFL — same tiles, translation twist

- `tileBuild` reused directly for word building (shared kit = free).
- **sentenceRu** (`sentenceDrag` variant): Russian prompt on top, drag the
  English words into order below; correct → the same act-it-out mini-scene.
- **PictureMatch** (`pairDrag`): drag the word card onto the picture card;
  matched pairs flip together and orbit off. Memory-game feel.

## 5. Space & Logic

- **Space:** already manipulative-first; adopt the kit under the existing six
  mechanics opportunistically (regression-proof step in §1 covers two). No new
  gameplay work. Delete dead QuizScreen while in there (known cleanup).
- **Logic:** all mechanics in `2026-07-04-logic-quest-design.md` (matchstick,
  shapeCount, riverCross, pourJugs, whichFills, logicGrid, balance) are
  specified to be built ON this kit — build the kit first, Logic second (it's
  the greenfield proving ground), then retrofit Math/English/EFL. OR Math
  first if Pavel prefers flagship impact — see open question below.

---

## 6. Cross-cutting rules

- **Consistency directive** applies: identical QuestHeader/popover/Luna/stars
  across all courses; the kit's feedback (shake/glow/confetti) becomes part of
  that shared language — same win feel everywhere.
- **Narration:** reuse existing prompts wherever possible (no new voice
  needed); any new spoken line goes through gen-voice ONLY after Pavel
  approves visuals on the live screen (memory `verify-visuals-before-baking`).
- **Verification:** every new board gets a headless puppeteer drive (recipes in
  memory `space-cinematic-learnit`) — drag via pointer-event dispatch, assert
  the win state; plus real-device phone check by Pavel before public deploy.
- **Two-repo mirror:** math/english live only in the open repo; space (and any
  engine-ui change!) must be re-copied to platform and redeployed — engine-ui
  kit changes touch BOTH repos every time.
- **Performance floor:** mid-range phone, 60fps during drags — transform-only
  animation, no layout thrash; test with 6× CPU throttle.

## 7. Suggested build order (across sessions)

1. **interact kit** in engine-ui + Space regression proof (small, unblocks all)
2. **Math `blockAdd`/`blockTake`** — Pavel's flagship ask, immediate wow
3. Math phases 3-5 (§2.4) — array/share, fractions, money/time
4. **English builders** on the kit (tileBuild, sentenceDrag, binSort)
5. EFL variants (mostly free after 4)
6. **Logic Quest** scaffold onward (own spec) — or promote earlier if a fresh
   course beats retrofits for motivation
7. Math long-board sidekicks + geometry/decimals; Space kit retrofit; polish

## 8. Open questions for Pavel

1. Build order: Math retrofit first (flagship, §7 as written) or Logic Quest
   first (greenfield, no regression risk, kit matures before touching live
   courses)?
2. Band 2 = keypad fluency mode: agreed that older/mastery play graduates from
   blocks to digits, or should manipulatives stay available at every band
   (toggle button)?
3. Sentence act-it-out scenes (English/EFL): worth the content-tagging cost,
   or ship tile-fusion feedback first and add scenes as delight later?
