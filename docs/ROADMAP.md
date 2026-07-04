# Discovery Quest — Master Roadmap

Living checklist so nothing gets lost (Pavel, 2026-07-04). Check items off as
they ship; add new ones at the bottom of the right section. Platform-repo
items are marked `[platform]`.

## Space Quest — 3D upgrade

- [x] 3D bodies kit: textured planets, real physics, rings, atmospheres, asteroid belt, Milky Way (2026-07-04)
- [x] All six practice mechanics full-screen 3D, drag-and-drop, hover hints, portrait scaling (2026-07-04)
- [x] Zero emojis in practice — procedural 3D models for all 73 course item ids (2026-07-04)
- [x] Live on space.discoveryquest.app (fiber 8 / react 18 build) (2026-07-04)
- [x] Phone polish: header collisions, Luna overlap, map returns to next step (2026-07-04)
- [x] Math-style quest header: Map button + live star tally (2026-07-04)
- [x] **Learn-it lessons in 3D** — all scene kinds (Body/Orbit/Spin/MoonPhase/SeasonOrbit/Fall/Field/Launch/Reveal/Compare/StarLife/Scrub) on the bodies kit; live on prod (2026-07-04)
- [ ] Record "Watch Luna solve it" tutorials against the 3D screens (tutorials.json is cleared until then)
- [ ] Map screen with 3D flavor / map art
- [ ] Code-split three.js (bundle is 417 KB gzip)
- [ ] Full 14-station prod E2E driver (only moon-phases spot-checked live)
- [ ] Learn-it cinematic flourishes: bloom, lens flare, comet tails (SoumyaEXE repo ideas)
- [ ] Solar System Scope attribution in app credits (CC BY 4.0 — required)

## Cross-course profiles, XP & badges (decisions locked 2026-07-04)

- [ ] `[platform]` Wire syncQuest/syncRoster into math, space, logic apps (only english/english-ru sync today)
- [ ] Tap-the-⭐ breakdown sheet (shared engine-ui): XP by source + per-station contributions (engine xpByStation exists) + badges
- [ ] Hero badges: course Hero = every station ≥1 star (gold at all-3-star); **Super Hero at 3 course badges**; Luna celebration; show in kid sheet + grown-ups Dashboard
- [ ] Cross-course continuity requires an account (Clerk sync is the bridge; subdomains stay)

## Trailers & YouTube

- [ ] "What will we learn?" button on EVERY course card → full-screen Luna trailer (planetarium-style tour, baked Jessica narration)
- [ ] Record the trailer for every course (space first — the Planetarium is the stage)
- [ ] Start a YouTube channel; make every Luna recording an uploadable video (recorder pipeline: capture + baked voice → mp4)

## Docs & authoring

- [ ] Update docs/examples with the 3D capabilities (bodies kit, practice3d, concepts3d, no-emoji rule) — COURSE-AUTHORING.md + engine.capabilities.json
- [ ] Space /courses walkthrough page on the landing site `[platform]`

## Other courses (carried from earlier plans)

- [ ] Logic Quest world 6 "Master Mountain" (harder remixes, pure YAML)
- [ ] Logic Learn-it lessons, map art, bespoke music, /courses page copy
- [ ] English/EFL interactive builders: tileBuild, sentenceDrag (act-it-out), binSort
- [ ] Math manipulatives phase 2: fracBuild, coinPay, clockSet, column-board sidekicks
- [ ] English Quest migration to YAML loader (open Plan 2)
- [ ] OpenMoji SVG rendering for math/EFL (still native-glyph fallback)
- [ ] Course update log automation (two-repo mirror runs by hand — silently goes stale)
