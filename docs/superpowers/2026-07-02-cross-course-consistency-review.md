# Cross-course consistency review (math / english / english-ru / space)

**Goal (from Pavel):** all "infrastructure" identical across courses — popup displays,
button copy & CTAs, Luna's position and voice, header bar, the winning-a-step
experience, and continue-on-map flow. DRY as much as possible.

## Root cause first: two repos, one vendored snapshot

Space lives in the `discoveryquest` repo with a **vendored copy** of `engine-ui`,
`engine`, `voice-kit`; math/english/english-ru live in `platform` with the canonical
copies. There is no mechanism keeping them in sync, and they have already drifted:

- `LessonScreen.jsx`: **platform is ahead** — it gained `onClose` and Waze-style
  `autoAdvance` (lesson finishes → CTA fills → practice auto-starts). Space's copy
  predates both.
- `framer-motion`: the space workspace hoisted **v12** while platform runs **11.18.2**;
  v12's SVG transform-origin change is exactly what broke Luna's beak ("nose jumping").
  Fixed 2026-07-02 by pinning 11.18.2, but it shows how silently this drifts.
- Everything else in engine-ui is byte-identical today — by luck, not by design.

**Every other fix below is a band-aid until the source of truth is unified** (move
space into `platform/packages` like english, or publish engine-ui as a real shared
package). This needs a repo-strategy decision.

## Surface-by-surface findings

| Surface | math | english (+ru) | space | Verdict |
|---|---|---|---|---|
| Trail map | shared TrailMap | shared TrailMap | shared TrailMap | ✅ consistent |
| Map header bar | QuestHeader + HeroBadge | QuestHeader + HeroBadge | **none** — no hero XP badge, no settings sheet, no "More quests" | ❌ space must adopt QuestHeader |
| Station popover | **custom** popover + first-visit learn→watch→play flow | shared StationPopover | shared StationPopover | ❌ math is the odd one out |
| Lesson popup | own ConceptScreen/lessons.jsx + video modal | shared LessonScreen (with autoAdvance) | shared LessonScreen (**stale copy**) | ⚠️ re-vendor space; math converges later |
| Practice host | QuestScreen (1,588 lines) | CourseQuest (140) | PracticeScreen (260) + QuizScreen (171) | ❌ four implementations of one shape |
| Luna position | draggable roaming layer, idle bob, tap-chat, hint flights | **static, centered above the board** | practice: math-style (since today); quiz: drag but no constraints layer | ❌ standardize on math's wrapper |
| Luna voice | Jessica (ElevenLabs, PREFERRED list) | same pipeline | Jessica (vendored gen-voice copy) | ✅ voice; ⚠️ script duplicated |
| Win-a-step | praise bubble + confetti + point floaters + streaks; end-of-quest **star ceremony**; autoNext on map | praise + done screen (heading/stars/back) | praise + done screen (same shape, different copy) | ⚠️ shape agrees (stars + back), richness doesn't |
| CTA copy | hardcoded strings | `course.meta.ui` overrides ("Great job!", "Back to the map") | `course.meta.ui` overrides ("Mission complete!", "Back to the star map") | ⚠️ mechanism should be one; theme flavor per course is fine |
| "Watch Luna" tutorial modal | math MapScreen video modal | – | reimplemented inside PracticeScreen | ❌ extract shared TutorialModal |
| Dead code | – | – | old 3D-era files still in tree: `Hud.jsx`, `StationLesson.jsx`, `DiscoveryDeck.jsx`, `StarChart.jsx`, `SpaceQuest.jsx`, `gates/*`, `store/*` | 🧹 delete |

Notable: **english's Luna is not draggable and sits mid-layout** — the exact thing
just fixed in space ("helper, not main") applies to english too.

## Recommended plan (ordered)

1. **Decide the repo strategy** (gates everything): fold space into
   `platform/packages/space` next to english, or make engine-ui a genuinely shared
   package both repos consume. Until then, treat platform's engine-ui as canonical
   and re-vendor into space on every engine-ui change.
2. **Space quick wins** (no design questions, do now):
   - Re-vendor platform's `LessonScreen` (gets `onClose` + Waze auto-advance).
   - Adopt `QuestHeader` + `HeroBadge` + settings sheet on the space map.
   - Give space `QuizScreen`'s Luna the same wrapper as PracticeScreen.
   - Delete the dead 3D-era files.
3. **Extract shared components into engine-ui** (then adopt everywhere):
   - `LunaCompanion` — math's draggable roaming owl + bubble layer, as one component.
   - `StarsDoneScreen` — heading + 3 stars + score line + back-to-map CTA, strings
     from `course.meta.ui`.
   - `TutorialModal` — the "Watch Luna solve it" video popup (math + space share it).
   - Adopt in english too (its Luna becomes the draggable corner companion).
4. **One strings mechanism**: converge on `course.meta.ui` keys + shared defaults;
   move math's hardcoded copy onto it. Course-flavored words stay ("star map" vs
   "map"), the mechanism and button styling become identical.
5. **Win-flow target = math's**: per-step praise, end ceremony with stars, and
   autoNext continue-on-map. Port the ceremony into the shared kit and let english
   and space use it, rather than dumbing math down.

## Status

- Review done 2026-07-02. No consolidation implemented yet — awaiting repo-strategy
  decision (item 1) and go-ahead on quick wins (item 2).
