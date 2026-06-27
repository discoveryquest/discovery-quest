# Space Quest Cinematic Learn-it Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Space Quest's static emoji "Learn it" with cinematic, animated, interactive lessons (~5 beats + an explore beat per station), all dubbed in Jessica's voice, built on a renderer-agnostic scene system that can swap to 3D later.

**Architecture:** A beat's `view` becomes a *semantic scene descriptor*. A `<Scene>` dispatcher resolves `(mode, kind)` against a `SCENE_RENDERERS` registry (2D now, 3D droppable later via one constant, with per-kind fallback to 2D). Pure logic (registry resolution, orbit geometry, scrub stepping, voice-job building) is TDD'd with `node --test`; the JSX scene components are verified by running the space-preview dev server. Lessons stay authored in `space.course.yml`; a new `gen-voice.mjs` generates all Jessica clips.

**Tech Stack:** React 19, framer-motion, Vite (space-preview dev shell), `@discoveryquest/voice-kit` (ElevenLabs MP3 playback), `js-yaml`, `node --test`, ElevenLabs TTS API.

**Spec:** `docs/superpowers/specs/2026-06-27-space-learnit-cinematic-design.md`

**Worktree:** `/Users/pavel/dev/discoveryquest/.worktrees/space-learnit` (branch `space-learnit`). All paths below are relative to it. Run package tests from `packages/space` (`node --test`); run course tooling from the repo root.

---

## File Structure

**Create:**
- `packages/space/src/scenes/registry.js` — **pure** (no JSX imports): `SCENE_MODE` constant + `resolveRenderer(registry, mode, kind)` (2D fallback). Safe to import from `node --test`.
- `packages/space/src/scenes/renderers.jsx` — the `SCENE_RENDERERS` map (imports the 2D components). JSX, so **never** imported by a `.test.mjs`.
- `packages/space/src/scenes/geometry.js` — pure scene math (orbit positions, ring/tilt, phase mask).
- `packages/space/src/scenes/scrub.js` — pure interactive-state math (clamp, fraction→index).
- `packages/space/src/scenes/voiceJobs.js` — pure `buildVoiceJobs(course)` (dedupe narration → job list).
- `packages/space/src/scenes/Scene.jsx` — dispatcher component.
- `packages/space/src/scenes/2d/base.jsx` — shared cinematic backdrop (`<SpaceStage>` + `<Starfield>`).
- `packages/space/src/scenes/2d/Fact2D.jsx`, `Body2D.jsx`, `Orbit2D.jsx`, `Field2D.jsx`, `Launch2D.jsx`, `Compare2D.jsx`, `Scrub2D.jsx`, `Reveal2D.jsx`.
- `packages/space/src/scenes/scenes.test.mjs` — tests for registry/geometry/scrub/voiceJobs.
- `packages/space/scripts/gen-voice.mjs` — Jessica clip generator.

**Modify:**
- `packages/space/src/lessons/views.jsx` — becomes a thin shim returning `<Scene>`.
- `packages/space/space.course.yml` — rewrite the 20 lessons + extend `narration:`.
- `packages/space/engine.capabilities.json` — add new view kinds + fields.
- `packages/space/course.schema.json` — regenerated (do not hand-edit).
- `package.json` (root) — add `voice:space` script.

**Leave alone:** `src/scene/` (singular, dormant 3D scaffold), `LessonScreen.jsx`, `CourseLesson.jsx`, quiz/board/TrailMap code.

---

## Phase 1 — Scene Kit foundation (pure-logic TDD)

### Task 1: Renderer registry + resolution

**Files:**
- Create: `packages/space/src/scenes/registry.js`
- Test: `packages/space/src/scenes/scenes.test.mjs`

- [ ] **Step 1: Write the failing test** (append to a new `scenes.test.mjs`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRenderer } from './registry.js';

const A2D = () => '2d-orbit';
const A3D = () => '3d-orbit';
const B2D = () => '2d-body';
const REG = { '2d': { orbit: A2D, body: B2D }, '3d': { orbit: A3D } };

test('resolves the renderer for the requested mode+kind', () => {
  assert.equal(resolveRenderer(REG, '3d', 'orbit'), A3D);
});
test('falls back to 2d when the mode lacks the kind', () => {
  assert.equal(resolveRenderer(REG, '3d', 'body'), B2D); // no 3d body → 2d body
});
test('falls back to 2d when the mode is unknown', () => {
  assert.equal(resolveRenderer(REG, 'vr', 'orbit'), A2D);
});
test('returns null for an unknown kind (caller renders nothing)', () => {
  assert.equal(resolveRenderer(REG, '2d', 'nope'), null);
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd packages/space && node --test src/scenes/scenes.test.mjs`
Expected: FAIL — `Cannot find module './registry.js'`.

- [ ] **Step 3: Implement `registry.js`** — **pure only.** The component map lives in a
  separate `.jsx` file (Task 14) so this module stays JSX-free and importable by `node --test`.

```js
// Scene renderer resolution (pure — no JSX, so node --test can import it). A beat's `view`
// (a semantic scene descriptor) is rendered by SCENE_RENDERERS[mode][kind] (the map lives in
// renderers.jsx). `mode` is a single constant today; swapping the whole course to 3D is
// editing SCENE_MODE, and a missing (mode,kind) falls back to 2d so a partial 3D rollout
// never breaks a lesson.
export const SCENE_MODE = '2d';

// Returns a component or null. registry shape: { mode: { kind: Component } }.
export function resolveRenderer(registry, mode, kind) {
  return registry[mode]?.[kind] ?? registry['2d']?.[kind] ?? null;
}
```

> Do NOT add a `SCENE_RENDERERS` export here — it would force a JSX import and break every
> `scenes.test.mjs` test. It lives in `renderers.jsx` (Task 14).

- [ ] **Step 4: Run tests, verify pass**

Run: `cd packages/space && node --test src/scenes/scenes.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/space/src/scenes/registry.js packages/space/src/scenes/scenes.test.mjs
git commit -m "feat(space): scene renderer registry + resolveRenderer (2d fallback)

Claude-Session: https://claude.ai/code/session_01UuNPTjgu6qHRcfjKrtqiQu"
```

### Task 2: Orbit/geometry math

**Files:**
- Create: `packages/space/src/scenes/geometry.js`
- Test: `packages/space/src/scenes/scenes.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

```js
import { orbitPosition, phaseMaskShift } from './geometry.js';

test('orbitPosition: angle 0 is to the right of center', () => {
  const p = orbitPosition({ cx: 100, cy: 100, radius: 50, angleDeg: 0 });
  assert.equal(Math.round(p.x), 150);
  assert.equal(Math.round(p.y), 100);
});
test('orbitPosition: angle 90 is below center (SVG y grows down)', () => {
  const p = orbitPosition({ cx: 100, cy: 100, radius: 50, angleDeg: 90 });
  assert.equal(Math.round(p.x), 100);
  assert.equal(Math.round(p.y), 150);
});
test('phaseMaskShift maps fraction 0→full-left, 0.5→centered, 1→full-right', () => {
  assert.equal(phaseMaskShift(0, 56), -56);
  assert.equal(phaseMaskShift(0.5, 56), 0);
  assert.equal(phaseMaskShift(1, 56), 56);
});
```

- [ ] **Step 2: Run, verify fail** (`Cannot find module './geometry.js'`).

- [ ] **Step 3: Implement `geometry.js`**

```js
// Pure scene math shared by the 2D (and future 3D) renderers — no React, unit-tested.
const RAD = Math.PI / 180;

// Position of a body on a circular orbit. angleDeg 0 = +x (right); +y is down (SVG/CSS).
export function orbitPosition({ cx, cy, radius, angleDeg }) {
  return { x: cx + radius * Math.cos(angleDeg * RAD), y: cy + radius * Math.sin(angleDeg * RAD) };
}

// Horizontal shift (px) of a moon's shadow mask for a phase fraction 0..1 across a body of
// width `w`. 0 = shadow fully left (new→ we choose lit on right), 0.5 = centered, 1 = right.
export function phaseMaskShift(fraction, w) {
  return (fraction - 0.5) * 2 * (w / 2);
}
```

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** (`feat(space): orbit + phase geometry helpers`).

### Task 3: Scrub (interactive state) math

**Files:**
- Create: `packages/space/src/scenes/scrub.js`
- Test: `packages/space/src/scenes/scenes.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

```js
import { clampIndex, indexFromFraction, fractionFromIndex } from './scrub.js';

test('clampIndex keeps index within [0, n-1]', () => {
  assert.equal(clampIndex(-2, 4), 0);
  assert.equal(clampIndex(9, 4), 3);
  assert.equal(clampIndex(2, 4), 2);
});
test('indexFromFraction buckets a 0..1 drag across n states', () => {
  assert.equal(indexFromFraction(0, 3), 0);
  assert.equal(indexFromFraction(0.5, 3), 1);
  assert.equal(indexFromFraction(1, 3), 2);
});
test('fractionFromIndex is the inverse midpoint of a bucket', () => {
  assert.equal(fractionFromIndex(0, 3), 0);
  assert.equal(fractionFromIndex(2, 3), 1);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `scrub.js`**

```js
// Pure math for the interactive `scrub` scene (drag through N ordered states). No React.
export const clampIndex = (i, n) => Math.max(0, Math.min(n - 1, Math.round(i)));

// Map a 0..1 drag fraction to a state index (even buckets, endpoints inclusive).
export const indexFromFraction = (f, n) => clampIndex(Math.round(Math.max(0, Math.min(1, f)) * (n - 1)), n);

// Position (0..1) of a state index's handle.
export const fractionFromIndex = (i, n) => (n <= 1 ? 0 : clampIndex(i, n) / (n - 1));
```

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** (`feat(space): scrub interactive-state math`).

---

## Phase 2 — 2D scene components (verified via dev server)

> These are presentational JSX. There is no render-test harness, so each task's verification
> is: it imports without error (covered by Task 14's registry test importing the module) and
> renders correctly in the dev server (Task 17 / Phase 5 checkpoints). Keep each component
> small and consuming the Phase-1 pure helpers. All scenes render inside `<SpaceStage>`.

### Task 4: Cinematic base (`base.jsx`)

**Files:** Create `packages/space/src/scenes/2d/base.jsx`

- [ ] **Step 1: Implement** the shared backdrop + starfield. Style direction C (approved): dark radial space gradient, drifting star particles, soft glow. Honor `useReducedMotion` (no drift, static stars).

```jsx
// Shared cinematic backdrop for every 2D scene (visual direction "C"). SpaceStage fills the
// LessonScreen stage (min-h 250px) with a dark space gradient + a drifting starfield; scenes
// render their bodies on top. Honors reduced-motion (static stars, no drift).
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Starfield({ count = 26 }) {
  const reduce = useReducedMotion();
  const stars = useMemo(
    () => Array.from({ length: count }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      size: 1 + Math.random() * 2, delay: Math.random() * 5, dur: 3 + Math.random() * 4,
    })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.span key={i} className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
          animate={reduce ? { opacity: 0.6 } : { opacity: [0, 0.85, 0], y: [-4, 6] }}
          transition={reduce ? {} : { repeat: Infinity, duration: s.dur, delay: s.delay }} />
      ))}
    </div>
  );
}

export function SpaceStage({ children, tint }) {
  const bg = tint === 'nebula'
    ? 'radial-gradient(120% 90% at 60% 35%, #2a1147 0%, #120a26 55%, #06060e 100%)'
    : 'radial-gradient(120% 90% at 70% 30%, #1a1140 0%, #0a0a18 55%, #05060d 100%)';
  return (
    <div className="relative h-[230px] w-full overflow-hidden rounded-2xl" style={{ background: bg }}>
      <Starfield />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit** (`feat(space): cinematic SpaceStage + Starfield base`).

### Task 5: `Scene.jsx` dispatcher

**Files:** Create `packages/space/src/scenes/Scene.jsx`

- [ ] **Step 1: Implement**

```jsx
// Dispatcher: turn a semantic scene descriptor (a beat's `view`) into a node by looking up
// SCENE_RENDERERS[mode][kind] (2d fallback). Content-agnostic; renderers read the descriptor.
// Pure resolution comes from registry.js; the JSX component map from renderers.jsx.
import { SCENE_MODE, resolveRenderer } from './registry.js';
import { SCENE_RENDERERS } from './renderers.jsx';

export default function Scene({ descriptor, mode = SCENE_MODE }) {
  if (!descriptor) return null;
  const Renderer = resolveRenderer(SCENE_RENDERERS, mode, descriptor.kind);
  return Renderer ? <Renderer {...descriptor} /> : null;
}
```

> `renderers.jsx` doesn't exist until Task 14. Either do Task 14 before Task 5, or add a
> temporary `export const SCENE_RENDERERS = { '2d': {} };` stub in `renderers.jsx` now and
> fill it in Task 14. (Stubbing keeps `fact` blank until Task 6/14 — fine, nothing renders
> it yet.)

- [ ] **Step 2: Commit** (`feat(space): Scene dispatcher`).

### Task 6: `Fact2D` (legacy emoji card, re-homed)

**Files:** Create `packages/space/src/scenes/2d/Fact2D.jsx`

- [ ] **Step 1: Implement** — port the existing `fact` rendering from `lessons/views.jsx` (big emoji + caption) onto `SpaceStage` so old beats keep working during migration.

```jsx
import Emoji from '@discoveryquest/engine-ui/Emoji';
import { SpaceStage } from './base.jsx';

export default function Fact2D({ emoji, text }) {
  return (
    <SpaceStage>
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <span className="text-7xl leading-none drop-shadow-[0_0_18px_rgba(120,180,255,.5)]"><Emoji char={emoji} /></span>
        <p className="max-w-[440px] text-xl font-bold leading-relaxed text-slate-100">{text}</p>
      </div>
    </SpaceStage>
  );
}
```

- [ ] **Step 2: Commit** (`feat(space): Fact2D legacy card on cinematic stage`).

### Task 7: `Body2D`

**Files:** Create `packages/space/src/scenes/2d/Body2D.jsx`

Descriptor fields: `{ body: { role, color?, rings?, tilt?, glow? }, label?, caption? }` (or top-level `role`, `rings`, etc. — pick one shape and mirror it in the capabilities catalog in Task 16). Render one glowing gradient sphere via CSS radial-gradient + box-shadow glow; `rings` → an inclined ellipse; `tilt` → rotate; optional `label`.

- [ ] **Step 1: Implement** a single configurable glowing body on `SpaceStage` (gradient by `role`/`color`, `box-shadow` bloom, optional ring `<div>`/SVG ellipse, optional axis-tilt). Honor `useReducedMotion` (no idle bobbing).
- [ ] **Step 2: Commit** (`feat(space): Body2D glowing celestial body`).

### Task 8: `Orbit2D`

**Files:** Create `packages/space/src/scenes/2d/Orbit2D.jsx`

Descriptor: `{ bodies: [{ id, role, orbits?, radius?, period?, phaseLit? }] }`. Central body = the one with no `orbits`. Render dashed orbit paths; animate orbiting bodies with framer-motion rotation (period in seconds). Use `orbitPosition` (Task 2) for static/reduced-motion placement; a `phaseLit` moon shows a shadow mask using `phaseMaskShift`.

- [ ] **Step 1: Implement** using `geometry.js`. Reduced-motion: place bodies at a representative angle, no rotation.
- [ ] **Step 2: Commit** (`feat(space): Orbit2D central + orbiting bodies`).

### Task 9: `Field2D`

**Files:** Create `packages/space/src/scenes/2d/Field2D.jsx`

Descriptor: `{ tint?, density?, label? }`. A denser, tintable particle cloud (nebula/galaxy/deep-space) layered over `SpaceStage` (pass `tint` to it); optional spiral arrangement for galaxies. Reduced-motion: static.

- [ ] **Step 1: Implement.** [ ] **Step 2: Commit** (`feat(space): Field2D nebula/galaxy particle cloud`).

### Task 10: `Launch2D`

**Files:** Create `packages/space/src/scenes/2d/Launch2D.jsx`

Descriptor: `{ payload? }`. A rocket rising with an animated thrust plume + parallax stars. Reduced-motion: rocket shown mid-flight, no loop.

- [ ] **Step 1: Implement.** [ ] **Step 2: Commit** (`feat(space): Launch2D rocket animation`).

### Task 11: `Compare2D`

**Files:** Create `packages/space/src/scenes/2d/Compare2D.jsx`

Descriptor: `{ items: [{ label, relSize, color? }] }`. Two+ bodies side by side scaled by `relSize` to show scale; size labels. Reduced-motion: static (it already is).

- [ ] **Step 1: Implement.** [ ] **Step 2: Commit** (`feat(space): Compare2D size comparison`).

### Task 12: `Scrub2D` (interactive)

**Files:** Create `packages/space/src/scenes/2d/Scrub2D.jsx`

Descriptor: `{ base?, states: [{ id, label, say, caption }] }`. A draggable handle / range input drives the current state index (`indexFromFraction`/`clampIndex` from `scrub.js`). On state change: show the state's label + caption and call `speak(state.say, { important: true })` from `@discoveryquest/voice-kit/audio`. If `base` is present, render that scene kind via `<Scene descriptor={base}/>` underneath and reflect the state (e.g. phase) into it.

- [ ] **Step 1: Implement.** Use a native `<input type="range">` for accessibility plus a styled handle; debounce `speak` so dragging doesn't spam clips (only speak when the *index* changes). Honor reduced-motion for any transitions.
- [ ] **Step 2: Commit** (`feat(space): Scrub2D interactive draggable states`).

### Task 13: `Reveal2D` (interactive)

**Files:** Create `packages/space/src/scenes/2d/Reveal2D.jsx`

Descriptor: `{ base?, hotspots: [{ id, label, say, caption, x?, y? }] }`. Render tappable hotspot buttons (positioned by `x`/`y` percentages, or auto-laid-out) over an optional `base` scene. Tapping a hotspot reveals its `label`+`caption` and calls `speak(hotspot.say, { important: true })`. Track revealed set in state.

- [ ] **Step 1: Implement.** Buttons are real `<button>`s (keyboard-accessible).
- [ ] **Step 2: Commit** (`feat(space): Reveal2D interactive tap-to-reveal`).

### Task 14: Register all 2D renderers (`renderers.jsx`)

**Files:** Create `packages/space/src/scenes/renderers.jsx`

> This file imports `.jsx` components, so it is **JSX** and must NOT be imported by any
> `.test.mjs` (`node --test` can't transform JSX). There is no render-test harness, so
> "every kind is registered + renders" is verified in the dev server (Phase 5), not by a unit
> test. `scenes.test.mjs` only ever imports the pure modules (`registry.js`, `geometry.js`,
> `scrub.js`, `voiceJobs.js`).

- [ ] **Step 1: Implement** `renderers.jsx` — import the components and build `SCENE_RENDERERS['2d']`.

```jsx
import Fact2D from './2d/Fact2D.jsx';
import Body2D from './2d/Body2D.jsx';
import Orbit2D from './2d/Orbit2D.jsx';
import Field2D from './2d/Field2D.jsx';
import Launch2D from './2d/Launch2D.jsx';
import Compare2D from './2d/Compare2D.jsx';
import Scrub2D from './2d/Scrub2D.jsx';
import Reveal2D from './2d/Reveal2D.jsx';

// SCENE_RENDERERS[mode][kind] → component. 3D renderers register their own mode key later.
export const SCENE_RENDERERS = {
  '2d': { fact: Fact2D, body: Body2D, orbit: Orbit2D, field: Field2D, launch: Launch2D, compare: Compare2D, scrub: Scrub2D, reveal: Reveal2D },
};
```

- [ ] **Step 2: Sanity-check the wiring without JSX** — confirm `resolveRenderer` finds each
  kind, by reading the file (no test). The real proof is Phase 5's dev-server walkthrough.
- [ ] **Step 3: Run pure tests** `cd packages/space && node --test` → still green (no JSX leaked into `.test.mjs`).
- [ ] **Step 4: Commit** (`feat(space): register all 2d scene renderers`).

---

## Phase 3 — Integrate scenes into lessons

### Task 15: `views.jsx` shim → `<Scene>`

**Files:** Modify `packages/space/src/lessons/views.jsx`

- [ ] **Step 1: Replace** the `fact`-only switch with a delegation to `<Scene>`, preserving the `renderLessonView(view)` export so `CourseLesson` is untouched.

```jsx
// Space Quest lesson visuals now delegate to the renderer-agnostic Scene kit
// (src/scenes). A beat's `view` is a semantic descriptor; <Scene> resolves it to a 2D (or
// future 3D) renderer. Kept as renderLessonView so CourseLesson's renderView contract is stable.
import Scene from '../scenes/Scene.jsx';
import { SCENE_MODE } from '../scenes/registry.js';

export function renderLessonView(view) {
  return <Scene descriptor={view} mode={SCENE_MODE} />;
}
```

> `gen-capabilities` parses `views.jsx` for `case '<kind>':`, but space is NOT in its `APPS`
> list, so this rewrite does not break `validate`. View kinds for space are declared in
> `engine.capabilities.json` (Task 16).

- [ ] **Step 2: Verify** existing `fact` lessons still render: start the dev server (see Phase 5 setup) and open a station — the old emoji facts should now appear on the cinematic stage.
- [ ] **Step 3: Run package tests** `cd packages/space && node --test` (logic tests still green).
- [ ] **Step 4: Commit** (`refactor(space): lesson views delegate to Scene kit`).

---

## Phase 4 — Capabilities + schema for new view kinds

### Task 16: Declare new view kinds in capabilities

**Files:** Modify `packages/space/engine.capabilities.json`

- [ ] **Step 1: Add** a `views[]` entry for each new kind (`body`, `orbit`, `field`, `scrub`, `reveal`, `launch`, `compare`), keeping `fact`. Each lists its fields with `name`/`type`/`required`/`note`/`example`. Use `object[]` for `bodies`/`states`/`hotspots`/`items` and `object` for `base`. Field shapes must match exactly what the components read (Tasks 7–13) and what the YAML authors in Phase 5. **Do not list `key`** — `gen-schema` auto-injects `key` into every view branch. Example for `orbit` and `scrub`:

```json
{
  "kind": "orbit",
  "description": "A central body with one or more bodies orbiting it on dashed paths; a phaseLit moon shows its lit fraction. Cinematic dark-space stage.",
  "fields": [
    { "name": "bodies", "type": "object[]", "required": true, "note": "each {id, role, orbits?, radius?, period?, phaseLit?}; the body with no `orbits` is the center", "example": [{ "id": "earth", "role": "planet" }, { "id": "moon", "role": "moon", "orbits": "earth", "period": 6, "phaseLit": true }] }
  ]
},
{
  "kind": "scrub",
  "description": "Interactive: the learner drags a handle through ordered states; each state shows a caption and speaks its line. Optional `base` scene underneath.",
  "fields": [
    { "name": "base", "type": "object", "required": false, "note": "an underlying scene descriptor (e.g. an orbit) to render the interaction on" },
    { "name": "states", "type": "object[]", "required": true, "note": "ordered {id, label, say, caption}; `say` must exist in narration", "example": [{ "id": "full", "label": "Full Moon", "say": "mp-x-full", "caption": "Full Moon — the whole lit side faces Earth." }] }
  ]
}
```

(Author `body`, `field`, `reveal`, `launch`, `compare` entries the same way, matching their component props.)

- [ ] **Step 2: Bump** the capabilities `version` if you treat added views as a vocabulary change (optional; space isn't gen-capabilities-managed, but keep it sensible).
- [ ] **Step 3: Commit** (`feat(space): declare cinematic view kinds in capabilities`).

### Task 17: Regenerate the course schema

**Files:** Modify `packages/space/course.schema.json` (generated)

- [ ] **Step 1: Regenerate** — Run: `npm run course:schema`
- [ ] **Step 2: Verify** — Run: `npm run validate` → all `✓ ... fresh`, including `packages/space/course.schema.json`.
- [ ] **Step 3: Commit** (`chore(space): regenerate course.schema.json for new view kinds`).

---

## Phase 5 — Author World 1 (Backyard Sky) + prove the vertical slice

> Build & verify ONE world end-to-end (the spec's phasing) before replicating. Dev-server
> setup for this worktree (do once): `cd <worktree> && npm install` (sets up workspace
> node_modules), then `npm run preview:space` (Vite, `host: true` → LAN URL for the phone).
> Stop the old main-checkout dev server first if it holds port 5173.

### Task 18: Rewrite Backyard Sky lessons + narration

**Files:** Modify `packages/space/space.course.yml` (lessons `moon-phases`, `day-night`, `the-sun`, `seasons`, `gravity`; and the `narration:` map)

Each lesson's single `learn` section becomes ~6 beats: hook, 3 teach, recap, explore. **Every beat keeps top-level `say` + `caption` (schema-required) where `caption` MUST equal `narration[say]` (enforced by `course:check`).** Interactive beats use `advance: hold`; their per-state/per-hotspot `say` keys are added to `narration:` too (so they get clips). Narration keys: linear beats `mp-0..4`; interactive `mp-x-<stateId>`.

**Fully-worked example — `moon-phases`:**

```yaml
    moon-phases:
      title: Moon Phases
      sections:
        - id: learn
          label: Learn it
          beats:
            - { say: mp-0, caption: "Why does the Moon seem to change shape each night?", advance: hold, view: { kind: body, key: mp0, body: { role: moon, glow: true }, label: "The Moon" } }
            - { say: mp-1, caption: "The Moon makes no light of its own — it shines by reflecting sunlight.", view: { kind: orbit, key: mp1, bodies: [ { id: sun, role: star }, { id: moon, role: moon, orbits: sun, radius: 70, period: 8, phaseLit: true } ] } }
            - { say: mp-2, caption: "As the Moon orbits Earth, we see more or less of its sunlit half.", view: { kind: orbit, key: mp2, bodies: [ { id: earth, role: planet }, { id: moon, role: moon, orbits: earth, radius: 64, period: 6, phaseLit: true } ] } }
            - { say: mp-3, caption: "That changing sunlit slice is what we call a phase.", view: { kind: body, key: mp3, body: { role: moon, phase: 0.75 } } }
            - { say: mp-4, caption: "The phases cycle about every 29 days — new moon to full moon and back.", view: { kind: body, key: mp4, body: { role: moon, glow: true } } }
            - { say: mp-5, caption: "Drag to walk the Moon through its phases!", advance: hold, view: { kind: scrub, key: mp-explore,
                base: { kind: orbit, bodies: [ { id: earth, role: planet }, { id: moon, role: moon, orbits: earth, phaseLit: true } ] },
                states: [
                  { id: new,     label: New Moon,      say: mp-x-new,     caption: "New Moon — the lit side faces away from us." },
                  { id: quarter, label: First Quarter, say: mp-x-quarter, caption: "First Quarter — we see half the lit side." },
                  { id: full,    label: Full Moon,     say: mp-x-full,    caption: "Full Moon — the whole lit side faces Earth." } ] } }
```

…and in `narration:` add:

```yaml
    mp-0: "Why does the Moon seem to change shape each night?"
    mp-1: "The Moon makes no light of its own — it shines by reflecting sunlight."
    mp-2: "As the Moon orbits Earth, we see more or less of its sunlit half."
    mp-3: "That changing sunlit slice is what we call a phase."
    mp-4: "The phases cycle about every 29 days — new moon to full moon and back."
    mp-5: "Drag to walk the Moon through its phases!"
    mp-x-new: "New Moon — the lit side faces away from us."
    mp-x-quarter: "First Quarter — we see half the lit side."
    mp-x-full: "Full Moon — the whole lit side faces Earth."
```

- [ ] **Step 1:** Rewrite `moon-phases` exactly as above.
- [ ] **Step 2:** Rewrite `day-night` (orbit/`scrub` day terminator), `the-sun` (`body` with corona + `reveal` of sun facts), `seasons` (`scrub` through seasons via Earth tilt), `gravity` (`body`/`compare` mass→pull) following the same 6-beat pattern; add all their narration keys (`dn-*`, `su-*`, `se-*`, `gr-*` + `-x-` interactive keys), keeping the old `*-0..2` lines that you reuse and removing any now-unused keys.
- [ ] **Step 3:** Pick the right scene kind per beat from the Task-16 vocabulary; keep `caption` == the narration line verbatim.
- [ ] **Step 4: Commit** (`feat(space): cinematic 6-beat lessons for Backyard Sky`).

### Task 19: Verify World 1 visually (no audio yet)

- [ ] **Step 1:** `npm run preview:space`; open the LAN URL on the phone.
- [ ] **Step 2:** Walk every Backyard Sky station's Learn-it: confirm hook→teach→recap animate, captions advance, and the explore beat's drag/tap works (audio comes in Phase 6).
- [ ] **Step 3:** Fix any scene-component issues found (commit per fix). Re-verify.

---

## Phase 6 — Dubbing (Jessica) for World 1, then activate checks

### Task 20: `buildVoiceJobs` (pure) + test

**Files:** Create `packages/space/src/scenes/voiceJobs.js`; Test: `scenes.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

```js
import { buildVoiceJobs } from './voiceJobs.js';
test('buildVoiceJobs turns the narration map into deduped slow jobs', () => {
  const course = { narration: { 'mp-0': 'Hi', 'mp-1': 'There', dup: 'Hi' } };
  const jobs = buildVoiceJobs(course);
  assert.deepEqual(jobs.find((j) => j.key === 'mp-0'), { key: 'mp-0', text: 'Hi', slow: true });
  assert.equal(jobs.length, 3); // keys are unique even if text repeats
  assert.ok(jobs.every((j) => j.slow === true));
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement**

```js
// Pure: narration map → ElevenLabs job list (teaching-slow). Keyed by narration key, so
// repeated text still yields one clip per key (the runtime plays clips by key).
export function buildVoiceJobs(course) {
  return Object.entries(course?.narration || {}).map(([key, text]) => ({ key, text, slow: true }));
}
```

- [ ] **Step 4: Run, verify pass.** [ ] **Step 5: Commit** (`feat(space): buildVoiceJobs from narration map`).

### Task 21: `gen-voice.mjs` for Space

**Files:** Create `packages/space/scripts/gen-voice.mjs`; Modify root `package.json`

> **PATH REALITY (important):** the `platform/` repo is **NOT inside this worktree** — it
> lives at the absolute path `/Users/pavel/dev/discoveryquest/platform` (a sibling of the
> discovery-quest checkout). The reference script and the API key are both over there. The
> user's memory note records this gotcha ("gen-voice .env gotcha — run from main checkout").
> So this script cannot use `../../../platform/...` relative paths.

- [ ] **Step 1: Read the reference** for structure (ElevenLabs calls, voice pick, manifest/
  stale logic): `/Users/pavel/dev/discoveryquest/platform/apps/english-quest/scripts/gen-voice.mjs`.
- [ ] **Step 2: Implement** `packages/space/scripts/gen-voice.mjs`:
  - Read `packages/space/space.course.yml`, `yaml.load`, take `.course`.
  - `import { buildVoiceJobs } from '../src/scenes/voiceJobs.js'`; dedupe by key with a `Set`.
  - **Key resolution, in order:** (1) `process.env.ELEVENLABS_API_KEY` if set; else (2) parse
    it from the env file at the **absolute** path
    `/Users/pavel/dev/discoveryquest/platform/apps/math-quest/.env` (the established single
    source on this machine; never print it). If neither yields a key, exit non-zero with:
    `"ELEVENLABS_API_KEY not found — set it in the environment or at platform/apps/math-quest/.env (see spec › Dubbing)"`.
  - Pick voice **Jessica**; write to `examples/space-preview/public/voice/jessica/<key>.mp3`
    + `manifest.json` (skip unchanged unless `--force`; regenerate when baked text differs —
    same stale logic as the reference).
  - **Manifest baking — match the checker:** `course-check.mjs` compares `manifest[key]`
    against `forSpeech(narration[key])` (it strips `⭐`/`🎉` and collapses whitespace). So bake
    **`forSpeech(job.text)`** (not the raw text) into `manifest.json`, or a celebratory recap
    line containing an emoji (the spec's recap "celebratory tone") would falsely report STALE
    on `course:check:space`. Replicate `forSpeech` (or import it if exported) in the script.
  - Use `output_format=mp3_44100_64`, teaching-slow params consistent with the reference.
- [ ] **Step 3: Add** root script: `"voice:space": "node packages/space/scripts/gen-voice.mjs"`.
- [ ] **Step 4: Commit** (`feat(space): gen-voice.mjs (Jessica) from course narration`).

### Task 22: Generate clips + verify audio

- [ ] **Step 1: Generate** — Run: `npm run voice:space` → creates `examples/space-preview/public/voice/jessica/*.mp3` + `manifest.json`. Confirm clip count ≈ number of narration keys.
- [ ] **Step 2: Verify on phone** — restart `npm run preview:space`; walk a Backyard Sky station: Jessica now narrates each beat in sync, and the explore beat speaks per state/hotspot.
- [ ] **Step 3: Do NOT commit the clips.** `.gitignore` line 7 is `**/public/voice/`, so the
  generated MP3s + `manifest.json` are intentionally ignored (same pattern as every platform
  app — voice is generated per-environment, not version-controlled). A `git add` of them is a
  silent no-op. They live on disk for dev/phone testing and `course:check`; distribution to
  the deployed app is the platform-mirror follow-up. **No commit this step.** (If you ever do
  want them tracked, that's an explicit `git add -f` decision — out of scope here.)

### Task 23: Activate course-check

- [ ] **Step 1: Add** a root `package.json` script for reproducibility:
  `"course:check:space": "node scripts/course-check.mjs packages/space/space.course.yml --app packages/space --voice examples/space-preview"`
  (`--app` = where the schema/capabilities live; `--voice` = the app dir whose `public/voice`
  holds the generated clips — confirmed CLI: `course-check <course.yml> [--app <dir>] [--voice <dir>]`).
- [ ] **Step 2: Run** — `npm run course:check:space`. The audio invariant (every narration
  line has a matching clip whose baked text still matches) is now satisfiable for the lines
  you generated. Fix any `caption≠narration[say]` or missing-clip errors it reports.
- [ ] **Step 3:** `npm run validate` → green. `cd packages/space && node --test` → green.
- [ ] **Step 4: Commit** the new script + any YAML fixes (clips stay uncommitted per Task 22).

---

## Phase 7 — Replicate to Worlds 2–4

### Task 24: Cosmic Neighborhood (5 stations)

- [ ] Rewrite `inner-outer`, `gas-giants`, `moons-rings`, `asteroids-comets`, `whole-system` to the 6-beat pattern using the scene vocabulary (`compare` for sizes, `field`/`reveal` for the system, `body` with rings for Saturn, etc.); extend `narration:`. Commit the YAML. Then `npm run voice:space` (incremental — only new keys generate), verify a station on phone, `npm run course:check:space`. Clips stay uncommitted (Task 22).

### Task 25: Deep Space (5 stations)

- [ ] Rewrite `constellations`, `star-life` (`scrub` lifecycle), `nebulae` (`field` tint nebula), `galaxies` (`field` spiral), `black-holes` (`body` + accretion). Extend narration, commit YAML, `npm run voice:space`, verify on phone, `npm run course:check:space` (clips uncommitted).

### Task 26: The Human Element (5 stations)

- [ ] Rewrite `life-in-orbit`, `getting-there` (`launch`), `satellites` (`orbit`), `spacewalks`, `mars-base` (`body`/`reveal`). Extend narration, commit YAML, `npm run voice:space`, verify on phone, `npm run course:check:space` (clips uncommitted).

---

## Phase 8 — Final verification & wrap-up

### Task 27: Full sweep

- [ ] **Step 1:** `npm run voice:space` (ensure all clips current) — no unexpected regenerations.
- [ ] **Step 2:** `npm run validate` → all green; `npm run course:check:space` → green (audio invariant passes for all narration); `cd packages/space && node --test` → green.
- [ ] **Step 3: Manual phone walkthrough** of one station per world: cinematic animation, Jessica narration in sync, captions correct, interactive explore responds + speaks, reduced-motion still readable (toggle OS reduce-motion and re-check one station).
- [ ] **Step 4: Commit** anything outstanding.
- [ ] **Step 5: Follow-ups** (record in the spec's Follow-ups / a memory, do NOT do here): mirror `jessica/*.mp3` + YAML into the deployed `platform` repo; wire space into `gen-capabilities`; implement `3d` renderers under `src/scene` and flip `SCENE_MODE` per-kind; reconcile with `space-3d-fugu`.

---

## Verification commands (reference)

- Package logic tests: `cd packages/space && node --test`
- Schema regenerate / check: `npm run course:schema` / `npm run validate`
- Course integrity (incl. audio invariant): `npm run course:check:space` (added in Task 23)
- Voice generation: `npm run voice:space` (`-- --force` to re-roll all)
- Dev server (LAN for phone): `npm run preview:space`
