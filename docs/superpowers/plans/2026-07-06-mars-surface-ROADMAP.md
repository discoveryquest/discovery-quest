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
5. **Dev/verify app:** `cd /Users/pavel/dev/discoveryquest/platform/apps/space-quest && npm run dev` → `http://localhost:5173/mars`.
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
- **Current milestone:** M1 — World config (proceeding on fully-testable modules while a dev-harness decision is pending)
- **Current task:** Task 3 — WorldConfig validator (TDD, `node --test`, no browser needed)
- **Next concrete action:** write `worldConfig.test.mjs` failing test (T3.1)
- **⚠️ OPEN DECISION (needs user, blocks *visual* verify from ~T5):** how to browser-verify 3D. The platform app builds a **vendored `platform/packages/space`**, NOT the open worktree (see candidate `space-3d-dev-verify-path.md`), and the open repo's `space-preview` is React 19 / 2D-only. Options to resolve: (1) add a React-18/fiber-v8/rapier-v1 dev preview to the OPEN repo importing worktree source [recommended]; (2) mirror mars files to platform + build each checkpoint; (3) develop in platform's vendored copy. Pure-logic tasks (T3/T4/T8/T11/T14) are unaffected — they run via `node --test` in the open repo.
- **T2 status:** code complete (Rapier v1 installed in platform, optional peer declared, MarsSurface + lazy MarsRoute). **Visual/chunk verify deferred** to the dev-harness decision — could NOT confirm in platform because of the vendored-copy issue above.

---

## Progress checkboxes

### M0 — Scaffolding & route
- [x] **T1** `/mars` route mount (no profile, no router)
  - [x] T1.1 create `MarsRoute.jsx` placeholder
  - [x] T1.2 lazy branch in `App.jsx` on `pathname.startsWith('/mars')`
  - [x] T1.3 verify — compile (`vite build` ok) + SPA serves `/mars`; on-screen visual pending real browser
  - [x] T1.4 commit
- [~] **T2** Rapier dep (v1, pinned) + R3F canvas stub — CROSS-REPO (code done; visual/chunk verify deferred to dev-harness decision)
  - [x] T2.1 `npm install @react-three/rapier@^1` in platform app; verified 1.5.0
  - [x] T2.2 declare Rapier optional peer in `packages/space/package.json`
  - [x] T2.3 `MarsSurface.jsx` stub (Canvas + `preserveDrawingBuffer` + Physics + cube)
  - [x] T2.4 lazy-load MarsSurface from MarsRoute; `touch-action:none` root
  - [ ] T2.5 verify red cube at `/mars`, no WASM errors — BLOCKED on dev-harness decision
  - [ ] T2.6 build check — Mars is a separate lazy chunk — BLOCKED (platform builds vendored copy, not worktree)
  - [x] T2.7 commit (TWO commits: platform + discovery-quest)

### M1 — World config
- [ ] **T3** WorldConfig runtime validator (TDD) — test → fail → impl → pass → commit
- [ ] **T4** `marsConfig` instance (TDD against validator) → commit

### M2 — Static scene
- [ ] **T5** procedural terrain + matching trimesh collider → commit
- [ ] **T6** download NASA assets (rover glb, panorama, regolith) — CROSS-REPO → 2 commits
- [ ] **T7** SkyDome (NASA panorama) + fog → build check → commit

### M3 — Walk & gravity
- [ ] **T8** gravity/jump math (TDD) → commit
- [ ] **T9** `inputStore` + `marsStore` + PlayerController (walk + jump, shared JUMP_V0) → commit
- [ ] **T10** CameraController first/third-person + view toggle + Luna placeholder → commit

### M4 — Rocks
- [ ] **T11** interaction selection (TDD) → commit
- [ ] **T12** Rock + pick-up + throw → build check → commit
- [ ] **T13** RockField + safe auto-respawn → commit

### M5 — Environment feedback
- [ ] **T14** wind gust profile (TDD) → commit
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
