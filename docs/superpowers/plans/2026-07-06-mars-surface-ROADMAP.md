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

- **Last updated:** 2026-07-07, session_01UuNPTjgu6qHRcfjKrtqiQu (M5, M6, M7 ALL complete — feature work done through M7; only M8 Meshy + M9 ship remain, both gated on Pavel)
- **Milestones done:** M0–M4, **M5** (wind: WindProvider + drifting dust + swaying pennant; HUD wind gauge + −60°C temp + visor-frost; live Mars⇄Earth gravity toggle), **M6** (real NASA Perseverance rover as fixed collider + proximity FactCard + primitives lander + ElevenLabs wind-bed/impact audio via own WebAudio graph), **M7** (branded loading + WebGL fallback; reduced-motion; watermarked 📸 snapshot; mobile joystick/look/JUMP/GRAB + first-touch hint). Tests **19/19** green; mars-preview build green; grab→throw smoke test clean (only favicon 404).
- **Current task:** **M8 — Meshy assets (BLOCKED / needs Pavel).** Swap the placeholder primitives `Luna.jsx` + `Rock.jsx` for rigged Meshy glbs (component APIs unchanged, so it's a drop-in). Two blockers: (1) the **Meshy MCP tools are NOT loaded in this session** — needs the MCP available (likely a session/config refresh); (2) **stored rule: get Pavel's OK on the on-screen look before baking** — so agree the prompt/style first. Start with `meshy_check_balance`. Then **M9 — ship** (see the DEPLOY PREREQ below).
- **DEPLOY PREREQ (found this session):** `platform/node_modules/@discoveryquest/space` → symlinks to `platform/packages/space`, which is a SEPARATE copy in the platform repo and is **STALE** (only `src/mars/world/`, none of the new mars code). So M9 must **mirror the full `packages/space/src/mars/` from discovery-quest → platform/packages/space** (after the branch is merged/reviewed) before deploy. Deploy public assets ARE in place & un-ignored (perseverance.glb, panorama.jpg, mars-wind.mp3, rock-thud.mp3 all committed to platform, pass git + .dockerignore checks).
- **PENDING PAVEL DEVICE CHECKS:** (1) **listen to audio** — open localhost:5173, click once to arm sound, walk (wind swells with gusts), throw a rock (thud); toggle 🔊. (2) throw a rock **at the rover** → should bounce (fixed collider). (3) **mobile feel** on a real phone (Vite `host:true`, open the Network URL): joystick walk, right-drag look, JUMP/GRAB. (4) sign off on the overall look before M8 Meshy baking.
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
- [x] **T20** mobile touch controls (Controls.jsx: left joystick→move, right-half LookPad→look, JUMP hold, GRAB tap — all write the same input object) + ControlsHint (first-touch overlay + portrait→landscape nudge) + HUD hides keyboard hint on coarse pointer → touch-emulated screenshot verified (joystick+buttons+hint render, coarse=true) → commit. **Real-phone feel = Pavel.** **M7 complete.**
- [x] **T21** reduced-motion (DustParticles: thinner static haze, no drift) + Snapshot (📸 one-tap canvas→PNG, watermarked `discoveryquest.app/mars`, shutter flash) → verified non-blank 207KB grab of the clean scene (preserveDrawingBuffer works, canvas untainted) → commit

### M8 — Meshy assets
- [~] **T22** Meshy assets via REST API (no MCP): generated Luna reference-driven glbs (image-to-3D, meshy-6) — `luna-owl.glb` (base owl mascot, reusable for regular courses), `luna-suit.glb` (wearable navy suit), `rock-a.glb` (Mars rock). **Luna swapped into `Luna.jsx`** as modular owl-in-suit + a three.js glass helmet dome (bbox-fit + hand-tuned head offsets; screenshot-verified in-scene). Reference art committed to `packages/engine-ui/assets/luna`. `rock-a.glb` now swapped into `Rock.jsx` too (one glb reused across the 4 spawns with per-rock scale + tumble; ball collider + selection highlight unchanged). **PENDING:** Pavel's sign-off on the assembled look; optional rigging/animation (idle/walk/jump/throw — currently static pose); prune the stray sparkle speck on the owl.

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
- context/candidate/meshy-rest-pipeline-and-modular-characters.md — Meshy REST (no MCP) image-to-3D from base64 ref; meshy-6 (meshy-4 deprecated, enable_pbr is meshy-5-only, meshy-5 hangs at 49%); Meshy can't do glass → three.js dome; modular character assembly by bbox-fit + hand-tuned head offsets.
