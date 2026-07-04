# Interact Kit + Math Block Boards — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development
> (if subagents available) or superpowers:executing-plans to implement this
> plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** build the shared `engine-ui/interact` drag kit, prove it by rebuilding
one Space mechanic on it with zero behavior change, then ship Math's first two
manipulative boards (`blockAdd`, `blockTake`) where kids answer by dragging
Numberblocks-style cubes — regrouping (carry) and borrowing made physical.

**Spec:** `docs/superpowers/specs/2026-07-04-interactive-courses-design.md`
(§1, §2 — read it first; decisions in §8 are final).

**Architecture:** kit = pointer-events drag core + slot registry + feedback
primitives + shared block visuals, exported from `@discoveryquest/engine-ui`.
Math boards consume the kit; topic generators gain an optional `manip`
descriptor; QuestScreen routes `manip && band < 2` → manipulative board, else
the existing board (zero-risk incremental rollout).

**Tech stack:** React 18, framer-motion **11.18.2 (pinned — never 12)**,
Tailwind, no new dependencies. No unit-test runner exists in this repo —
verification is headless puppeteer drives (recipes below) + real builds.

---

## Ground rules (violating any of these has bitten us before)

- Branch a **new git worktree** off `space-learnit` (it has the newest
  engine-ui + space): `git worktree add ../.worktrees/interactive-math -b interactive-math space-learnit`
  (run from the main checkout `/Users/pavel/dev/discoveryquest`).
- **`onCorrect`/`onDone` callbacks → refs, never effect deps** (parent
  re-renders on Luna's `talking` flips cancel pending timers). See
  `packages/space/src/practice/StateDialPractice.jsx` for the canonical pattern.
- Drag = **pointer events** (`onPointerDown/Move/Up` + `setPointerCapture`),
  not mouse/touch pairs; `touch-action: none` on draggables (scroll-lock);
  every draggable also supports **tap-to-select → tap-to-place**.
- Animate transforms/opacity only; ≥44px touch targets; respect
  `useReducedMotion`.
- Headless verify recipe: puppeteer-core at
  `platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`,
  Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`;
  more recipes in memory `space-cinematic-learnit`. Drag headlessly by
  dispatching `pointerdown/pointermove/pointerup` with coordinates.
- Do NOT bake any new voice lines; reuse existing prompts/say keys. New spoken
  text (if unavoidable) waits for Pavel's visual approval.
- Commit after every task; do not deploy — deploy + platform mirror is a
  separate final task gated on Pavel's review.

## Task 1: Worktree + skeleton

**Files:** create `packages/engine-ui/src/interact/` (empty dir), add exports.

- [ ] Create the worktree (command above); `npm install` at its root.
- [ ] Add to `packages/engine-ui/package.json` exports:
      `"./interact": "./src/interact/index.js"`.
- [ ] Commit: `chore: scaffold engine-ui interact kit`.

## Task 2: Drag core — `useDragPiece` + `DropSlot` + `InteractBoard`

**Files:** create `packages/engine-ui/src/interact/dragCore.jsx`,
`packages/engine-ui/src/interact/index.js`.

Contract (design it exactly like this; internals are yours):

```jsx
// <InteractBoard onDrop={(pieceId, slotId) => boolean}> — context provider that
// owns the slot registry (Map<slotId, {ref, accepts}>) and the selected-piece
// state for tap-to-place. Returns true from onDrop = accepted (piece snaps
// into slot); false = rejected (piece springs home + shake).
// <DragPiece id data> — wraps any child; pointer-capture drag, spring return,
//   tap toggles selected (ring highlight). While dragging: scale 1.08, z-30,
//   shadow; touch-action none.
// <DropSlot id accepts={(data) => bool}> — wraps a region; pulsing ring while
//   a compatible piece hovers or is selected; tap while a piece is selected =
//   place attempt. Hit-testing: on pointerup, elementFromPoint against
//   registered slot rects (getBoundingClientRect at drop time, NOT cached).
```

- [ ] Implement `dragCore.jsx` (one file: InteractBoard, DragPiece, DropSlot —
      they share module-level context). Use framer-motion `useSpring` for the
      return-home animation; positions via `transform` only.
- [ ] Implement `index.js` barrel re-exporting everything in the kit.
- [ ] Build check: `npm run build -w @discoveryquest/space-quest` equivalent —
      in this repo the fastest full check is starting the space dev server and
      loading the map (`npm run dev` at root, open http://localhost:5173).
      Expected: no build errors (kit is not imported anywhere yet — this only
      proves syntax/exports).
- [ ] Commit: `feat(engine-ui): interact kit drag core`.

## Task 3: Feedback + block visuals

**Files:** create `packages/engine-ui/src/interact/feedback.jsx`,
`packages/engine-ui/src/interact/blocks.jsx`.

- [ ] `feedback.jsx`: `useShake()` (x-axis keyframe shake, returns
      [controlsProps, trigger]), `SnapGlow` (one-shot expanding ring on
      correct), `ConfettiBurst` (~20 absolutely-positioned emoji/rect particles,
      transform-only, self-removes; skips under `useReducedMotion`).
- [ ] `blocks.jsx`: lift the cube look from
      `packages/math/src/interactiveHints.jsx` (`cubeFace(color)` — inset
      top-highlight/bottom-shadow/glow). Export `BlockCube({color, size=26})`,
      `BlockRod({color})` (10 fused cubes, one piece), `BlockFlat({color})`
      (10×10, for later), `BlockGroup({n, color})` — renders n as
      rods-plus-cubes. Keep DOM (divs), not SVG — matches interactiveHints.
- [ ] In `packages/math/src/interactiveHints.jsx`, re-import `cubeFace` from
      the kit instead of defining it locally (one source of truth). Verify the
      math app still renders a hint: run dev server, open math app, trigger a
      💡 hint on an addition problem.
- [ ] Commit: `feat(engine-ui): interact feedback + shared block visuals`.

## Task 4: Regression proof — rebuild Space's SortZones on the kit

**Files:** modify `packages/space/src/practice/SortZonesPractice.jsx`.

- [ ] Rebuild its drag/drop internals on `InteractBoard/DragPiece/DropSlot`,
      preserving EXACT behavior: same zones, same accept logic, same
      correct/hint flow, `onCorrect` still via ref.
- [ ] Headless-verify the sort-zones station end-to-end (existing recipe:
      match zones by hint text, seed `sq-save` AFTER profile creation, reload).
      Expected: mission completes, stars screen reached.
- [ ] Commit: `refactor(space): SortZones on engine-ui interact kit (regression proof)`.

## Task 5: Math routing — the `manip` descriptor

**Files:** modify `packages/math/src/QuestScreen.jsx` (read it FIRST — find
where `boardKind` picks the board component), `packages/math/src/engine-facts.js`.

- [ ] In the addition/subtraction fact generators (`genBonds`, `genFact` for
      add/sub — read `engine-facts.js` to find the right emit points), attach
      `manip: { kind: 'blockAdd', a, b }` / `{ kind: 'blockTake', a, b }` to
      steps when band < 2. Numbers stay ≤ 20 at band 0, ≤ 99 at band 1 (rods
      appear at band 1).
- [ ] In QuestScreen: if the current step has `step.manip` AND a renderer
      exists in a new `MANIP_BOARDS` map → render it INSTEAD of the keypad
      row for that step; on `onCorrect` from the board, feed the engine the
      same answer submission path the keypad uses (find and reuse it — do not
      fork scoring/stars/XP logic). No `manip` or band 2 → unchanged.
- [ ] Verify: dev server, math app, play a counting station — behaves exactly
      as before (no manip renderer registered yet for it).
- [ ] Commit: `feat(math): manip descriptor routing (no-op until boards land)`.

## Task 6: `BlockAdd` board

**Files:** create `packages/math/src/boards/BlockAdd.jsx`; register in
QuestScreen's `MANIP_BOARDS`.

Gameplay: left group = `a` blocks (amber), right tray = `b` blocks (cyan).
Kid drags/taps the tray blocks onto the build zone; each arrival merges with a
squash-bounce and the running total chip counts up. **When 10 loose cubes are
in the zone, they magnet together and snap into a rod** (spring-cluster then
fuse, with SnapGlow + a soft click) — this snap IS carrying. When the zone
holds `a+b`, auto-submit the answer through the Task-5 path; wrong is
impossible by construction, so the challenge is band-tuned by count/size and
the star cost of the 💡 hint stays as-is.

- [ ] Implement (blocks via kit `BlockGroup`/`BlockCube`, drag via kit).
- [ ] Headless drive: complete one band-0 addition mission via dispatched
      pointer events; assert the answer submitted and the next step loaded.
- [ ] Real check: load on desktop + phone-sized viewport (390×844), confirm
      60fps-feel and no scroll-fighting.
- [ ] Commit: `feat(math): BlockAdd manipulative board (regrouping snap)`.

## Task 7: `BlockTake` board

**Files:** create `packages/math/src/boards/BlockTake.jsx`; register it.

Gameplay: minuend as rods+cubes in the zone; a "take away" bin (🕳️ or crate)
below. Kid drags `b` blocks into the bin (they tumble in). **Borrowing: if no
loose cubes remain but rods do, tapping/dragging a rod bursts it into 10 cubes**
(scatter-and-settle animation) — then keep taking. Zone ends holding `a-b`;
auto-submit as in Task 6.

- [ ] Implement; the burst is the critical animation — cubes fly out on
      springs to a loose-pile grid, ~400ms, reduced-motion = instant swap.
- [ ] Headless drive one band-1 subtraction WITH a borrow (e.g. 42−17);
      assert rod-burst happened (cube count in DOM) and answer submitted.
- [ ] Commit: `feat(math): BlockTake manipulative board (borrow burst)`.

## Task 8: Wrap-up

- [ ] Full pass on a phone viewport headlessly: one station of each of
      counting/add/sub at bands 0-2; band 2 must show the CLASSIC keypad board
      (graduation rule, Pavel decision #2).
- [ ] Update `docs/superpowers/specs/2026-07-04-interactive-courses-design.md`
      §7 checklist-style with what shipped; note follow-ups discovered.
- [ ] Push branch. **STOP — do not merge, deploy, or mirror to platform.**
      Pavel reviews the visuals live first (standing rule); platform mirror of
      engine-ui changes happens at deploy time.

## Out of scope for this plan
Everything past §2.4 phase 2 of the spec: arrays/share, fractions, money/time,
column sidekicks, English/EFL boards, Logic Quest, tutorials, voice.
