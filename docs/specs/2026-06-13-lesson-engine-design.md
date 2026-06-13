# Lesson Engine — design

The "Learn it" experience is the **substance** of the game (the gamification is the
shell). This replaces the 15-second animated *hints* with real, synced, multi-example
**lessons** that the founder authors and Claude implements. Lives in `@discoveryquest/engine-ui`
so every game reuses it (math, English Phonics, …).

## Why the current approach can't get there
Today a concept rep is one small animation + one narration clip on **independent
timers**, so they never reliably line up (the recurring counting / take-away / groups
sync complaints are structural, not bugs). And a single 15s clip can't *teach* — no
room to build a concept, show several examples, or go at a kid's pace.

## Core model: a lesson is a sequence of BEATS
A **beat** is the atomic teaching moment — one thing Luna says while one thing is on
screen. Sync is guaranteed because the visual is driven *by* the narration, beat by beat.

```
Lesson = {
  id, title,
  sections: [                      // named groups → the chapter/scrub bar
    { id, label, beats: [ Beat ] }
  ]
}

Beat = {
  say:   <clip key | [keys]>,      // narration for THIS moment (author writes the text)
  caption?: <short on-screen text>,
  view:  { kind, ...props,         // declarative visual STATE for this beat…
           highlight?, emphasize? },// …the bit that's synced to the words
  advance: 'narration' | <ms>,     // when to move on — default: when this clip ENDS
}
```

**Playback (the engine):** for each beat → render `view`, `speak(beat.say)`, then advance
when the narration finishes (`isSpeaking` goes false) or after `advance` ms for a silent
beat. Hands-free, with the controls we already built: pause/resume, a **scrub bar over the
sections** (tap to jump/replay), **↺ watch-again** at the end, ✕ close, hush-on-close.

**The sync guarantee:** "five" lights up the 5th apple because saying "five" *is* its own
beat, and the next beat only starts when that clip ends. No timer guessing.

**More examples / deeper teaching are free:** they're just more beats / more sections.

## Visual system (per topic, declarative)
Each beat's `view` is rendered by a small **parameterized primitive** that animates the
*difference* between consecutive beats' states (framer `layout` / transitions). We reuse
what we built as primitives:
- `Objects` — countable items (apples, stars) with per-item `highlight`
- `CubeTower` (from CombineBlocks), `Pairs` (from EvenOddDots), `NumberLine` (from
  NumberLineHint), `TenFrame`, plus new ones we'll need: `ColumnGrid` (column add/sub/mul
  with carries/borrows), `Array`/`Groups`, `TimesTable` (highlight row/col/cell).
A beat names a primitive + props + the `highlight` that's synced to the words.

## Authoring (where the founder's creativity lives)
A lesson is **data** — a script of beats (the narration text + what's on screen +
highlights). Authorable without deep React. Workflow:
1. **Founder writes/edits the beat script** (Luna's words + the on-screen intent).
2. Claude maps each line to a clip — **reusing existing clips** (numbers `n-1..n-20`,
   fragments) where possible, flagging new lines.
3. One **`gen-voice` run** generates all the new lines (ElevenLabs).
4. It plays back perfectly synced.

(First script: `2026-06-13-counting-lesson-script.md`.)

## Narration / voice
Real lessons mean longer, warmer narration. **Gut-check the voice** ("Jessica") for a
60–120s lesson; audition another if it feels thin. Build step collects all lesson lines →
gen-voice (dedupe against existing clips).

## Teaching frameworks we build on
- **CRA**: Concrete → Representational → Abstract (objects → number line / ten-frame →
  symbols). This is the spine of every lesson and matches the founder's cubes→line→symbols
  instinct.
- **Numberblocks** (cube manipulatives), **Singapore bar models**, **number talks**.
- Claude can research topic-specific creative angles while drafting each script.

## Video (Veo3)? — not for the math
Generated video garbles digits/equations, can't be parameterized for more examples, and
can't sync to narration. **Code animation owns the math.** Veo3 is only a candidate for a
short emotional **hook** per world (a real-world moment), never the working — flagged
case-by-case.

## Relationship to today's code
- Supersedes the `CONCEPTS` rep-tabs model; the chaptered ConceptScreen UI becomes the
  **lesson player shell** (controls reused).
- Fixes the curriculum mapping (see review log): Times Table Trail = concept/facts
  lessons; Multiplication Mountain = **column-multiply / long-division algorithm** lessons
  (new), not the Groups & Arrays rep.

## Scope — depth-first
- **P1:** build the engine + ship **one flagship lesson (Counting)** end-to-end, synced —
  the template + proof.
- **P2:** author the foundational lessons (Addition, Place value, Multiplication-as-groups)
  on the template.
- **P3:** the algorithm lessons (column add/sub/mul, long division) + the rest, retiring the
  15s reps as each topic is replaced.

## Open questions for the founder
- Voice for longer lessons (keep Jessica / audition?).
- Target lesson length (~60–120s?).
- Authoring split — Claude drafts each script, founder rewrites in their voice (assumed).
