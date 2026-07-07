---
type: Metatron Decision
scope: scripts / audio asset generation
confidence: medium
source_refs:
  - scripts/gen-mars-sfx.mjs
  - context/decisions/gen-voice-env-location.md
---

## Pattern
Generating **sound effects / ambience** with ElevenLabs uses a different endpoint
and a **different key permission** than voice (text-to-speech): POST
`https://api.elevenlabs.io/v1/sound-generation` (body `{ text, duration_seconds,
prompt_influence, loop?, output_format }`, auth header `xi-api-key`, returns mp3),
and the API key must carry the **`sound_generation` scope** — which is OFF by
default and independent of the `text_to_speech` scope a working gen-voice key
already has. Symptom of the missing scope is a `401` with
`"missing the permission sound_generation"` (NOT a generic auth failure). Enable
that scope on the *specific* key the scripts read. Reuse gen-voice's key resolution
(env `ELEVENLABS_API_KEY`, then `platform/apps/math-quest/.env`) — note the repo
has multiple keys and only the math-quest one is live: `platform/.env`'s
`ELEVEN_LABS_API_KEY` (underscored, different var) was stale/invalid here. Cap
`duration_seconds` at ~22 s (a loopable bed); resolve the key inside the script and
never print its value.

## Rationale
Sound generation and speech are billed and permissioned separately in the
ElevenLabs account, so a key that dubs narration fine will still 401 on sound
effects until the scope is added — and the error names the exact missing
permission, so read it rather than assuming the key is wrong. Recording the endpoint,
the scope requirement, and which of the repo's several keys is authoritative saves
a round of "which key, which permission" debugging next time (Moon ambience, new
SFX, etc.).
