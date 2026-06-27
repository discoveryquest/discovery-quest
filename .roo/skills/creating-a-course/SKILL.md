---
name: creating-a-course
description: Use when authoring, adding, or extending a Discovery Quest course — a new quest/subject, a new world, station, "Learn it" lesson, word bank, or narration. Courses are YAML data (`<id>.course.yml`), not code; covers the format, the capability catalog, and validation with `course:check`.
---

# Creating a Discovery Quest course

## Overview

A **course** (a "quest" — Math, English, …) is **content, not code**. You compose
*board kinds* and *view kinds* the engine already ships and supply the words,
lessons, and narration. You never write game code to author a course.

**The one rule:** courses are authored as a single `<id>.course.yml` in this open
repo under `docs/specs/course-format/`, and the file must pass
`npm run course:check`. A brand-new *interaction* (a new board/view) is the only
thing that needs an engine code change — everything else is a YAML pull request.

> Full prose guide: `docs/authoring/COURSE-AUTHORING.md`. This skill is the
> fast path; read that doc for licensing, contribution, and detail.

## When to use

- Adding a new subject/quest, or a new world / station / lesson to an existing one.
- Adding word banks, sentences, or narration a board draws from.
- **Not** for adding a new interaction type (board/view) — that is a separate
  engine PR in `packages/<subject>`, not course data.

## Step 1 — Read the vocabulary (source of truth)

Each subject library ships two generated files. **Read them before authoring** —
they are the menu you compose from and the contract the validator enforces. If a
`board`/`view`/`content` id isn't in the catalog, you can't use it.

- `packages/<subject>/engine.capabilities.json` — every `board`, `view`, and
  `content` collection, each with description + fields (name, type, required, example).
- `packages/<subject>/course.schema.json` — JSON Schema generated from the catalog;
  what `course:check` validates against. Point an editor's `$schema` at it, or hand
  it to an LLM for reliable structured output.

List what's available:

```bash
node -e "const c=require('./packages/english/engine.capabilities.json'); \
  console.log('boards:', c.boards.map(b=>b.kind)); \
  console.log('views :', c.views.map(v=>v.kind)); \
  console.log('content:', c.content.map(x=>x.id))"
```

Existing live courses are the best examples — read
`docs/specs/course-format/{math,english,english-ru}.course.yml`.

## Step 2 — Author the YAML

A course is one document:

```
course
├─ formatVersion, id, title, subject, companion, voice, engine   (header)
├─ worlds[]                        a themed area on the map
│   └─ stations[]                  one playable activity
│        board:  <board kind>      ← must exist in the catalog
│        bands:  [0, 1, …]         difficulty bands the board generates
│        lesson: <lesson id>       ← must exist in `lessons` (the "Learn it")
│        content: <collection id>  (optional) ← must exist in `content`
├─ lessons{ <id>: … }              teaching beats shown before practice
│   └─ sections[].beats[]
│        say:     <narration key>  ← must exist in `narration`
│        caption: <text>           ← MUST equal narration[say] exactly
│        view: { kind: <view kind>, … props per the catalog }
├─ narration{ <key>: <spoken text> }
└─ content{ <collection>: … }      (optional) word banks / sentences
```

### Golden rules the validator enforces

1. Every `board` and every `view.kind` **must be in the capability catalog**.
2. Each view's props must match the catalog's field types — no typos, no extra
   props (the schema is strict).
3. **`beat.caption` must be character-for-character equal to `narration[beat.say]`**
   — what's shown must equal what's spoken (keeps audio + captions in sync).
4. Every `station.lesson`, every `station.content` (if present), and every
   `beat.say` must resolve to a defined entry.

### Worked example (passes `course:check` as-is)

```yaml
course:
  formatVersion: 1
  id: demo
  title: Demo Quest
  subject: English
  companion: luna
  voice:
    id: jessica
    profile: teaching-slow
  engine: '>=1.0'
  worlds:
    - id: phonics
      title: Phonics Cove
      emoji: 🐚
      color: '#22D3EE'
      blurb: Hear it, find the letter, read your first words.
      stations:
        - id: ph-set1
          title: First Sounds
          icon: 🅰️
          sub: s a t p i n
          board: soundToLetter      # ← a board kind from the catalog
          bands:
            - 0
          lesson: letter-sounds     # ← resolves to lessons.letter-sounds
  lessons:
    letter-sounds:
      title: Letter Sounds
      sections:
        - id: s
          label: S
          beats:
            - say: lph-2
              caption: This is the letter S. It says sss, like at the start of sun.
              view:
                kind: phoneme
                key: s
                letter: s
                word: sun
                emoji: ☀️
        - id: go
          label: Your turn
          beats:
            - say: lph-5
              caption: When you hear a sound, find the letter that makes it and tap it. Now you try!
              view:
                kind: letters
                key: go
                items: [s, a, t, p, i, 'n']
                active: 0
  narration:
    lph-2: This is the letter S. It says sss, like at the start of sun.
    lph-5: When you hear a sound, find the letter that makes it and tap it. Now you try!
```

Note every `caption` is identical to its `narration` line, and every
`board`/`view.kind` comes from the catalog.

**Emoji:** author the plain glyph (`emoji: 💪`, `icon: ⏰`). The app renders it as
an OpenMoji SVG; a maintainer regenerates bundled SVGs after new emoji are added.

## Step 3 — Validate

```bash
npm install                                                       # once
npm run course:check -- docs/specs/course-format/your.course.yml --app packages/<subject>
```

Success prints `✓ … [schema+semantic]`. Two layers run:

- **Structural** (JSON Schema): shape, prop types, every `board`/`view.kind` real.
- **Semantic**: `caption == narration[say]`, all references resolve. Audio is only
  checked with `--voice <app dir>` — **authors don't need it; maintainers generate audio.**

Read errors literally — each names the exact path
(e.g. `station ph-set1: lesson "x" not defined`, or `…: caption ≠ narration`).
Fix until green. After content changes, regenerate the changelog with
`npm run course:changelog`.

## Child-safety & originality (non-negotiable)

This is a product for young children. Every contribution must be age-appropriate,
accurate, and kind (nothing scary, violent, or mature), contain **no personal data
and no external links**, and be **your original work**. Narration stays short,
warm, and readable aloud. Contribution is open but **merge is gated** — maintainers
review every submission for pedagogy, accuracy, and age-appropriateness.

## Common mistakes

| Mistake | Fix |
|---|---|
| `caption` paraphrases the narration | Make it byte-identical to `narration[say]`. |
| Invented `board`/`view`/`content` id | Use only ids in `engine.capabilities.json`. |
| Extra/mistyped view prop | Schema is strict — match catalog field names/types exactly. |
| Building a course as JS in the private `platform` repo | Courses are YAML here; only new interactions are engine code. |
| Skipping validation | Always end on `npm run course:check` printing `✓ [schema+semantic]`. |

## Contribute it

Fork → add the `<id>.course.yml` → make `course:check` pass → commit with DCO
sign-off (`git commit -s`) → open a PR (template covers validation, child-safety,
originality, contributor terms). Content ships CC BY-SA 4.0; engine code AGPL-3.0.
