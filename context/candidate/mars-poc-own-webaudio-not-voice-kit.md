---
type: Metatron Decision
scope: audio / packages/space/src/mars
confidence: medium
source_refs:
  - packages/space/src/mars/audio/marsAudio.js
  - packages/space/src/mars/audio/MarsAudio.jsx
  - context/decisions/voice-kit-music-engine.md
---

## Pattern
The `/mars` POC runs its **own small WebAudio graph** (`mars/audio/marsAudio.js`)
for ambience + SFX rather than the shared `@discoveryquest/voice-kit` engine, for
two concrete reasons: (1) the standalone `tools/mars-preview` dev harness is a
**non-workspace** app and cannot resolve the workspace `voice-kit` package; and
(2) the wind bed must **swell with the live gust value** each frame, and voice-kit
deliberately exposes no per-track gain setter. This is the escape hatch the
`voice-kit-music-engine` decision itself allows ("run your own WebAudio gain graph
alongside the constant bed"). It's safe because `/mars` is a standalone fullscreen
route that never starts the space music engine, so there is no double-bed conflict.
Pattern: an AudioContext created lazily on the **first user gesture** (autoplay is
blocked), a looping `AudioBufferSourceNode → GainNode` bed whose gain is driven by
`windState.gust` via `setTargetAtTime` (smoothed, no zipper), one-shot thuds
spawned per rock `onCollisionEnter` (gated by rock speed so resting/settling rocks
are silent) panned by the rock's x relative to the player, and `dispose()` on route
unmount to avoid leaking the context.

## Rationale
Centralizing on voice-kit is the house rule for cross-course consistency, but it
assumes a workspace resolution and a constant-volume bed. A physics toy that ties
ambience to a simulated variable (gusts) needs caller-controlled gain, and a
source-imported standalone harness needs zero workspace deps. Reaching for a local
graph here keeps the POC self-contained and verifiable in the harness, matches the
deploy behavior on the isolated `/mars` route, and stays within the letter of the
existing decision instead of contradicting it. Verified: mp3s load (network 200),
decode with no console errors, mute button renders; the swell/thud themselves need
an on-device listen (headless can't hear).
