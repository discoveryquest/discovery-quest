# Course loader — YAML→runtime, driving both English Quest and the EFL app

**Date:** 2026-06-15 · **Status:** designed (not started). Approach **A** (generic
loader + content-injected board registry) approved. This is the **Phase E "runtime
model"** of `platform/docs/specs/2026-06-15-efl-course-port-plan.md`: make the live
apps *driven by* their public `<id>.course.yml` instead of bespoke code.

## Goal

Today the live EFL app (`english-ru.discoveryquest.app`) is **bespoke code** —
`content-english-ru/{animals,food,colours}.js` hardcode the Animals/Food/Colours word
lists (via the shared `_vocab.js` `makeTopic` factory), `curriculum.js` hardcodes the
worlds, `QuestHost.jsx` hardcodes the topic→generator wiring — while the *same*
information also exists as data in the public, validated `english-ru.course.yml`. The
two duplicate each other.

Make the **YAML the single source of truth**: a loader reads a `.course.yml` and
*produces* the runnable course (worlds → stations → bound generators + lessons), so
editing the YAML changes the live app. Then **delete** the bespoke packages. Scope
(decided): drive **both** the EFL app **and** English Quest through the loader, and
make **lessons + narration** YAML-driven too (not just quest stations).

## Verified starting state (2026-06-15)

Checked against the repo, not assumed (a prior session warned of hallucination):

- `english-ru.course.yml` exists and `course:check` is **green** (exit 0):
  schema + semantic + audio — "3 worlds, 6 playable stations, 4 lessons, 15 beats,
  15 narration lines."
- `vocab` content schema already carries optional `ru` + `band`
  (`packages/english/src/contentMeta.js`).
- `vocabListen` board exists, wired in `PhonicsQuest` (rendered by `WordChoice`),
  `boardMeta.js`, and `content-english/vocab.js`.
- Live EFL app runs from bespoke code: `platform/packages/english-ru` +
  `content-english-ru` + deployed `apps/english-ru` (66 voice clips).
- **No YAML→runtime loader exists yet** (`grep loadCourse` across source = empty).

### The technical crux

Existing generators **close over module-global content**: `genPictureMatch` reads a
hardcoded `VOCAB`, and `band` only flips letter-casing — it does **not** filter
content. `PhonicsQuest` reads emoji from a global `WORD_EMOJI` map. The core work is
turning **content-baked-in** generators into **content-injected** ones.

### Metadata foundation already in place

The loader invents nothing — it joins three things that already exist:

```
station.board ──BOARD_META[kind].content──▶ collection name
course.content[collection] ──band-filter──▶ items for this station
BOARDS[kind] ─────────────────────────────▶ React board component
```

`packages/english/src/boardMeta.js` already declares, per board kind, which content
collection it draws from (`pictureMatch → vocab`, `soundToLetter → phonemes`, …).
`contentMeta.js` declares each collection's shape. `english.course.yml` already
encodes **every** content collection for English Quest's **14 board kinds over 12
content collections** (the three `grammar*` kinds share one generator + the
`parts_of_speech` bank; `pictureMatch`+`vocabListen` share `vocab`), so driving
English Quest from YAML is feasible — its content is already data.

## Architecture (Approach A)

Two clean layers; the loader is subject-agnostic, English specifics stay in the
English package.

```
discovery-quest (open core)
├── packages/course-loader/         NEW · subject-agnostic
│   └── loadCourse(courseDoc, registry) → Course
├── packages/english/
│   ├── boardRegistry.js            NEW · { [kind]: { generate, board, content } }
│   │                                 built from existing BOARD_META
│   ├── CourseQuest.jsx             NEW · one host (replaces PhonicsQuest + EFL QuestHost)
│   ├── boards/*.jsx                UNCHANGED (PictureMatch, WordChoice, …)
│   └── PhonicsQuest.jsx            RETIRED once English Quest runs on CourseQuest
└── packages/content-english/
    └── *.js generators             REFACTORED · accept injected items (see §3)
```

### §1 — Band / content-slice rule (uniform)

`bands` legitimately means two things and the loader handles both uniformly:

- **English Quest:** bands 0/1/2 = **difficulty**; its `vocab` items carry **no**
  `band` → generator draws from the whole collection; `band` drives difficulty.
- **EFL:** bands 0/1/2 = **topic** (Animals/Food/Colours); its `vocab` items carry
  `band` → the collection is sliced.

Rule: for a station, `items = course.content[registry[board].content]`; if those
items carry a `band` field, slice to `item.band ∈ station.bands`; otherwise use all.
Either way the generator also receives the station's primary band as a difficulty
hint (see §3 — casing is decoupled from this).

### §2 — Loader interface

```js
loadCourse(courseDoc, registry) → Course

Course = {
  meta:        { id, title, subject, companion, voice, lowercase?, ui?, reactions? },
  worlds:      [ { id, title, emoji, color, blurb, stations:[Station] } ],
  stationsById, lessonsById, narration,
}
Station = {
  id, title, icon, sub, worldId, board, bands, lessonId,
  Board,            // registry[board].board (React component)
  generate(),       // bound: registry[board].generate(slicedItems, { band, lowercase })
}
Lesson = { id, title, sections:[ { id, label, beats:[ {say, caption, view} ] } ] }
```

The loader is a **pure data-join**: it knows nothing about phonics or vocab — only how
to slice content and bind generators from the registry. That keeps it reusable for
math/future subjects. It assumes the doc is already `course:check`-valid (no
re-validation at runtime).

### §3 — Generator refactor contract

Each generator changes from *closing over a global array* to a pure function:

```js
// before:  genPictureMatch(band) → reads module-global VOCAB
// after:
generate(items, ctx) → problem
   items = station's sliced content collection (shape per CONTENT_META)
   ctx   = { band, lowercase }          // band = difficulty hint, not content selector
```

Registry entry stays `{ generate, board, content }`. Three rules:

1. **Content comes in, never imported.** The generators each take their collection
   as `items`. Their hardcoded arrays move to the course YAML (already done) and the
   package arrays are deleted (or kept only as smoke fixtures).
2. **Display data rides on the problem.** Generators put `emoji`/`ru` on the problem
   (the vocab gens already do). This **deletes the global `WORD_EMOJI`** dependency —
   the reveal reads `problem.emoji`/`problem.ru`.
3. **Casing decoupled from band.** `lower = ctx.lowercase ?? (band >= 2)`. EFL sets a
   new optional course field `lowercase: true` (always-lowercase preserved); English
   Quest omits it → keeps capitals-first-by-band. Small schema add →
   `course:capabilities` + `course:schema` regen.

Also: **board selection moves off `problem.kind`.** The host renders `station.Board`
(resolved from the station's `board` kind), so the bespoke `listenWord` vs public
`vocabListen` kind mismatch disappears.

### §4 — Unified `CourseQuest` host + lessons

```js
CourseQuest({ station, course, onExit })   // replaces PhonicsQuest + EFL QuestHost
```

- Builds the 6-question quest from `station.generate()`, renders `station.Board`,
  reveal reads `problem.emoji/ru`. ~90% of the two existing hosts is identical; this
  collapses them.
- **Localized chrome must be injected** (one host, two languages): the done-screen
  heading ("Great listening!" / "Молодец!"), the back button, the score line, and the
  **reaction lines** (praise/oops/solved). These are the only per-app bits. They move
  into the course YAML as a small optional `ui` + `reactions` block, so the host is
  fully course-driven. (Second small schema add.)
- **Lessons:** the loader emits `Lesson` objects; a thin lesson host walks
  `sections → beats`, calling the **existing** `renderLessonView(view, lower)`
  (`@discoveryquest/english/lessons`) and `speak(course.narration[beat.say])`. All 10
  view kinds in use (picture, blend, cloze, examples, letters, pair, phoneme,
  sentence, soundboard, team) already render — **no new view code**. Reuses engine-ui
  `LessonScreen`. **The host must thread the course `lowercase` flag as the second
  `renderLessonView(view, lower)` arg** (the signature takes `lower`; today's EFL
  `App.jsx` passes `lesson.lower`), or EFL lesson text ships capitalized — a
  behavior-unchanged regression.

### §5 — Platform vendoring, reconciliation & verification

**Vendoring** (repos are separate copies — same manual-sync pattern as today):

1. Land §3/§4 first in open core (`discovery-quest`, the `efl-port` worktree): new
   `packages/course-loader`, `boardRegistry` + `CourseQuest` + the generator refactor.
2. Propagate the same changes into **platform's copies** of `packages/english` +
   `content-english`, and vendor `course-loader` in. Copy `english-ru.course.yml` into
   the EFL app (build-time YAML→doc via `js-yaml`). Voice mp3s stay in
   `apps/english-ru/public/voice`.

**Reconciliation** (kills the duplication):

- `apps/english-ru` becomes a thin shell: parse YAML → `loadCourse(doc, BOARD_REGISTRY)`
  → feed `worlds` to `MapScreen`, `station` to `CourseQuest`, `lesson` to `LessonScreen`
  (all from `@discoveryquest/english`).
- **Deleted:** `packages/english-ru`, `packages/content-english-ru`, the bespoke
  `curriculum.js` / `QuestHost.jsx` / `src/lessons/*` / `voiceLines.js`. Reaction clips
  in `public/voice` stay; the YAML `reactions` keys map to those existing filenames
  (a migration detail to preserve exactly).

**Coupling risk:** the generator refactor touches shared `@discoveryquest/english` /
`content-english`, which **English Quest also rides on**. Both must move together and
**both apps get re-verified** — the same "two diverging copies" debt the repo-split
already carries.

**Worktrees & verification (non-negotiable convention):**

- discovery-quest work → the existing `efl-port` worktree. Platform work → a **new
  platform worktree** (two-sessions rule), FF-merged to main.
- Gate: `build` green → `smoke` + `course:check` green → **puppeteer drive _and
  screenshot_** both the EFL app and English Quest (screenshot mandatory — a styling
  regression shipped before from DOM-only checks; Tailwind v4 needs `@source` for
  sibling workspace packages or classes get purged) → confirm kid-facing behavior
  unchanged → **deploy only on explicit owner OK**.

## Schema deltas (require `course:capabilities` + `course:schema` regen)

1. `course.lowercase?: boolean` — display casing override (EFL: `true`).
2. `course.ui?` + `course.reactions?` — localized host chrome + Luna reaction-line
   keys, so one host serves both languages from data.

## Acceptance

- Editing `english-ru.course.yml` changes the live app (it is truly YAML-driven).
- Kid-facing behavior unchanged: 3 worlds, picture + listen stations, Russian Luna
  instruction, authentic English word clips, Russian glosses, Russian Learn-it lessons.
- English Quest also runs through the loader (`english.course.yml`), behavior unchanged.
- `course:check` green for both courses; `build` + `smoke` green; puppeteer drive +
  screenshot verified for both apps; then (with owner OK) deploy `discoveryquest-english-ru`
  and verify live.

## Sequencing & a discovered constraint

Implementation is split into **two plans**, EFL first (each ships working software):

- **Plan 1 — loader + EFL app.** Build `course-loader`, refactor the **vocab**
  generators, the board registry, `CourseQuest` + lesson host, the schema additions,
  and rewire the platform EFL app to be fully YAML-driven. EFL becomes pure data.
  `PhonicsQuest` stays in place for English Quest during this plan (the two hosts
  coexist temporarily).
- **Plan 2 — migrate English Quest.** Refactor the remaining ~12 generators and move
  `packages/english`'s App to `loadCourse`/`CourseQuest`, retiring `PhonicsQuest`.

**Discovered constraint (resolve in Plan 2's design addendum):** English Quest's
`phonemes` and `blendWords` collections carry **no `band`** field; their generators
select by a **code-side, _cumulative_ `BANDS` array** (band 0 ⊂ band 1 ⊂ band 2). That
is nested logic, not the flat per-item partition EFL's `vocab` uses. English Quest can
run through the loader with that band-grouping logic kept **inside the generators**
(behavior-unchanged, content lists injected from YAML), but expressing cumulative bands
as *data* needs a small course-format decision — deferred to Plan 2.

## Out of scope

- Repo-sync automation between `platform` and `discovery-quest` (pre-existing debt;
  vendoring stays manual here).
- A YAML authoring/editing UI.
- Migrating math to the loader (the loader is designed to allow it later, not now).
