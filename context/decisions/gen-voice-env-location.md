---
type: Metatron Decision
scope: scripts / voice generation
confidence: medium
source_refs:
  - packages/space/scripts/gen-voice.mjs
---

## Pattern
Voice-generation scripts (`gen-voice.mjs`) resolve the ElevenLabs key from
`process.env.ELEVENLABS_API_KEY` first, then fall back to a **hardcoded path**
`platform/apps/math-quest/.env` — **not** `platform/.env` and not the course's own
app dir. When wiring a new script or key, follow the same precedence (env var, then
the known app `.env`), and run generation from the main checkout (not a worktree)
so the relative/absolute path resolves. Storing a key in `platform/.env` alone will
not be picked up by these scripts.

## Rationale
The scripts were written against one app's `.env` and never generalized, so the
lookup path is a fixed location rather than course-relative. Knowing the exact
fallback path avoids "key not found" failures when the key is present but in the
wrong file.
