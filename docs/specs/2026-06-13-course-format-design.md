# Course format — a contributable, PR-able course package

Goal: anyone can add a course (or extend one) by submitting **declarative files** — no engine
code — so Discovery Quest becomes a real platform. This builds on the lesson format
(`2026-06-13-lesson-content-format.md`) and the open-source plan
(`2026-06-13-open-source-courses-idea.md`).

## The load-bearing idea: data vs. code (what a PR can change)

The system splits cleanly into a **fixed engine vocabulary** (code, maintained in the repo)
and **course content** (data, contributed via PR):

- **Engine vocabulary (code — maintainer PRs only):**
  - **board kinds** — the interactive question UIs + their problem generators
    (`soundToLetter`, `blendWord`, `pictureMatch`, `column`, `longdiv`, …). Each board kind
    declares the **content schema** it consumes.
  - **view kinds** — the lesson visuals (`phoneme`, `blend`, `objects`, `column`, `clock`, …).
  - the lesson **player**, quest **runtime/scoring**, companion, audio pipeline.
  These form a *versioned capability set*. Adding a NEW board or view is a code PR a
  maintainer reviews. Everything below is data.

- **Course content (data — anyone can PR):**
  - **curriculum** — worlds → stations; each station picks an existing `board` kind, its
    difficulty `bands`, and an optional `lesson`.
  - **lessons** ("Learn it") — a sequence of **beats**; each beat = one narration line +
    one `view` (from the view vocabulary).
  - **content** — the authored data a board's generator consumes (word lists, phoneme
    tables, sentence templates, cloze items, synonym/antonym pairs…), matching the board's
    content schema.
  - **narration** — every spoken line as text, keyed. Contributors write *text only*; a
    maintainer renders audio (gen-voice) on merge, so the TTS key is never exposed.

This is why courses are contributable: **you compose existing boards/views and supply data.**
A brand-new interaction is the only thing needing engine code.

## Format choice — **YAML** (authoring) + **JSON Schema** (validation)

Recommendation: **author courses in YAML.**
- human-authored by educators → readable; supports **comments** (pedagogy notes inline);
- clean diffs → reviewable PRs; multi-line strings for reading passages.
- JSON is the canonical/loader form (YAML ⇒ JSON 1:1); we ship a **JSON Schema** so editors
  validate as you type and CI validates on PR. (TOML was considered — great for flat config,
  awkward for the deep beat/section nesting.) The engine can load YAML or JSON.

## File layout — a course is a package

```
courses/<course-id>/
  course.yml        # manifest: id, title, subject, companion, voice, engine; worlds → stations
  lessons/*.yml     # "Learn it" lessons (beats)
  content/*.yml     # authored data per board kind (word banks, sentences, …)
  narration.yml     # line-id → text (every spoken line; audio is generated from these)
  assets/           # optional art/images
```
A single bundled `*.course.yml` (everything inline) is also valid — that's what the exporter
emits for inspection (`docs/specs/course-format/{math,english}.course.yml`).

## Schema (core types)

```yaml
course:
  formatVersion: 1           # SCHEMA version of this file (integer; see Versioning below)
  id: string                 # 'math', 'english-phonics', …
  title: string
  subject: string            # 'Mathematics', 'English', …
  companion: string          # mascot id (e.g. 'luna')
  voice: { id, profile }     # which voice + the teaching profile
  engine: ">=1.0"            # min engine CAPABILITY version (board/view kinds available)
  worlds: [ World ]
  lessons: { <lessonId>: Lesson }
  narration: { <lineId>: string }     # spoken text; built into audio
  content: { <contentId>: any }       # authored data, board-schema-shaped

World:
  id, title, emoji, color, blurb?
  soon?: bool                # whole world “coming soon”
  stations: [ Station ]

Station:
  id, title, icon, sub?
  board: <boardKind>         # MUST be an engine board kind
  bands: [int]               # difficulty bands the station plays
  lesson?: <lessonId>        # the "Learn it" shown first / replayable
  content?: <contentId>      # the authored data the board uses (if any)
  soon?: bool                # not-yet-built station (shown locked)

Lesson:
  title
  sections: [ { id, label, beats: [ Beat ] } ]

Beat:
  say: <lineId>              # narration clip key (∈ narration)
  caption: string            # on-screen text — MUST equal narration[say] (sync invariant)
  view: { kind: <viewKind>, key?, ...props }   # kind ∈ engine view vocabulary
  advance?: 'narration' | 'hold' | <ms>
```

**Invariants the validator enforces** (already implemented as `smoke-lessons` + `audit-content`):
1. `beat.caption == narration[beat.say]` (shown == spoken);
2. every `beat.say` has narration **and** a generated clip whose baked text matches (no stale audio);
3. every `view.kind` and `board` is in the engine vocabulary;
4. every `station.lesson`/`station.content` resolves; every playable station's `board` exists;
5. authored `content` validates against the board's content schema.

## Versioning & backward compatibility

Two independent version fields, because two different things change:

- **`formatVersion`** (integer) — the **schema shape** of the YAML itself. Bumped only on a
  *breaking* change (a renamed/removed/restructured field). Additive changes (a new optional
  field, a new view kind) do **not** bump it. Mirrors the engine's `SAVE_VERSION` + `migrate()`
  pattern: the loader supports a range `[MIN .. CURRENT]` and **migrates older courses forward**
  on load, so old course files keep working when we evolve the format. A course whose
  `formatVersion` is newer than the tooling supports is rejected with a clear "update your
  tooling" message (never silently mis-parsed).
- **`engine`** (semver range, e.g. `">=1.0"`) — the minimum **engine capability** the course
  needs (which board/view kinds exist). Orthogonal to the schema: a v1 course can require a
  newer engine if it uses a newly-added board.

Policy: prefer additive, non-breaking changes (no `formatVersion` bump). When a breaking change
is unavoidable, bump `formatVersion`, write a `migrate(courseV{n-1}) → courseV{n}` step, and keep
the previous N versions loadable. `course:check` validates `formatVersion` is present and within
the supported range.

## Contributor flow (the PR loop)

1. Fork → add/edit YAML under `courses/<id>/` (new world, station, lesson, or content).
2. `npm run course:check <id>` → JSON-Schema validate + run the smoke/audit invariants above.
3. Open PR. CI runs `course:check`. **Maintainers review pedagogy, age-appropriateness, safety**
   (it's a kids' product — open contribution, gated merge).
4. On merge, a maintainer runs `gen-voice` for any new narration (TTS key stays server-side);
   the audio manifest is committed.
5. Need a new interaction (board/view)? That's a separate **engine** PR (adds to the vocabulary
   + its content schema), reviewed for code quality.

## Why this fits math *and* English (proof)

Both apps already match this model — the export files show it:
- **Same view vocabulary** serves both (`column`, `objects`, `table` for math; `phoneme`,
  `blend`, `pair` for English) — all just `view.kind`s the engine renders.
- **Lessons are identical beat data** in both.
- **Curriculum is identical** (worlds → stations) in both.
- The only subject-specific surface is `content` (math is mostly engine-generated via its `qt`
  boards → little authored data; English is authored word banks/sentences) — exactly the
  contributable layer.

## Next steps to make it real (when we pursue it)
> Canonical, prioritised tracker: **`2026-06-13-platform-contribution-roadmap.md`**. The list
> below records what shipped + the format-level TODOs; the roadmap has the full priority order.

- ✅ Publish the **engine capability manifest / catalog** (`apps/<app>/engine.capabilities.json`:
  `{ version, boards, views }`, generated by `npm run course:capabilities` from the live board
  registry + lesson views + co-located catalog metadata). `course:check` loads it to validate a
  course's `board`/`view.kind`; both math (43 boards) and English (13 boards) validate with no
  unverified warnings. Each board/view entry now carries a **description + `fields`** (name,
  type, required, `example`), so the manifest doubles as the contributor catalog of building
  blocks. Catalog metadata lives next to the code it documents (`lessons/viewMeta.js`,
  `boardMeta.js`, `questionTypes/rendererMeta.js`); `gen-capabilities` enforces that every
  rendered view/board has metadata and vice-versa (no orphans), and the `smoke --check` gate
  catches a stale manifest. Math boards are flagged `generated: true` with their `renderer`
  (a contributor supplies no data, just bands); English boards name the `content` list + item
  shape they consume.
  - **Fast-follow (deferred):** a `/catalog` gallery route that mounts each view/board with its
    `example` props, captured by Playwright into per-entry screenshots — the `example` fields are
    already the fixtures. Then attach a `screenshot` path per entry.
- ✅ Compile the catalog into a **JSON Schema** (`apps/<app>/course.schema.json`, generated by
  `npm run course:schema` from `engine.capabilities.json`). It validates course/world/station/
  lesson/beat **structure**, `station.board` + `beat.view.kind` against the engine enums, and
  each view's **props** (required + types, with typo'd props rejected via `additionalProperties`).
  `course:check` runs it through AJV as the structural layer **before** the semantic layer
  (cross-references + audio freshness, which a schema can't express). One artifact, three
  consumers: editors (`$schema` autocomplete), CI (`course:check`), and **LLMs** (feed it as a
  structured-output / tool schema so AI generates valid courses, not just gets validated after).
  The `smoke` gate keeps it fresh (`gen-schema --check`). Optional fields accept `null` (matches
  how the exporter serialises "no value").
- ✅ Validate authored **`content` collections** by item shape. The catalog now carries a
  `content` section (`apps/english-quest/src/contentMeta.js` → manifest → schema); each known
  collection is validated against its item shape — object lists (`phonemes`, `digraphs`, `vocab`),
  string lists (`blendWords`, `sightWords`), and a word-bank (`parts_of_speech`). Unknown
  collections are permitted but `course:check` **warns** they went unvalidated. Math has no
  authored content (engine-generated), so its `content` stays unconstrained.
  - ✅ All authored-content boards are now data-driven: the 5 remaining banks were surfaced as
    editable collections — `wordFamilies`, `synonyms`, `antonyms`, `contextClues`, `sentences`,
    `punctuationCores` (12 English collections total). The terse engine fields were renamed to
    contributor-friendly ones in the export (`{s,a,d}` → `{sentence,answer,distractors}`; word-pair
    tuples → `{word,match}`), so the YAML is the clean contributable representation and a future
    loader maps back. Every English board's data can now be customised in a course PR.
  - Still TODO: a content **correctness/safety** gate — schema proves *shape*, never *truth* or
    age-appropriateness. This is the real risk for AI-generated, kid-facing content, and it's a
    different mechanism (LLM-graded rubric + human sign-off), not more schema.
- Add a `courses/` loader so a course package boots an app (today content is imported modules;
  the loader reads the YAML/JSON and feeds the same engine).
- `CONTRIBUTING.md` + a content/pedagogy style guide; licensing decided — engine **AGPL-3.0**,
  content **CC BY-SA 4.0**, contributions via CLA (see `LICENSING.md`).
- A `course:check` CLI wrapping schema-validate + the existing smoke/audit.
