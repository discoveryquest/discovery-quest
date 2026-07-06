---
type: Metatron Decision
scope: audio / packages/voice-kit
confidence: high
source_refs:
  - packages/voice-kit/src/music.js
  - packages/space/src/music.js
---

## Pattern
Background music and audio go through the shared `@discoveryquest/voice-kit`
engine, not per-course `<audio>` wiring. A course exposes only a world→track map
and re-exports the engine (see `packages/space/src/music.js`). Tracks are optional
files at `public/music/<name>.mp3`; a **missing file is a silent no-op** — so for
anything user-visible, confirm the mp3 actually loads (network 200), because
silence-on-missing hides broken audio. The public API is
`playMusic/pauseMusic/resumeMusic/stopMusic/setMusicEnabled/isMusicOn` — there is
**no exported per-track volume/gain setter** (the WebAudio `GainNode` is internal,
for iOS-safe fade only). If you need caller-controlled volume (e.g. modulating
ambience), either add a small tested API to voice-kit or run your own WebAudio gain
graph alongside the constant bed — do not assume a volume setter exists.

## Rationale
Centralizing looping, ducking-under-narration, and autoplay reconciliation in one
engine keeps behavior identical across courses (a core consistency goal). The
silent-on-missing design keeps dev frictionless but means QA must verify real
loads. iOS Safari ignores `HTMLMediaElement.volume`, which is why the only gain
control is an internal WebAudio node, not a public knob.
