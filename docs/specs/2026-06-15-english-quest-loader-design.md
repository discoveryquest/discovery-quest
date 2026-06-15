# English Quest → loader (Plan 2) — design

**Date:** 2026-06-15 · **Status:** designed (approved). The follow-up to the EFL port
(`2026-06-15-course-loader-design.md`): make **English Quest** run from
`english.course.yml` via the loader, retiring `PhonicsQuest`. Decisions confirmed:
**fully YAML-authored** (no band-grouping left in code) and **full migration** (all
remaining generators + the app).

## Goal

English Quest currently runs from bespoke code: `PhonicsQuest.jsx` statically imports
`TOPICS`/`BOARDS`, and the ~13 generators in `@discoveryquest/content-english` close over
module-global arrays. Make the **YAML the single source of truth** — `loadCourse` produces
the runnable course and `CourseQuest` plays it — so editing `english.course.yml` changes
the live English Quest. `english.course.yml` already encodes every content collection
(verified); the work is making the generators *read injected content* and fixing three
content-model gaps the exploration found.

## What's already in place (from Plan 1, on open-core main)

`@discoveryquest/course-loader` (`loadCourse`), `BOARD_REGISTRY`/`BOARD_GENERATORS` (vocab
boards only), `CourseQuest`/`CourseLesson`, the content-injected `genPictureMatch`/
`genVocabListen`, and the optional `lowercase`/`ui`/`reactions` course-meta schema. English
Quest's map is already the shared `engine-ui/TrailMap` (prior task). This plan extends all
of that to cover the rest of English Quest.

## The content-model fixes (the design-y part)

### 1. Phonemes get a `band`; cumulative bands without a loader change
Only `soundToLetter` has multiple band-stations (0/1/2), via a code-side **cumulative**
letter-group array (s,a,t,p,i,n ⊂ +m,d,g,o,c,k ⊂ all). `phonemes` carry no per-item band.

Fix: add `band` to each phoneme (the band it's *introduced* in: 0/1/2) and author the
`soundToLetter` stations with **inclusive** `bands` — `[0]`, `[0,1]`, `[0,1,2]`. The
loader's existing set-membership slice (`item.band ∈ station.bands`) then yields the
cumulative subset. **One loader tweak:** the difficulty hint passed to the generator
becomes `ctx.band = max(station.bands)` (not `bands[0]`), so casing/difficulty still scales
with the station's level. (`blendWord`/`wordFamily` each have a single band-0 station in
this course, so their grouping is moot here; `blendWords` may also get `band` tags for
consistency, `wordFamilies` already carry `band`.)

### 2. `parts_of_speech` restructured to role-keyed (it's currently lossy)
`genWordSort` needs words split by role (it picks a target of the asked role + distractors
from the other roles). The YAML's `parts_of_speech` is a **flat `words:` list that lost the
role mapping** — it cannot drive the generator. Restructure the collection to a role-keyed
wordbank:
```yaml
parts_of_speech:
  nouns:   [cat, dog, sun, …]
  verbs:   [run, jump, sit, …]
  adjectives: [big, small, hot, …]
```
`contentMeta.parts_of_speech` becomes a `wordbank` with three string-array fields; the 3
grammar generators receive this object and pick `items[role]` + distractors from the rest.

### 3. Multi-collection boards (`content` may be an array)
`sameOpp` draws from **both** `synonyms` and `antonyms` (+ their union for distractors).
Extend the registry: an entry's `content` may be a **string** (single collection, injected
as an array — unchanged) **or an array of names** (injected as an object
`{ [name]: slicedArray }`). The loader's `bindStation` handles both. `genSameOpposite`
receives `{ synonyms, antonyms }`. (Grammar's `parts_of_speech` is one collection that's
already an object — single-name, object-shaped — so it doesn't need the array form.)

### 4. Port the Reading world into the engine + YAML (no regression)
The deployed English Quest has a **playable Reading world** (Story Harbor) using
`reading.js` boards that are not engine boards and not in `english.course.yml` (which marks
reading `soon`). Port them so Reading is YAML-driven too:
- **Board kinds → one component.** `firstReader`, `mainIdea`, `findDetail`, `inference` are
  four board *kinds* that all render via the single `StoryReader` board (problems carry
  `kind: 'storyReader'`) — same pattern as `vocabListen`→`WordChoice`. **Backport
  `StoryReader.jsx`** to open-core `packages/english/src/boards/` (it's platform-only today).
- **Content collections.** Add to `contentMeta` + `english.course.yml`: `storyItems`
  (`{story, q, distractors[]}` for First Readers) and a comprehension bank for the other
  three (`{story, question, answer, distractors[]}` — one collection per board kind, or one
  `comprehension` collection band/type-tagged). The narrated wh-question prompts
  (`READING_QUESTION_LINES`, `rq-*`) become `narration` entries (voice clips already planned
  by gen-voice). All story/answer words reuse existing `word-<w>` clips.
- **Generators.** `genFirstReaders` + the `comprehension(items,…)` factory (mainIdea/
  findDetail/inference) refactor to `(items, ctx)` like the rest.
- **Boards/lessons.** `boardMeta` gains the 4 kinds (each `content:` its collection); the 4
  reading lessons (`first-readers`/`main-idea`/`find-detail`/`inference`) are authored as
  YAML lessons; the Reading world is un-`soon`ed with its 4 real stations.
- `BOARD_REGISTRY` gains 4 entries (all `board: StoryReader`).

## Generator refactor (the bulk, mechanical)

The remaining generators move from module-global closures to `(items, ctx)`, matching the
vocab contract (`band = ctx.band ?? 0`, `lower = ctx.lowercase ?? (band >= 2)`, display data
on the problem):
`genSoundToLetter`, `genBlend`, `genWordFamily`, `genDigraph`, `genSightWords`,
`genSameOpposite`, `genContextClues`, `genWordSort` (×3 categories), `genBuildSentence`,
`genPunctuation`, and the reading generators `genFirstReaders` + `comprehension`
(mainIdea/findDetail/inference). Their hardcoded arrays (`PHONEMES`/`BANDS`, `BLEND_BANDS`, `FAMILIES`,
`DIGRAPHS`, `SIGHT_WORDS`, `SYNONYMS`/`ANTONYMS`, `NOUNS/VERBS/ADJECTIVES`, `SENTENCES`,
`PUNCT_CORES`) are deleted (now in the YAML) or kept only as `node:test` fixtures. Each
refactor is TDD'd with a `node:test` like the vocab generators.

## Registry + app wiring

- `BOARD_GENERATORS`/`BOARD_REGISTRY` gain all 14 board kinds. Grammar = 3 entries each
  binding its category: `grammarNoun: { generate: (items, ctx) => genWordSort('noun', items, ctx), content: 'parts_of_speech', board: GrammarSort }` (verb/adj likewise). `sameOpp:
  { generate: genSameOpposite, content: ['synonyms','antonyms'], board: SameOpposite }`.
- `english.course.yml` gains English `ui` + `reactions` (mapping to English Quest's existing
  praise/oops/solved clips) so `CourseQuest` preserves the spoken reactions. `lowercase` is
  **omitted** (English Quest keeps its capitals-first-by-band casing via the `?? (band>=2)`
  fallback).
- English Quest's `App.jsx` switches from `PhonicsQuest` to `loadCourse(englishDoc,
  BOARD_REGISTRY)` + `CourseQuest` (+ `CourseLesson` for lessons). `PhonicsQuest.jsx` and the
  now-dead generator globals are retired. The TrailMap-based `MapScreen` already consumes
  `course.worlds`-shaped data (it took `WORLDS`; feed it `course.worlds`).

## Loader changes (small, additive)

1. `bindStation` difficulty hint: `ctx.band = Math.max(...station.bands)` (was `bands[0]`).
   Verify EFL still behaves (its stations are single-band, so `max` == the one value).
2. Multi-collection: when `registry[board].content` is an array, inject
   `Object.fromEntries(names.map(n => [n, sliceByBand(content[n], bands)]))`; else current
   single-array behavior. Add `node:test` cases.

## Cross-repo, verify, deploy

Author in open-core `discovery-quest` (canonical: contentMeta/gen-schema/english.course.yml/
content-english/boardRegistry/loader), `course:check english.course.yml` green +
`node:test` green + `validate`. Propagate to platform's copies; wire `apps/english-quest`'s
runtime; `npm run build` + `npm run smoke` + **puppeteer-screenshot** the full English Quest
flow (a phonics station, a grammar station, a same/opposite station, a lesson) — verify
behavior unchanged. Deploy `discoveryquest-english` on owner approval.

## Acceptance

- Editing `english.course.yml` changes English Quest (phoneme bands, word banks, sentences
  all data-driven).
- Behavior unchanged: same boards, same per-band phonics progression (s,a,t,p,i,n → +m,d,g,
  o,c,k → all), grammar/same-opposite/sentence/punctuation play identically, capitals-first
  casing preserved, English praise/oops reactions intact.
- `course:check` green for `english.course.yml`; `node:test`/`validate`/build/smoke green;
  puppeteer screenshots verified; EFL still green (loader `max(bands)` + multi-collection
  changes are backward-compatible). `PhonicsQuest` retired.
- Backported to open-core; deployed on approval.

## Out of scope (YAGNI)
- The **Speaking Studio** world — it is genuinely `soon` (no boards/content exist); it stays
  a `soon` world in the YAML, unchanged.
- Any *new* English Quest content or boards beyond porting what's already live.
- `reading.js`'s exact item wording is preserved verbatim (this is a faithful port, not a
  content rewrite).
