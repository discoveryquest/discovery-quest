// English Quest narration. Like math-quest: keys map 1:1 to pre-generated
// /voice/<ACTIVE_VOICE>/<key>.mp3 (scripts/gen-voice.mjs). Three kinds of clip:
//   1. VOICE_LINES   — Luna's reaction lines (category-indexed: praise-0, …)
//   2. MISC_LINES    — fixed single-key narration (q-whichletter, …)
//   3. PHONEME_SPEECH / words — the phonics SOUNDS + example words (keys come
//      from @discoveryquest/content-english so the generator + the audio stay in sync)

export const ACTIVE_VOICE = 'jessica';
export const voiceKey = (cat, i) => `${cat}-${i}`;

export const VOICE_LINES = {
  greeting: ["Let's listen to some sounds! I'll help you!"],
  praise: ['Nice!', 'You got it!', 'Great listening!', 'Perfect!', 'Woohoo!', 'Brilliant!'],
  oops: ['Hmm, listen again!', 'Almost — tap the letter you hear!', 'Try once more, you can do it!'],
  solved: ['Woohoo! You found all the sounds!', 'Amazing listening — you did it!'],
};

// Fixed single-key narration clips.
export const MISC_LINES = {
  'q-whichletter': 'Which letter makes this sound?',
  'q-buildword': 'Build the word you hear!',
  'q-whichteam': 'Which letter team makes this sound?',
  'q-same': 'Which word means the same?',
  'q-opposite': 'Which word means the opposite?',
  'q-fill': 'Which word completes the sentence?',
  'q-noun': 'Which word is a naming word?',
  'q-verb': 'Which word is a doing word?',
  'q-adjective': 'Which word is a describing word?',
  'q-order': 'Put the words in the right order!',
  'q-correct': 'Which sentence is written correctly?',
};

// How ElevenLabs should *say* each two-letter digraph (Tricky Teams). Keyed by team
// (matches @discoveryquest/content-english DIGRAPHS); gen-voice writes phon-<team>.mp3.
export const DIGRAPH_SPEECH = { sh: 'shh', ch: 'ch', th: 'th', ck: 'k' };

// How ElevenLabs should *say* each phoneme. Continuants are sustained; stop
// consonants ( t p d g c k b h ) are approximations — TTS can't cleanly clip a
// stop, so these are a FIRST PASS to be tuned by ear (or replaced via the Suno
// experiment). The board doesn't care how the clip was made — it plays the key.
// Keyed by letter (matches @discoveryquest/content-english PHONEMES). gen-voice writes
// each to phon-<letter>.mp3.
export const PHONEME_SPEECH = {
  s: 'ssss', a: 'aaa', t: 'tuh', p: 'puh', i: 'ih',
  n: 'nnn', m: 'mmm', d: 'duh', g: 'guh', o: 'awe',
  c: 'kuh', k: 'kuh', e: 'eh', u: 'uh', r: 'rrr',
  h: 'huh', b: 'buh', f: 'fff', l: 'lll',
  j: 'juh', q: 'kwuh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
};
