# Lesson content format ("Learn it") — the contributable schema

The structure for **"Learn it" lessons**, shared by every quest app (math, English, …).
Designed so course content is **declarative data** an author can write/extend without
touching the engine — the basis for open-sourcing courses (see
`2026-06-13-open-source-courses-idea.md`). Live examples: math-quest (41 lessons across 10
worlds) and english-quest (Phonics) both follow this exact shape.

## The split
- **Engine (shared, content-agnostic):** `@discoveryquest/engine-ui/LessonScreen`. A lesson is a
  sequence of **beats**; each beat speaks one narration line over one visual and advances
  when the line ends (so animation stays synced to voice). The engine never knows the
  subject — the app passes it `lesson` data + a `renderView(view)` function.
- **Content (per app, declarative):** lives in `apps/<app>/src/lessons/`.

## Per-app file layout (identical across apps)
```
apps/<app>/src/lessons/
  lines.js        # narration text, keyed (PLAIN JS — shared with the node gen-voice script)
  views.jsx       # renderLessonView(view): view.kind → a visual node (subject-specific)
  <topic>.js      # lesson data (beats) for a world/topic; imports LESSON_LINES for captions
apps/<app>/src/lessons.jsx   # index: aggregates topics into LESSONS, re-exports renderLessonView
```

## Data schema
```
lesson  = { title, sections: [ section ] }
section = { id, label, beats: [ beat ] }
beat    = { say, caption, view, advance? }
  say:     clip-id in LESSON_LINES (the narration audio key)
  caption: the on-screen text — MUST equal LESSON_LINES[say] (use the `b()` helper)
  view:    { kind, key?, ...props }  — `key` groups beats sharing one scene (persists &
           animates across them); a new key cross-fades. `kind` must be handled by the
           app's renderLessonView.
  advance: 'narration' (default — when the clip ends) | <ms> (for silent beats)
```
Authoring helper (per topic file): `const b = (say, view) => ({ say, caption: L[say], view });`
keeps caption and spoken line from ever drifting.

## Narration & audio
- Text lives once, in `lines.js` (`LESSON_LINES`), plain JS so both the app and the node
  `gen-voice.mjs` import it.
- `gen-voice` renders each line with the **slow/warm teaching profile** and writes
  `public/voice/<voice>/manifest.json` (the text baked into each clip). It regenerates a
  clip when its text changes — not just when the file is missing.

## Validation (every commit) — `scripts/smoke-lessons.mjs`, in `npm run smoke`
Static, no browser, fast. Fails the build if content drifts out of sync:
1. every beat's `say` exists in `LESSON_LINES`;
2. `caption === LESSON_LINES[say]` (shown == spoken);
3. the clip exists **and** its manifest (baked) text matches the line — catches a line
   edited without re-voicing;
4. every `view.kind` is handled by `renderLessonView`;
5. every curriculum `lesson:` resolves to a defined lesson.
A deeper, on-demand runtime check (`npm run voice-sync`, Playwright) actually plays a
lesson and asserts the caption matches the clip being spoken and beats advance at narration
end.

## Wiring a lesson to a station
A curriculum station references a lesson by id: `{ …, lesson: 'letter-sounds' }`. The app
shows the lesson on first visit (gated by `save.conceptSeen`), then routes into the quest;
a "Learn it" affordance replays it.

## To add a lesson (contributor steps)
1. Add narration lines to `lines.js`.
2. Add the lesson's beats in a topic file (or new file), using existing `view.kind`s — or
   add a new `kind` to `views.jsx` if a new visual is needed.
3. Register it in `src/lessons.jsx` and point a curriculum station at it.
4. `node scripts/gen-voice.mjs` to render the new clips.
5. `npm run smoke` — the lesson-sync guard must pass.

## Not yet (open-source hardening — see the open-source idea doc)
Extracting this into a standalone documented **schema package** + a `CONTRIBUTING`/pedagogy
guide + content licensing + a maintainer review flow. The format above is already stable
and proven across two apps; those are the packaging steps when we choose to open it.
