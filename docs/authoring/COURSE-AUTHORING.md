# Authoring a Discovery Quest course

> **How to use this guide.** You can follow it by hand, or **paste this whole file
> into an AI assistant** (ChatGPT, Claude, …) and ask it to help you author a
> course. Everything an LLM needs to produce a *valid* course is here. The golden
> test is the same either way: your course file must pass `npm run course:check`.

Discovery Quest is an open kids' learning platform. A **course** (a "quest" —
Math, English, …) is **content, not code**: you compose interaction types the
engine already provides and supply the words, lessons, and narration. You never
write game code to author a course. A brand-new *interaction* is the only thing
that needs an engine change; everything else is a content pull request an AI can
draft and the validator can check.

---

## 1. The one idea: courses are data

The system splits cleanly in two:

- **Engine vocabulary (code, fixed):** *board kinds* (the interactive question
  UIs), *view kinds* (lesson visuals), the lesson player, scoring, the owl
  companion, audio. You **compose** these — you don't write them.
- **Course (data, what you author):** worlds → stations, "Learn it" lessons made
  of beats, the word banks / sentences a board draws from, and the narration text.

## 2. The vocabulary lives in two generated files

Each subject library (`packages/math`, `packages/english`, …) ships two files
that are the source of truth. **Read them before authoring** — they're the menu
you compose from and the contract the validator enforces.

- **`packages/<subject>/engine.capabilities.json`** — the **capability catalog**:
  every `board`, `view`, and `content` collection the engine supports, each with
  a description and its fields (name, type, required, example). If it's not in
  here, you can't use it.
- **`packages/<subject>/course.schema.json`** — a JSON Schema generated from the
  catalog. It's what `course:check` validates against, and it's the perfect
  context to hand an LLM for reliable structured output. (You can point an
  editor's `$schema` at it for inline autocomplete too.)

To list what's available:

```bash
node -e "const c=require('./packages/english/engine.capabilities.json'); \
  console.log('boards:', c.boards.map(b=>b.kind)); \
  console.log('views :', c.views.map(v=>v.kind)); \
  console.log('content:', c.content.map(x=>x.id))"
```

## 3. Course anatomy

A course is one YAML (or JSON) document:

```
course
├─ formatVersion, id, title, subject, companion, voice, engine   (header)
├─ worlds[]                         a themed area on the map
│   └─ stations[]                   one playable activity
│        board:  <board kind>       ← must exist in the catalog
│        bands:  [0, 1, …]          difficulty bands the board generates
│        lesson: <lesson id>        ← must exist in `lessons` (the "Learn it")
│        content: <collection id>   (optional) ← must exist in `content`
├─ lessons{ <id>: … }               the teaching beats shown before practice
│   └─ sections[].beats[]
│        say:     <narration key>   ← must exist in `narration`
│        caption: <text>            ← MUST equal narration[say] exactly
│        view: { kind: <view kind>, … props per the catalog }
├─ narration{ <key>: <spoken text> }  every line the companion says
└─ content{ <collection>: … }       (optional) word banks / sentences a board uses
```

### The golden rules the validator enforces

1. Every `board` and every `view.kind` **must be in the capability catalog**.
2. Each view's props must match the catalog's field types (no typos, no extras —
   the schema is strict).
3. **`beat.caption` must exactly equal `narration[beat.say]`** — what's shown must
   equal what's spoken (this keeps audio and captions in sync).
4. Every `station.lesson` resolves to a `lessons` entry; every `station.content`
   (if present) resolves to a `content` entry; every `beat.say` resolves to a
   `narration` line.

## 4. A complete, validated worked example

This is a real, minimal English course — one world, one station, its "Learn it"
lesson, and the narration. It **passes `course:check`** as-is. Use it as a
template; swap in your own world, station, lesson beats, and narration.

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
        - id: sounds
          label: All sounds
          beats:
            - say: lph-0
              caption: Here are all our letter sounds. Tap any letter to hear the sound it makes!
              advance: hold
              view:
                kind: soundboard    # ← a view kind from the catalog
                key: board
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
    lph-0: Here are all our letter sounds. Tap any letter to hear the sound it makes!
    lph-2: This is the letter S. It says sss, like at the start of sun.
    lph-5: When you hear a sound, find the letter that makes it and tap it. Now you try!
```

Notice every `caption` is **identical** to its `narration` line, and every
`board`/`view.kind` (`soundToLetter`, `soundboard`, `phoneme`, `letters`) comes
from the catalog. The catalog also includes foreign-language boards like
`pictureMatch`, `vocabListen`, and `sentenceRu` (sentence construction from
scrambled tiles, for non-native courses) — run the snippet above to see the full
current list.

## 5. Validate before you submit

```bash
npm install                                                       # once
npm run course:check -- path/to/your.course.yml --app packages/english
```

`course:check` runs two layers and prints `✓ … [schema+semantic]` on success:

- **Structural** (JSON Schema): shape, types, that every `board`/`view.kind` is
  real, and that each view's props are well-typed.
- **Semantic**: `caption == narration[say]`, all references resolve, and (only
  when run with `--voice <app dir>`) that each narration line has fresh audio.
  Authoring content? You don't need `--voice` — audio is generated by maintainers.

Read the errors literally — each names the exact path (e.g.
`station ph-set1: lesson "x" not defined`, or `…: caption ≠ narration`). Fix
until it's green.

## 6. Child-safety & originality rules (non-negotiable)

This is a product for young children. Every contribution must:

- Be **age-appropriate**, accurate, and kind. No scary, violent, or mature content.
- Contain **no personal data** and **no external links**.
- Be **your original work** (or content you have the rights to). Don't copy
  copyrighted passages, characters, or images.
- Keep narration short, warm, and readable aloud.

Contribution is open, but **merge is gated**: maintainers review every submission
for pedagogy, accuracy, and age-appropriateness before it ships.

## 7. How to contribute it

1. **Fork** `github.com/discoveryquest/discovery-quest` and clone your fork.
2. `npm install`, then add your course file (e.g. under the subject you're
   extending).
3. Make `npm run course:check -- <file> --app packages/<subject>` pass.
4. Commit with a **DCO sign-off**: `git commit -s -m "…"`.
5. Open a **pull request** — the template walks you through the validation,
   child-safety, originality, and contributor-terms checklist.

### Licensing (what you're agreeing to)

By contributing you keep your copyright and credit, and you agree to the terms in
[`LICENSING.md`](../../LICENSING.md): course **content** ships under
**CC BY-SA 4.0**, engine **code** under **AGPL-3.0**, and you grant Discovery
Quest a broad license (including commercial use in the hosted product) via the
CLA. Questions or commercial licensing: **hello@discoveryquest.app**.

---

### Quick checklist for an AI drafting a course

- [ ] Use **only** `board`/`view.kind`/`content` ids that exist in
      `engine.capabilities.json`.
- [ ] Every `beat.caption` is character-for-character equal to its `narration` line.
- [ ] Every `station.lesson`/`station.content` and every `beat.say` resolves.
- [ ] View props match the catalog's field types; no extra props.
- [ ] Content is original, age-appropriate, no PII, no external links.
- [ ] `npm run course:check` prints `✓ … [schema+semantic]`.
