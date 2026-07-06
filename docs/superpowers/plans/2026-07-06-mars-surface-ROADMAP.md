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

- **Last updated:** 2026-07-06, session_01UuNPTjgu6qHRcfjKrtqiQu (M6 complete — rover + fact card + lander + ElevenLabs audio)
- **Milestones done:** M0 (route+canvas), M1 (config), M2 (terrain+NASA assets+sky), M3 (player+camera+Luna), **M4 (dynamic throwable rocks + safe reset/respawn)**, **M5 (wind: WindProvider clock + drifting DustParticles + swaying Pennant; HUD wind gauge + −60°C temp + visor-frost vignette; live Mars⇄Earth gravity toggle)**. Plus telemetry HUD + scatter boulders. **Walking/jumping CONFIRMED WORKING by Pavel in-browser.** Tests 19/19 green; mars-preview build green.
- **Current task:** **M7 — cold-visitor UX.** Next: **T19** `ui/LoadingScreen.jsx` (progress + Luna line + WebGL-unsupported fallback) → build check → commit; **T20** mobile touch controls (joystick + jump/interact buttons) + first-touch hint + orientation nudge; **T21** reduced-motion honoring (incl. DustParticles) + `ui/Snapshot.jsx` (one-tap canvas→PNG with watermark; Canvas already has `preserveDrawingBuffer`). All screenshot-verifiable. **M6 done** (rover+factcard+lander+audio). Audio sound quality still needs Pavel's on-device listen.
- **M4 visual proof:** `/tmp/mars-m4-held-improved.png` (held near Luna's hand) and `/tmp/mars-m4-thrown-improved.png` (rock arcing in low gravity). Automated browser interaction used `E` to pick up and throw; only console error was favicon 404.
- **After M5:** M6 rover (real NASA glb) + audio · M7 UX (loading/mobile/snapshot) · M8 swap in Meshy-rigged Luna · M9 ship.
- **Dev/verify reminder:** harness = standalone `tools/mars-preview` (React18/fiber8/rapier1); `npm run dev` → localhost:5173; screenshot via `node tools/mars-preview/shot.mjs`. Pure logic via `node --test`. Capture learnings as `context/candidate/*.md`.

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
- [x] **T12** Rock + pick-up + throw → build check → commit
- [x] **T13** RockField + safe auto-respawn → commit

### M5 — Environment feedback
- [x] **T14** wind gust profile (TDD) — 3/3 pass
- [x] **T15** WindProvider + DustParticles + Pennant → screenshot-verified (dust drifts; red pennant sways on its pole) → commit
- [x] **T16** HUD wind gauge + temperature/visor-frost → screenshot-verified (TEMP −60°C, live WIND gauge bar, faint cool frost vignette) → commit. **M5 complete.** (Mars⇄Earth gravity toggle + live physics switch already shipped in the M4 commit)

### M6 — Landmarks & audio
- [x] **T17** Rover (real NASA Perseverance glb, FIXED cuboid collider) + FactCard (proximity, re-arms) + Lander (primitives) → walkshot-verified (rover renders at scale 0.6 ≈ 2 m, fact card fires at ≤7 m) → commit. Rock-bounce-off-rover = live user check. Added `tools/mars-preview/walkshot.mjs` (keyboard-driven screenshot for off-camera landmarks).
- [x] **T18** audio — ElevenLabs-generated `mars-wind.mp3` (22s loop bed) + `rock-thud.mp3`; own WebAudio graph (`audio/marsAudio.js` + `MarsAudio.jsx`): gust-modulated wind gain, rock `onCollisionEnter` thuds (speed-gated, panned), 🔊 mute, arms on first gesture, disposes on unmount. CROSS-REPO (assets → platform). Plumbing verified (mp3 200s, decode no-error, button renders); **sound itself = Pavel's ears.** **M6 complete.**

### M7 — Cold-visitor UX
- [x] **T19** branded LoadingScreen (drei useProgress bar + Luna line) + WebGLFallback card (gated in MarsRoute) → harness build green + fallback screenshot-verified (forced no-WebGL) + no scene regression → commit
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
- context/candidate/mars-poc-own-webaudio-not-voice-kit.md — /mars uses its own WebAudio graph (gust-modulated gain + SFX), not voice-kit: the non-workspace harness can't resolve voice-kit and voice-kit exposes no gain setter (the escape hatch its own decision allows).
- context/candidate/elevenlabs-sound-generation-scope.md — ElevenLabs SFX use the /v1/sound-generation endpoint and need the separate `sound_generation` key scope (off by default; distinct from text-to-speech); the live key is math-quest/.env's ELEVENLABS_API_KEY, platform/.env's ELEVEN_LABS_API_KEY was stale.
- context/candidate/third-person-held-physics-object-anchor.md — third-person held physics objects should anchor to Luna/body space, not camera-forward, or they obscure the character and read as a UI overlay.
