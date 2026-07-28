---
type: Metatron Decision
scope: audio / packages/engine / packages/voice-kit
confidence: high
source_refs:
  - packages/engine/src/preferences.js
  - packages/voice-kit/src/preferences.js
  - packages/voice-kit/src/audio.js
  - packages/voice-kit/src/music.js
---

## Pattern

Audio has three separate ownership layers:

1. `@discoveryquest/engine/preferences` owns the serializable child preference
   schema and resolves global policy against per-course choices.
2. `@discoveryquest/voice-kit` owns generic playback behavior: narration queues,
   sound effects, music looping, autoplay recovery, ducking, and applying the
   resolved volume/mute policy.
3. Each course/deploy owns its audio files, active voice, track names,
   world-to-track mapping, locale, and capability defaults such as whether
   background music exists.

Global mute and master volume follow the child profile across courses. Sound,
music, narration/SFX/music volume, playback rate, voice, and locale are stored
under the course id. A course configures its defaults at composition time; it
does not register or copy its media into a shared package.

Legacy `save.settings.sound` and `save.settings.music` are read as migration
fallbacks and mirrored after updates. New code should use the preference APIs
instead of mutating those fields directly.

## Rationale

Children need predictable controls when changing quests, but courses can have
different narrators, languages, sound design, and no music at all. Sharing the
policy and playback machinery preserves the experience without coupling the
open engine to proprietary or course-specific media. Keeping playback position
and current track out of the profile also avoids restoring stale session state
on another device or quest.
