# Space Quest — Cinematic Learn-it: HANDOFF (2026-06-28)

You are picking up an in-progress feature. Read this top to bottom before doing anything.

## TL;DR
Rebuilding Space Quest's "Learn it" into cinematic, animated, interactive, **Jessica-dubbed**
lessons on a **renderer-agnostic scene kit** (2D now, 3D droppable later). **World 1 (Backyard
Sky, 5 stations) is DONE and approved by the user.** Worlds 2–4 (15 stations) are NOT done —
they still show the old plain emoji `fact` cards. Practice/quiz is intentionally untouched.

- **Spec:** `docs/superpowers/specs/2026-06-27-space-learnit-cinematic-design.md`
- **Plan:** `docs/superpowers/plans/2026-06-27-space-learnit-cinematic.md` (still the roadmap; Phases 1–6 done, 7–8 remain)
- **Branch / worktree:** `space-learnit` at `/Users/pavel/dev/discoveryquest/.worktrees/space-learnit` (all paths below are relative to it). This is a snapshot of the `packages/space` + `examples/space-preview` that were UNTRACKED in the main `discovery-quest` checkout — do NOT assume main has this code.

## Workflow that's been used
Subagent-driven: a fresh general-purpose subagent per task, then verify. Visual changes are
verified by **headless Chrome screenshots** (see "How to verify"). Commits end with a trailer:
`Claude-Session: https://claude.ai/code/session_01UuNPTjgu6qHRcfjKrtqiQu` (use your own session URL).
Branch is committed frequently; `git log --oneline` shows the trail.

## Architecture (the important part)
A beat's `view` is a **semantic scene descriptor** (e.g. `{ kind: orbit, bodies: [...] }`),
NOT pixels. A `<Scene>` dispatcher resolves `(mode, kind)` → a renderer.

- `packages/space/src/scenes/registry.js` — PURE (no JSX): `SCENE_MODE='2d'` + `resolveRenderer(registry, mode, kind)` (2d fallback). **Keep JSX out of this file** or `node --test` breaks.
- `packages/space/src/scenes/renderers.jsx` — the `SCENE_RENDERERS` map (imports the components). Never imported by a `.test.mjs`.
- `packages/space/src/scenes/Scene.jsx` — dispatcher. `SceneContent.jsx` — BARE dispatcher (no `SpaceStage`) for nesting a scene as a `base`.
- `packages/space/src/scenes/2d/` — components: `base.jsx` (SpaceStage + Starfield), `Fact2D`, `Body2D`, `Orbit2D`, `Field2D`, `Launch2D`, `Compare2D`, `Scrub2D`, `Reveal2D`, `MoonPhase2D`, plus `roles.js` (shared role gradients). Each exports a bare `*Content` and a default that wraps it in `SpaceStage`.
- Pure logic (unit-tested in `src/scenes/scenes.test.mjs`): `geometry.js`, `scrub.js`, `voiceJobs.js`, `registry.js`.
- `src/lessons/views.jsx` is a thin shim: `renderLessonView(view)` → `<Scene descriptor={view} mode={SCENE_MODE}/>`. `LessonScreen` (in `packages/engine-ui`) and `CourseLesson.jsx` are unchanged.
- **3D later:** add a `'3d'` renderer map; per-kind missing → falls back to 2d. The dormant `src/scene/` (singular!) is the intended home. `src/scenes/` (plural) is the new kit — names are deliberately distinct.

### Scene kit vocabulary (view kinds)
Declared (hand-maintained) in `packages/space/engine.capabilities.json`; schema generated from it.
`fact`(emoji,text) · `body`(body{role,color,rings,tilt,glow,phase},label) · `orbit`(bodies[]) ·
`field`(tint,density,label) · `launch`(payload) · `compare`(items[]) ·
`scrub`(base,states[]) interactive stepped slider · `reveal`(base,hotspots[]) interactive tap ·
`moonPhase`(interactive,variant,active,says) — the flagship, see below.

### MoonPhase2D (the most-iterated component — `src/scenes/2d/MoonPhase2D.jsx`)
- `variant: 'diagram'` (default): top-down Sun(left, rays)→Earth(center)→Moon(orbit, sun-facing half always lit) + a "FROM EARTH" inset phase disc + phase name label.
  - `interactive: false` → auto-orbits.
  - `interactive: true` → smooth `<input type=range step=any>`; θ=value*360 drives everything continuously; speaks `says[phaseId]` when the named phase changes (debounced). `says` = `{ new, waxingCrescent, first, waxingGibbous, full, waningGibbous, last, waningCrescent }` (narration keys).
- `variant: 'strip'`: row of all 8 phase discs with labels.
  - `active` (number): controlled — `>=0` highlights that index only (lesson engine drives narration/advance); `<0` shows all, no highlight; **`active` takes precedence over says/auto-cycle**.
  - without `active`: `says` present → self-narrated audio-paced tour; else silent auto-cycle (gallery only).
- Phase geometry (`litPath`): illuminated fraction `f=(1-cosθ)/2`; lit on RIGHT for waxing (0<θ<180), LEFT for waning (180<θ<360); terminator radius `r·|1-2f|`, bulge toward dark side when gibbous (f>0.5) else toward lit limb. (A waning-side sweep bug was fixed in commit `fd29b98` — don't reintroduce it.)

## How the Moon Phases lesson is structured (the reference pattern)
In `packages/space/space.course.yml`, lesson `moon-phases` has 4 clickable sections:
`The question` (body hook) · `Sunlight` (moonPhase diagram auto, teaches "reflects sunlight + sun lights one half") · `The phases` (1 intro strip beat `active:-1`, then **8 per-phase beats** each `{ say: mp-x-<phase>, view: moonPhase strip active:i }` that auto-advance as Luna narrates, flowing into) · `Explore` (moonPhase interactive slider, `advance: hold`).
**This is the template** the user liked. Key lessons learned:
- The clickable progress bar = multiple labeled `sections` per lesson (like Math's lessons in `packages/math/src/lessons/`). One section per "part".
- `advance: hold` ONLY on the final interactive explore beat. Putting it on hooks/teaching beats FREEZES the lesson (a bug we hit). Normal beats auto-advance when narration ends.
- To narrate a sequence and have it auto-advance, make each step its OWN beat (engine paces + advances). Don't build a self-advancing component that needs to tell the lesson to move on — the engine has no such callback.
- Don't repeat the same animated scene 3 beats in a row (user noticed). Vary visuals across beats.

## Course format / validation contract (CRITICAL — read before editing YAML)
- `packages/space/engine.capabilities.json` is **hand-maintained** (space is NOT in `gen-capabilities.mjs`'s APPS, only math/english). Add new view kinds + their TOP-LEVEL fields here. Schema uses `additionalProperties:false`, so any prop a view uses MUST be a declared field or validation fails. Don't list `key` (auto-injected).
- After editing capabilities: `npm run course:schema` (regenerates `packages/space/course.schema.json`), then `npm run validate` must be green.
- `course:check:space` (= `node scripts/course-check.mjs packages/space/space.course.yml --app packages/space --voice examples/space-preview`) enforces: `view.kind`/props valid, **every beat `caption` === `narration[say]` exactly**, and **every narration line has a generated clip whose baked text matches** (`forSpeech(text)` — strips ⭐/🎉, collapses whitespace). "N unverified" warnings = narration keys referenced inside a view (not as a beat.say) — OK.
- Narration key convention: linear beats `<prefix>-<n>` (mp,dn,su,se,gr,...); interactive/per-state `<prefix>-x-<id>`.

## Dubbing (Jessica)
- `npm run voice:space` → `node packages/space/scripts/gen-voice.mjs`. Generates ElevenLabs clips to `examples/space-preview/public/voice/jessica/<key>.mp3` + `manifest.json` (bakes `forSpeech(text)`; regenerates changed/missing only; `-- --force` to re-roll all).
- **API key**: `process.env.ELEVENLABS_API_KEY` else the ABSOLUTE path `/Users/pavel/dev/discoveryquest/platform/apps/math-quest/.env` (the `platform` repo is a SIBLING, NOT in this worktree). Never print the key.
- **Clips are gitignored** (`.gitignore`: `**/public/voice/`). Do NOT commit them; they regenerate. Deployed distribution = the platform manual-mirror follow-up.
- Voice is declared `voice: { id: jessica, profile: teaching-slow }` in the YAML; runtime plays via `@discoveryquest/voice-kit/audio` `speak(key,{important:true})`.

## How to run & verify (no audio device, no Playwright installed)
- **Dev server** (gets reaped when idle — just restart it): `node_modules/.bin/vite examples/space-preview --port 5173 --strictPort` (run in background; the vite.config has `host:true` for LAN/phone). Open `http://localhost:5173/`. NOTE: vite root is a POSITIONAL arg (not `--root`); nested `npm run` arg-forwarding mangles flags — call the binary directly.
- **Headless screenshots** (how visuals were verified): Chrome headless shell at `~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell`. Use `--headless --disable-gpu --screenshot=out.png --window-size=W,H --virtual-time-budget=2500 <url>`, then Read the PNG.
  - **Dev-only pages (REMOVE before final — see cleanup):** `examples/space-preview/gallery.html` (+`src/gallery.jsx`) renders every scene kind with sample descriptors — best for verifying components. `examples/space-preview/lesson-harness.html` (+`src/lesson-harness.jsx`) renders a real `CourseLesson` for `?id=<lessonId>` (bypasses profile gate).
  - **Headless caveat:** the lesson modal's `framer-motion` entrance + audio-paced advancement don't run under Chrome's virtual clock (no audio device), so the modal looks dim/stuck headless. That's NOT a bug — verify lesson DOM structure via `--dump-dom` and confirm look/flow in a REAL browser. Components in the gallery (at rest) screenshot fine.
- **Tests:** `cd packages/space && node --test` (currently 106 pass, pure logic only). **Validate:** `npm run validate`. **Course integrity:** `npm run course:check:space`.

## What's DONE (committed on space-learnit)
- Phases 1–6 of the plan: scene-kit foundation, all 2D components, lesson integration, capabilities+schema, **Backyard Sky authored + dubbed**, audio checks green.
- Backyard Sky (moon-phases, day-night, the-sun, seasons, gravity): cinematic, clickable sections, interactive explore, fully Jessica-dubbed. Moon Phases polished per user feedback (narrated phase tour, smooth illuminated slider, correct geometry).
- 92→95 narration clips generated (gitignored). 106 tests green; validate + course:check:space green at last check.

## REMAINING WORK
1. **Worlds 2–4 (15 stations)** — still old 3-beat plain `fact` lessons. Rewrite each to the Backyard-Sky template (clickable sections, cinematic scene kit, interactive explore where it fits), extend `narration:`, run `npm run voice:space`, `course:check:space`. NOTE the old lessons have `advance: hold` on every fact beat (legacy) — that freezes them; fix as you rewrite. Worlds/stations are listed at the top of `space.course.yml`. Suggested scenes per concept are in the plan (Phase 7) and the spec's scene-coverage table.
2. **(Optional) Smooth the other Backyard Sky explores** — day-night & seasons still use the STEPPED `scrub` (discrete states), which is fine but the user prefers smooth where continuous makes sense. Moon Phases is the smooth reference.
3. **Practice / quiz** — user said the practice is repetitive and "just quiz-like, not fun." Out of scope for now; a FUTURE redesign (more varied/fun practice boards). Don't touch unless asked.
4. **Final verification sweep (Plan Phase 8)** — full `validate` + `course:check:space` + `node --test` + a real-browser walkthrough of one station per world + reduced-motion check.
5. **CLEANUP before merge:** remove the dev-only `examples/space-preview/gallery.html`, `src/gallery.jsx`, `lesson-harness.html`, `src/lesson-harness.jsx` (some were committed; `git rm` them). Then use `superpowers:finishing-a-development-branch` to integrate. The `package-lock.json` change is from `npm install` in the worktree.
6. **Two-repo mirror follow-up** — generated clips + the updated course YAML need to reach the deployed `platform` repo (manual mirror, per project memory). Also consider wiring space into `gen-capabilities.mjs` so capabilities aren't hand-maintained.

## Gotchas recap
- Keep `registry.js` JSX-free. React components can't be passed to `useState` setters (caused a crash — they're called as updaters). ES-module cycles are fine if the import is only USED at render time.
- SVG `clipPath`/gradient ids must be unique per instance (use `useId()`), or multiple bodies on screen collide.
- Honor `useReducedMotion` in every animated component.
- `caption` must EXACTLY equal `narration[say]`; editing narration text → re-run `voice:space` (stale detection will flag it).
