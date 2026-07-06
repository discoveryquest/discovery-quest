# Mars Surface POC — Execution Roadmap (living status)

> **This file is the source of truth for progress.** It survives model/session
> handoff. Update the checkboxes and the "Session handoff" block after **every**
> small step, and commit. A new model taking over should read this file top-to-
> bottom first, then the plan + spec + decisions.

## How to resume (read this first if you're taking over)

1. **Worktree:** `/Users/pavel/dev/discoveryquest/.worktrees/mars-surface` (branch `mars-surface-poc`).
2. **Consult first (repo rule `.roo/rules/metatron.md`):** read `context/decisions/*.md`
   before touching code — esp. `app-shell-state-routing-profile-gate`,
   `packages-are-libraries-deps-in-app`, `tests-use-node-test-mjs`,
   `r3f-version-constraints`, `two-repo-open-platform-mirror`, `voice-kit-music-engine`,
   `static-asset-ignore-gotcha`.
3. **The full plan** (exact code, commands, expected output) is
   `docs/superpowers/plans/2026-07-06-mars-surface-poc.md`. **The spec** is
   `docs/superpowers/specs/2026-07-06-mars-surface-poc-design.md`.
4. **Two repos:** source lives here in `discovery-quest`; the deploy app + public
   assets live in the SIBLING repo `/Users/pavel/dev/discoveryquest/platform`.
   Cross-repo tasks = two commits (see decision `two-repo-open-platform-mirror`).
5. **Dev/verify (3D):** `cd tools/mars-preview && npm install` (once — standalone, NOT a workspace member), then `npm run dev` → `http://localhost:5173`. **Visual check:** with the server up, `node tools/mars-preview/shot.mjs [url] [out.png]` screenshots via headless Chrome (an agent can read the PNG). React18/fiber8/rapier1, matches deploy.
6. **Tests:** `cd packages/space && node --test <file>` (Node's runner, `*.test.mjs`).
7. Find the **first unchecked box** below and continue. Commit after each box.

## Standing practice: capture learnings as candidates

**Every valuable, non-obvious learning discovered during implementation MUST be
written as a Metatron candidate** in `context/candidate/*.md` (OKF format; skill
`context-okf-llm-ingest`) so we learn from it later. Candidates are proposals —
never self-promote to `decisions/`. Log each one in the "Learnings captured"
section at the bottom of this file too.

---

## Session handoff (update every step)

- **Last updated:** 2026-07-06, session_01UuNPTjgu6qHRcfjKrtqiQu
- **Current milestone:** M2 done (terrain + sky). Next M3 — walk & gravity (player, camera, Luna).
- **Current task:** M3 done (Player+camera+Luna render). Next: M4 rocks (T12 Rock pickup/throw, T13 field) — T11 selection already done.
- **Next concrete action:** Rock.jsx (rapier dynamic body) + InteractionController (pickup/throw using selection.js); screenshot-verify a rock on the ground.
- **T2 status:** code complete (Rapier v1 installed in platform, optional peer declared, MarsSurface + lazy MarsRoute). **Visual/chunk verify deferred** to the dev-harness decision — could NOT confirm in platform because of the vendored-copy issue above.

---

## Progress checkboxes

### M0 — Scaffolding & route
- [x] **T1** `/mars` route mount (no profile, no router)
  - [x] T1.1 create `MarsRoute.jsx` placeholder
  - [x] T1.2 lazy branch in `App.jsx` on `pathname.startsWith('/mars')`
  - [x] T1.3 verify — compile (`vite build` ok) + SPA serves `/mars`; on-screen visual pending real browser
  - [x] T1.4 commit
- [x] **T2** Rapier dep (v1) + R3F canvas stub — CROSS-REPO (verified via mars-preview harness)
  - [x] T2.1 `npm install @react-three/rapier@^1` in platform app; verified 1.5.0
  - [x] T2.2 declare Rapier optional peer in `packages/space/package.json`
  - [x] T2.3 `MarsSurface.jsx` stub (Canvas + `preserveDrawingBuffer` + Physics + cube)
  - [x] T2.4 lazy-load MarsSurface from MarsRoute; `touch-action:none` root
  - [ ] T2.5 verify red cube at `/mars`, no WASM errors — BLOCKED on dev-harness decision
  - [x] T2.6 build check — MarsSurface splits into its own 2.9MB lazy chunk (mars-preview build)
  - [x] T2.7 commit (TWO commits: platform + discovery-quest)

### M1 — World config
- [x] **T3** WorldConfig runtime validator (TDD) — 8/8 pass
- [x] **T4** `marsConfig` instance (TDD against validator) — 2/2 pass; M1 done

### M2 — Static scene
- [x] **T5** procedural terrain + matching trimesh collider — renders (screenshot-verified); grounding verified in T9
- [x] **T6** NASA assets (Perseverance glb 11.7MB + Mastcam-Z panorama) fetched to harness + deploy; harness copy gitignored, deploy copy survives ignore patterns
- [x] **T7** Mars sky (procedural butterscotch gradient — panorama is deck-heavy, deferred) + fog; screenshot-verified

### M3 — Walk & gravity
- [x] **T8** gravity/jump math (TDD) — 3/3 pass
- [x] **T9+T10** Player (rapier capsule, WASD move, jump w/ shared JUMP_V0, velocity-grounded) + first/third camera + view toggle + placeholder Luna. Combined into Player.jsx (controller+camera). Luna renders standing on Mars (screenshot). Movement/jump = user keyboard test.


### M4 — Rocks
- [x] **T11** interaction selection (TDD) — 3/3 pass
- [ ] **T12** Rock + pick-up + throw → build check → commit
- [ ] **T13** RockField + safe auto-respawn → commit

### M5 — Environment feedback
- [x] **T14** wind gust profile (TDD) — 3/3 pass
- [ ] **T15** WindProvider + DustParticles + Pennant → commit
- [ ] **T16** HUD + Mars⇄Earth gravity toggle + temperature → commit

### M6 — Landmarks & audio
- [ ] **T17** Rover (static collider) + FactCard + Lander → commit
- [ ] **T18** ambient wind bed + own WebAudio gain + positional SFX + cleanup — CROSS-REPO → commit(s)

### M7 — Cold-visitor UX
- [ ] **T19** LoadingScreen + WebGL fallback → build check → commit
- [ ] **T20** mobile touch controls + first-touch hint + orientation → commit
- [ ] **T21** reduced-motion + Snapshot → build check → commit

### M8 — Meshy assets
- [ ] **T22** `meshy_check_balance` → rigged Luna + rocks → swap behind components → commit(s) (get user OK on look first)

### M9 — Ship
- [ ] **T23** full test run + build + pre-share checklist (mirror, ignore-check, deploy, curl assets, real-phone loop)

---

## Learnings captured (candidates authored)

- context/candidate/space-3d-dev-verify-path.md — platform builds a vendored packages/space, not the open worktree; open space-preview is React19/2D-only. Pick 3D dev/verify path deliberately.
- context/candidate/visual-verification-via-headless-screenshot.md — screenshot the running scene via puppeteer-core + Chrome; compile success does NOT catch runtime crashes (blank canvas).
- (hoisting fix) tools/mars-preview is standalone + vite resolve.dedupe: workspace hoists React19/fiber9 which crashes rapier v1; isolate to keep the deploy-matching React18/fiber8/rapier1. Do NOT force react18 via root overrides (ERESOLVE vs React-19 previews).
- context/candidate/nasa-rover-panorama-not-a-skybox.md — rover panoramas are deck-heavy; use a color gradient sky, not a photographic skybox.
