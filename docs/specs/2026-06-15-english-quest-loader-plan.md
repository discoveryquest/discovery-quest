# English Quest → loader (Plan 2) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is large — execute it in a FRESH session for reliability.

**Goal:** Make English Quest run from `english.course.yml` via the course loader (retiring `PhonicsQuest`), with all ~16 generators content-injected and the live Reading world ported into the engine — so editing the YAML changes the game, behavior unchanged.

**Architecture:** Extends the shipped loader (`loadCourse`, `BOARD_REGISTRY`, `CourseQuest`, content-injected `genPictureMatch`/`genVocabListen`). Refactor the remaining generators to `(items, ctx)`; fix three content-model gaps (cumulative phoneme bands via inclusive station bands + per-item band tags; `parts_of_speech` role-keyed; multi-collection registry); port the 4 Reading boards (all render via one `StoryReader`) into the engine + YAML; wire the app. Author in open-core, propagate to platform, verify + deploy there.

**Tech Stack:** Node 22 ESM `node:test`, React 18 + Vite + Tailwind v4, `js-yaml`, puppeteer for screenshots. The shipped EFL vocab generators (`packages/content-english/src/vocab.js` `genPictureMatch`/`genVocabListen`) are the **worked example** for every generator refactor — follow that contract exactly.

**Repos:** author in open-core `discovery-quest` worktree `/Users/pavel/dev/discoveryquest/dq-english-loader` (branch `english-loader`); propagate + deploy in a platform worktree (Phase 7). The full design is `docs/specs/2026-06-15-english-quest-loader-design.md` — read it first.

**Generator refactor contract (applies to every generator task):** change `genX(band)` (closing over a module-global array) → `genX(items, ctx = {})` where `band = ctx.band ?? 0`, `lower = ctx.lowercase ?? (band >= 2)`, drawing target/distractors from `items` (NOT the global). Generators do **not** re-filter `items` by band (the loader already sliced it via the station's inclusive bands). Keep every existing step field (banner/prompt/audioPrompt/hint/sayQ/sayA/etc.) verbatim. Update the topic export's `generate` to bind the (now-fixture) global so any remaining direct caller still works, OR delete the topic export if nothing uses it after the registry switch. Add a `node:test` mirroring `packages/content-english/test/vocab.test.js`.

---

## Phase 1 — Loader extensions (open-core, TDD)

### Task 1: `max(bands)` difficulty hint + multi-collection content

**Files:** Modify `packages/course-loader/src/loadCourse.js`; Test `packages/course-loader/test/loadCourse.test.js` (extend).

- [ ] **Step 1: failing tests** — add:
```js
test('difficulty hint uses max(bands), not bands[0]', () => {
  const reg = { b: { content: 'vocab', board: () => null, generate: (items, ctx) => ctx } };
  const doc = { course: { worlds: [{ id: 'w', stations: [{ id: 's', board: 'b', bands: [0, 1, 2] }] }],
    content: { vocab: [{ word: 'a', band: 0 }, { word: 'b', band: 2 }] } } };
  assert.equal(loadCourse(doc, reg).stationsById.get('s').generate().band, 2);
});
test('array content injects an object of sliced collections', () => {
  const reg = { b: { content: ['syn', 'ant'], board: () => null, generate: (items) => items } };
  const doc = { course: { worlds: [{ id: 'w', stations: [{ id: 's', board: 'b', bands: [0] }] }],
    content: { syn: [{ word: 'big', match: 'large' }], ant: [{ word: 'hot', match: 'cold' }] } } };
  const out = loadCourse(doc, reg).stationsById.get('s').generate();
  assert.deepEqual(Object.keys(out), ['syn', 'ant']);
  assert.equal(out.syn[0].match, 'large');
});
```
- [ ] **Step 2: run → FAIL.**
- [ ] **Step 3: implement** in `bindStation`:
```js
const entry = registry[s.board];
if (!entry) throw new Error(`loadCourse: no registry entry for board "${s.board}"`);
const items = Array.isArray(entry.content)
  ? Object.fromEntries(entry.content.map((n) => [n, sliceByBand(content[n], s.bands)]))
  : sliceByBand(entry.content ? content[entry.content] : undefined, s.bands);
const ctx = { band: s.bands && s.bands.length ? Math.max(...s.bands) : 0, lowercase: !!course.lowercase };
```
- [ ] **Step 4: run → PASS** (all loader tests). **Step 5: commit** `feat(course-loader): max(bands) difficulty hint + multi-collection (array) content`.

---

## Phase 2 — Content-model schema + YAML (open-core)

> The schema is generated: edit `contentMeta.js`/`boardMeta.js`, then `npm run course:capabilities` + `npm run course:schema`, and `npm run validate` must pass. Keep `course:check docs/specs/course-format/english.course.yml --app packages/english` green after each task.

### Task 2: phoneme + blendWord band tags; inclusive soundToLetter stations
**Files:** `packages/english/src/contentMeta.js`, `docs/specs/course-format/english.course.yml`.
- [ ] Add an optional `band` field to the `phonemes` and `blendWords` content items in `contentMeta.js` (blendWords is currently `collection:'strings'` — change to `objects` with `{word, band}`, OR keep strings + a parallel band map; prefer `objects` `[{word, band}]` for clarity — confirm the generator reads `.word`). 
- [ ] In `english.course.yml`: tag each phoneme with its intro band — `s,a,t,p,i,n → 0`; `m,d,g,o,c,k → 1`; all remaining letters → `2` (copy the groupings from `packages/content-english/src/phonics.js` `BANDS`). Tag each blendWord with its `BLEND_BANDS` band (first array it appears in). Change the 3 `soundToLetter` stations' `bands:` to `[0]`, `[0,1]`, `[0,1,2]` (was `[0]`,`[1]`,`[2]`). Leave the single `blendWord` station `[0]`.
- **Two gotchas:** (a) YAML `phonemes` have only `{letter,sound,word}` (no `key`) — the refactored `genSoundToLetter` must derive its `audioPrompt` clip key as `` `phon-${letter}` `` (the stable convention) rather than reading a `key` field. (b) `BLEND_WORDS`/`GRAMMAR_WORDS`/etc. flat string exports are imported by `gen-voice.mjs` + the smoke scripts + `export-course.mjs` — after you change `blendWords` to objects, **keep a `BLEND_WORDS = blendWords.map(b=>b.word)` string export** (and similar) so those consumers don't break; they're updated/retired in Phase 7 Task 14.
- [ ] regen capabilities+schema; `validate` + `course:check` green. Commit `feat(course-format): band-tag phonemes/blendWords + inclusive soundToLetter bands`.

### Task 3: `parts_of_speech` → role-keyed
**Files:** `packages/english/src/contentMeta.js`, `docs/specs/course-format/english.course.yml`.
- [ ] In `contentMeta.js`, change `parts_of_speech` from `collection:'wordbank'` `fields:[note, words]` to `fields:[{name:'nouns',type:'string[]'},{name:'verbs',type:'string[]'},{name:'adjectives',type:'string[]'}]`.
- [ ] In `english.course.yml`, replace the flat `parts_of_speech.words:` list with `nouns:`/`verbs:`/`adjectives:` arrays — copy `NOUNS`/`VERBS`/`ADJECTIVES` from `packages/content-english/src/grammar.js` verbatim.
- [ ] regen + `validate` + `course:check` green. Commit `feat(course-format): parts_of_speech role-keyed (nouns/verbs/adjectives)`.

### Task 4: English `ui` + `reactions` in `english.course.yml`
**Files:** `docs/specs/course-format/english.course.yml`.
- [ ] Add course-meta `ui` (English: `done`/`backToMap`/`score`) + `reactions` (`praise`/`oops`/`solved` arrays) mapping to English Quest's existing clip keys — read `packages/english/src/voiceLines.js` (`VOICE_LINES`/`voiceKey`) for the real keys. Do NOT set `lowercase` (English keeps capitals-first via the `?? (band>=2)` fallback). `course:check` (audio only validates narration beats, not reactions) stays green. Commit `feat(english course): English ui + reactions for CourseQuest`.

---

## Phase 3 — Generator refactors (open-core, TDD; follow the vocab worked example)

### Task 5: phonics generators
**Files:** `packages/content-english/src/phonics.js` + new `test/phonics.test.js`.
- [ ] Refactor `genSoundToLetter`, `genBlend`, `genWordFamily`, `genDigraph` to `(items, ctx)` per the contract. They draw from `items` directly (drop `BANDS`/`bandLetters`/`BLEND_BANDS`/`<=band` selection — the YAML inclusive bands already sliced). `genSoundToLetter` items are `[{letter,sound,word,band}]`; `genBlend` items `[{word,band}]`; `genWordFamily` items `[{rime,words,band}]`; `genDigraph` items `[{team,sound,word}]`. Keep `BANDS`/`PHONEMES` etc. only if needed as test fixtures; otherwise delete. Update topic exports' `generate` to bind the fixture (or delete exports if the registry replaces them — but PhonicsQuest still imports them until Task 13, so keep them binding the fixtures until then).
- [ ] TDD each (4 tests min: draws from injected items, 4 choices, correct kind, lower follows ctx). Commit `feat(content-english): phonics generators content-injected`.

### Task 6: grammar generators
**Files:** `packages/content-english/src/grammar.js` + `test/grammar.test.js`.
- [ ] Refactor `genWordSort(category, items, ctx)` — `items` is the role-keyed object `{nouns,verbs,adjectives}`. **The category is singular (`'noun'`) but the keys are plural — add an explicit map**: `const ROLE = { noun:'nouns', verb:'verbs', adjective:'adjectives' };` then `target = pick(items[ROLE[category]])`; distractors = `shuffle(Object.entries(items).filter(([k])=>k!==ROLE[category]).flatMap(([,v])=>v)).slice(0,3)`. (Writing `items[category]` gives `undefined` → crash.) Refactor `genBuildSentence(items, ctx)` (items = sentences array) and `genPunctuation(items, ctx)` (items = punctuationCores array). Keep `POS_LABEL`. TDD. Commit `feat(content-english): grammar generators content-injected`.

### Task 7: sight/same-opposite/context generators
**Files:** `packages/content-english/src/vocab.js` + extend `test/vocab.test.js`.
- [ ] Refactor `genSightWords(items, ctx)` (items = sightWords array), `genContextClues(items, ctx)` (items = contextClues array), and `genSameOpposite(content, ctx)` where **`content` is `{synonyms, antonyms}`** (the multi-collection object) — target/correct from the chosen mode's pairs, distractors from the union of both `.match`/`.word`. TDD (incl. a sameOpp test passing `{synonyms, antonyms}`). Commit `feat(content-english): sight/same-opposite/context generators content-injected`.

---

## Phase 4 — Reading port (open-core)

### Task 8: backport `StoryReader.jsx`
**Files:** copy `/Users/pavel/dev/discoveryquest/platform/packages/english/src/boards/StoryReader.jsx` → `packages/english/src/boards/StoryReader.jsx`. Confirm its imports resolve in open-core (it's a presentational board; check against the existing boards). No test (JSX). Commit `feat(english): StoryReader board (backport)`.

### Task 9: reading content schema + boards
**Files:** `packages/english/src/contentMeta.js`, `boardMeta.js`.
- [ ] `contentMeta` gains `storyItems` (`objects` `[{story, q, d:string[]}]`), `mainIdeaItems`/`detailItems`/`inferenceItems` (`objects` `[{story, q, text, a, d:string[]}]` — **mirror `reading.js`'s exact item fields**, verify against `MAIN_IDEA_ITEMS`). `boardMeta` gains `firstReader`(content:`storyItems`), `mainIdea`(`mainIdeaItems`), `findDetail`(`detailItems`), `inference`(`inferenceItems`), all noting they render via `StoryReader`.
- **Align `BOARD_META.content` to machine-clean collection names** so the Task-12 registry assertion can compare directly: set `sameOpp.content` to the array `['synonyms','antonyms']` (was the human string `'synonyms, antonyms'`) and the three `grammar*` to `'parts_of_speech'` (was `'parts_of_speech (nouns)'`). Move the human note into each entry's `description`. (Confirm `gen-capabilities`/`gen-schema` tolerate an array `content` — if they only read `description`/`item`, this is safe; otherwise keep `content` as the collection key(s) only.) regen + `validate`. Commit `feat(course-format): reading content collections + board kinds`.

### Task 10: reading generators
**Files:** `packages/content-english/src/reading.js` (backport from platform, then refactor) + `test/reading.test.js`.
- [ ] Backport `reading.js`; refactor `genFirstReaders(items, ctx)` (items=storyItems) and the comprehension factory to `comprehension(label, color)` returning `(items, ctx) => problem`. TDD. Commit `feat(content-english): reading generators content-injected`.

### Task 11: author the Reading world in YAML
**Files:** `docs/specs/course-format/english.course.yml`.
- [ ] Un-`soon` the `reading` world; author its 4 stations (`r-first`→firstReader, `r-main`→mainIdea, `r-detail`→findDetail, `r-infer`→inference) with `lesson:` refs; add the 4 content collections (copy `STORY_ITEMS`/`MAIN_IDEA_ITEMS`/`DETAIL_ITEMS`/`INFERENCE_ITEMS` verbatim from `reading.js`); add the 4 reading lessons (port from platform's reading lessons if present, else minimal); add `READING_QUESTION_LINES` (`rq-*`) to `narration`. `course:check` green. Commit `feat(english course): author the Reading world (Story Harbor)`.

---

## Phase 5 — Registry + capabilities (open-core)

### Task 12: extend the board registry to all 18 kinds
**Files:** `packages/english/src/boardGenerators.js`, `boardRegistry.js` + extend `test/boardGenerators.test.js`.
- [ ] Add every board kind to `BOARD_GENERATORS` with its `generate` + `content`: phonics (4), grammar (3 — each currying its category: `grammarNoun: { generate:(items,ctx)=>genWordSort('noun',items,ctx), content:'parts_of_speech' }`), sentence, punctuation, sightWord, `sameOpp: { generate: genSameOpposite, content: ['synonyms','antonyms'] }`, contextClue, reading (4 — each currying label/color: `mainIdea: { generate:(items,ctx)=>comprehension('Main Idea', C.pink)(items,ctx), content:'mainIdeaItems' }`). In `boardRegistry.js` attach each `board` component (SoundToLetter/BlendBuilder/WordFamily/PictureMatch[done]/WordChoice/SameOpposite/ContextClue/GrammarSort/SentenceBuilder/PunctuationChoice/StoryReader). 
- [ ] Note the `comprehension` factory was flipped to `comprehension(label, color) => (items, ctx) => problem` in Task 10 (NOT the platform `comprehension(items, label, color)` shape) — the curry above depends on that.
- [ ] Extend the node:test to assert every kind's `content` `deepEqual`s `BOARD_META[kind].content` (now machine-clean after Task 9, so a plain `assert.deepEqual` works for both the array `sameOpp` and the single-name cases). `course:check english.course.yml` green. Commit `feat(english): BOARD_REGISTRY covers all English Quest boards`.

---

## Phase 6 — App wiring (open-core English Quest)

### Task 13: App.jsx → loadCourse + CourseQuest; retire PhonicsQuest
**Files:** `packages/english/src/App.jsx`, `CourseQuest.jsx` (the `max(bands)` save fix), retire `PhonicsQuest.jsx`.
- [ ] Apply the **`CourseQuest` save fix**: `const band = Math.max(...(station?.bands ?? [0]))` (line ~16) so `bestBand` records the real level for the inclusive phonics stations.
- [ ] Rewrite `App.jsx` to parse `english.course.yml` (`?raw` + `js-yaml`) → `loadCourse(doc, BOARD_REGISTRY)`; feed `course.worlds` to the (TrailMap) `MapScreen`; render `CourseQuest`/`CourseLesson` like the EFL app's `packages/english-ru/src/App.jsx` (the worked example). Retire `PhonicsQuest.jsx` + its `TOPICS`/`BOARDS`. 
- [ ] open-core gate: `node --test` (all suites) + `validate` + `course:check` green. (No build in open-core; build is Phase 7.) Commit `feat(english): drive English Quest from english.course.yml via the loader`.

---

## Phase 7 — Platform propagation, verify, deploy

### Task 14: propagate to platform + wire the app
- [ ] New platform worktree (`git worktree add .worktrees/english-loader -b english-loader`; then `npm install` to link workspaces — REQUIRED or sibling-package builds fail). Propagate ALL open-core changes into platform's copies. **File checklist** (copy/apply each; platform copies have drifted — apply edits surgically, don't clobber platform-only code like reading.js until its consumers are gone):
  - `packages/content-english/src/{phonics,grammar,vocab,reading}.js` (the refactors)
  - `packages/english/src/{contentMeta,boardMeta,boardGenerators,boardRegistry,CourseQuest,App}.{js,jsx}` + `boards/StoryReader.jsx`
  - `scripts/gen-capabilities.mjs`/`gen-schema.mjs` deltas + regenerated `packages/english/{course.schema.json,engine.capabilities.json}`
  - `docs/specs/course-format/english.course.yml`
- [ ] **Update the now-broken consumers** of the changed content shapes: platform `gen-voice.mjs`, `smoke-phonics.mjs`/other smoke scripts, and `export-course.mjs` import `BLEND_WORDS`/`GRAMMAR_WORDS`/etc. as flat strings — confirm the kept string exports (Task 2) satisfy them, or update them. `export-course.mjs` is now redundant (YAML is the source) — leave or retire per preference.
- [ ] Retire `PhonicsQuest.jsx` + `reading.js` + dead globals **only after** `grep` confirms nothing imports them. Wire `apps/english-quest` (its `main.jsx`/App) to the loader-driven `@discoveryquest/english`. Commit.

### Task 15: verify (the gate)
- [ ] `npm run build` → all apps green. `npm run smoke` → green. `course:check english.course.yml` green.
- [ ] Puppeteer **screenshot** the full English Quest flow (reuse the EFL Phase-G harness): a soundToLetter station at each band (s,a,t,p,i,n vs +m,d,g,o,c,k vs all — confirm the cumulative letter sets), a grammar station, same/opposite, a Reading (Story Harbor) station + its read-along + question, a lesson. Eyeball: behavior unchanged, capitals-first casing, English reactions audible, Reading world playable. Confirm **EFL still works** (loader changes are shared) — screenshot its map/quest. Capture console errors.
- [ ] If anything regresses, fix or report. No deploy yet.

### Task 16: backport check + deploy (owner approval)
- [ ] The shared engine bits (StoryReader, contentMeta, loader) are authored in open-core already — FF-merge `english-loader` → discovery-quest main. FF-merge platform `english-loader` → platform main.
- [ ] **Confirm with owner**, then `fly deploy . --config apps/english-quest/fly.toml --remote-only` (app `discoveryquest-english`). Verify `english.discoveryquest.app` live; edit a phoneme/word in the YAML → rebuild → confirm the change shows (proves YAML-driven).

---

## Acceptance
- Editing `english.course.yml` changes English Quest (phoneme bands, word banks, sentences, reading stories all data-driven).
- Behavior unchanged: same boards, cumulative phonics progression (s,a,t,p,i,n → +m,d,g,o,c,k → all), grammar/same-opposite/sentence/punctuation identical, capitals-first casing, English reactions, **Reading world still playable**.
- `node:test`/`validate`/`course:check`/build/smoke green; puppeteer verified; EFL still green; `PhonicsQuest` retired.
- Backported to open-core; deployed on approval.

## Notes for the executor
- The EFL port (`packages/english-ru`, `packages/content-english/src/vocab.js`, `CourseQuest`/`CourseLesson`, `boardRegistry`) is your worked example for every pattern here — read it first.
- Watch the repo-split: a fresh platform worktree needs `npm install` to symlink workspace packages (or sibling-package builds fail with "missing @discoveryquest/…").
- `course:check` only audio-validates narration *beat* keys, not `reactions`/`ui` — placeholder-safe.
