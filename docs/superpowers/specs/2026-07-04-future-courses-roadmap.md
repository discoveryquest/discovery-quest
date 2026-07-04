# Discovery Quest — Future Courses Roadmap

*Written 2026-07-04. Live courses: Math Quest, English Quest, EFL, Space Quest
(space.discoveryquest.app). This doc is the menu of what to build next; the first
pick — Logic Quest — has a full design spec at
`2026-07-04-logic-quest-design.md`.*

## What a new course costs today

The platform has converged: a course is **content + a handful of practice
mechanics**. Everything else is shared and proven:

- **Engine**: `@discoveryquest/engine` (save slots, XP/hero levels, device-wide
  profile registry, star gating), `engine-ui` (QuestHeader + HeroBadge, TrailMap,
  StationPopover, LessonScreen, LunaOwl, ProfileSetup/Picker), `voice-kit`
  (music with iOS-safe WebAudio ducking, Luna narration).
- **Content pipeline**: one `<course>.course.yml` (worlds → stations → lessons →
  practice bands), validated by `npm run course:check:<id>`; narration baked by
  gen-voice (ElevenLabs Jessica); `engine.capabilities.json` documents the
  view/board vocabulary for authoring models.
- **Ship path**: platform app under `apps/<id>-quest`, fly app
  `discoveryquest-<id>`, subdomain `<id>.discoveryquest.app` (Route 53 zone
  Z05360426VGJVO8M3TOV), card on the apex landing page.

So each course below is scoped by its **one new thing** — usually 2-4 new
interactive mechanics.

## Candidate courses (recommended order)

### 1. Logic Quest — creative thinking & puzzles ⭐ NEXT
Matchstick puzzles, count-the-triangles, pattern matrices, riddles, grid
deduction. Ages 6–10, 6 worlds ramping in difficulty. Full spec:
`2026-07-04-logic-quest-design.md`. New mechanics: matchstick (seven-segment
drag), shape-claim (tap vertices to claim triangles), pattern-pick, logic-grid.
Almost no domain art needed — puzzles are the art.

### 2. Code Quest — computational thinking (pre-coding)
Program a robot with tile commands (→ ↑ loop×3), predict where it lands, find
the bug in a broken program. Teaches sequencing, loops, debugging — no syntax.
One big new mechanic (tile-program runner + animated robot on a grid) reused
across every world; very high replay value. Pairs naturally with Logic Quest.

### 3. Nature Quest — life science
Animals & habitats, food chains, the human body, plants & seasons, weather.
Biggest reuse win: Space's scene kit (reveal hotspots with emoji, scrub
morphs — e.g. seed→sprout→flower as a starLife-style crossfade, sort-zones for
habitats) ports almost 1:1. OpenMoji gives a huge free art library. Content-heavy,
mechanic-light.

### 4. World Quest — geography & cultures
Continents, oceans, flags, landmarks, "children around the world". Mechanics:
drag-region-onto-map, flag match (quiz variant), landmark reveal. Needs one new
asset type (simple SVG maps). Strong parent appeal.

### 5. Time & Money Quest — practical life math
Read the clock (drag the hands — StateDial variant), count coins to pay,
calendar/sequencing of a day. Small, could even be a Math Quest world instead of
a standalone course — decide when closer.

### 6. Music Quest — rhythm & listening
Tap the rhythm back, high/low pitch, instrument families by sound. First course
where *audio is the content* — needs a small tone/sample kit beyond voice-kit.
Park until the catalog is wider.

### 7. Chess Quest — how pieces move, mate-in-1 puzzles
A board mechanic (legal-move highlighting) unlocks endless content. Niche-r
audience; good "advanced" course later.

## Cross-cutting rules for whoever builds these

- Follow the **cross-course consistency directive** (see memory
  `cross-course-consistency` + `docs/superpowers/2026-07-02-cross-course-consistency-review.md`):
  identical QuestHeader, StationPopover CTAs ("📖 Learn it" / Play), draggable
  corner Luna, star ceremony, map return flow.
- Known traps (all bitten before): framer-motion pinned **11.18.2** (v12 breaks
  Luna's beak / SVG transform-origin); practice `onCorrect` must be captured in
  a **ref**, never effect deps (Luna's `talking` re-renders cancel timers); SVG
  rotation via native `rotate(deg cx cy)` + spring, not CSS transform-origin;
  iOS volume only via voice-kit's WebAudio gain; **two-repo mirror** — any
  `packages/<course>` change in the open repo must be re-copied into platform.
- Never bake voice clips or record Luna-solve videos before Pavel approves the
  on-screen visuals (memory `verify-visuals-before-baking`).
