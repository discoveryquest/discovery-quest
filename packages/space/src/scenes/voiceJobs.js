// Pure: narration map → ElevenLabs job list (teaching-slow). Keyed by narration key, so
// repeated text still yields one clip per key (the runtime plays clips by key).
export function buildVoiceJobs(course) {
  return Object.entries(course?.narration || {}).map(([key, text]) => ({ key, text, slow: true }));
}
