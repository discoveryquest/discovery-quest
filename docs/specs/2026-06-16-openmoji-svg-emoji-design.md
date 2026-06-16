# OpenMoji SVG-emoji rendering

**Date:** 2026-06-16 · **Status:** designed (approved direction; spec under review). Swap the
app's **native emoji glyphs** for **OpenMoji SVGs** so icons render identically across platforms
(today Apple/Google/Windows/Android each draw emoji differently — a brand-consistency hole), scale
crisply, and become stylable. Keep authoring trivial (course YAML still uses the emoji character)
and keep `lucide-react` for UI chrome. Motivated by Release 3 authoring, where abstract grammar/
vocab stations had no precise native glyph (see [[english-curriculum]]).

## Why OpenMoji (decided)
User-chosen. OpenMoji is an open, distinctive SVG emoji set (CC-BY-SA 4.0, ~4000 glyphs, color +
black variants). Trade-off vs Twemoji (CC-BY 4.0, flatter/familiar): OpenMoji has a hand-drawn
brand character and a copyleft-but-open license that fits an open course project. **License: must
attribute** (CC-BY-SA) — add a CREDITS line in-app + a NOTICE file.

## Scope
- **In:** the shared, span-rendered emoji sites — world emoji, station icons, lesson-view emoji,
  picture-match vocabulary, the correct-answer reveal. These all render as `<span class="text-Nxl">
  {emoji}</span>` in `engine-ui` + `packages/english`, so one `<Emoji>` component covers them.
- **Deferred (follow-up):** math's **string-template** emoji (`` `${w.emoji} ${title}` ``,
  repeated `{p.emoji} {p.emoji}` in `boardsFacts.jsx`/`QuestScreen.jsx`) — these concatenate the
  glyph into a string, so they can't take a React component without a small refactor. Leave them
  **native** for now (they still render fine); revisit when math gets the same polish pass.
- **Unchanged:** `lucide-react` icons (Lock, Check, RotateCcw, X, Play…) — correct tool for chrome.

## Architecture

### 1. `<Emoji>` component (`packages/engine-ui/src/Emoji.jsx`, NEW)
Props: `char` (the emoji string, e.g. "💪"), `className`/`size` (to match the existing `text-Nxl`
sizing at each call site), optional `title`.
- **Codepoint → filename:** convert `char` to OpenMoji's filename: split into Unicode code points,
  uppercase hex, join with `-`, **drop the `FE0F` variation selector** (OpenMoji omits it, as does
  Twemoji), e.g. "💪"→`1F4AA`, "⬅️"(2B05 FE0F)→`2B05`, "🤝"→`1F91D`. A tiny pure helper
  `emojiToCodepoints(char)` (unit-tested) does this; handle ZWJ sequences + skin-tone modifiers by
  joining all code points (rare in our content).
- **Render:** `<img src="${base}/openmoji/<cp>.svg" alt={char} className=… draggable=false />`,
  where `base` is the app's public root. Size via className (e.g. `h-12 w-12` to replace `text-5xl`).
- **Fallback (never break):** `onError` → swap to rendering the **native `{char}`** in a span (so a
  missing/unsupported glyph degrades to today's behavior). Also fall back when `emojiToCodepoints`
  yields nothing.
- **Accessibility:** `alt`/`aria-label` = the native char (or a provided `title`).

### 2. Asset build step (`scripts/gen-emoji-assets.mjs`, NEW) — bundle only used emoji
- **Source:** add **`openmoji`** as a repo **devDependency** (ships the SVGs), or vendor the
  `openmoji/color/svg/` set under a build-only path. (npm dev-dep is the repeatable choice.)
- **Scan:** walk the course YAMLs (`docs/specs/course-format/*.course.yml` and each vendored
  `packages/<subject>/*.course.yml`) and extract every emoji character (a Unicode-emoji regex /
  `Intl.Segmenter`), de-dupe → the used set.
- **Copy:** for each used emoji, compute the codepoint filename and copy the matching OpenMoji SVG
  into `apps/<app>/public/openmoji/<cp>.svg`. Warn (don't fail) on any used emoji with no OpenMoji
  match (it'll fall back to native at runtime). Print `N copied, M unmatched`.
- **Commit the output** (like voice clips — assets live in the app shell, generated once, served
  statically). Tiny: ~50–100 files, a few KB each.
- Run manually (documented) and/or wire as a `prebuild`; mirror the gen-voice convention.

### 3. Swap the render sites (engine-ui + english)
Replace the raw `{emoji}`/`{icon}` text with `<Emoji char={…} className={…} />` at:
`engine-ui/TrailMap.jsx` (world.emoji, station icon), `engine-ui/StationPopover.jsx` (station.icon),
`english/CourseQuest.jsx` (reveal.emoji), `english/boards/PictureMatch.jsx` (step.emoji),
`english/lessons/views.jsx` (Picture/Phoneme/Team/etc. view emoji). Match current sizing. The
`lucide` `Lock` branch in TrailMap stays.

## Verification
1. **Unit:** `emojiToCodepoints` test — single (💪→1F4AA), variation-selector strip (⬅️→2B05),
   multi-codepoint, and empty/non-emoji input.
2. **Build:** run `gen-emoji-assets`; assert N SVGs written for the used set; 0 *crashes* on
   unmatched (warn only).
3. **Browser (English):** map + a lesson + a picture-match render **OpenMoji SVGs** (assert an
   `<img src*="/openmoji/">` exists, not a bare glyph), zero console errors, and **no external
   network requests** (fully self-hosted/offline). Screenshot a before/after.
4. **Live:** deploy English Quest; `curl -sI …/openmoji/<cp>.svg` → 200 `image/svg+xml`; real
   click-through.
5. **License:** CREDITS/NOTICE present.

## Open-core & docs
- `<Emoji>` + the build step are engine/tooling → author in **discovery-quest** (canonical), vendor
  to **platform**. Document in `docs/authoring/COURSE-AUTHORING.md` (authoring stays emoji-char;
  note the SVG render + the build step) and add the OpenMoji attribution.
- Rollout is a shared `engine-ui` change → math/EFL get consistent SVG emoji too (minus math's
  deferred string-template sites).

## YAGNI / non-goals
- No emoji **picker** or per-course theme. No recoloring/animation yet (the component just unlocks
  it). No replacing `pictureMatch`'s emoji *vocabulary* with a different icon set — OpenMoji keeps
  the same vocabulary, just as SVG. Math string-template sites deferred.
