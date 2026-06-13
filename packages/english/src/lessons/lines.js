// English Quest lesson narration — plain text keyed by clip id. Plain JS (no JSX) so the
// node gen-voice script AND the app both import it; gen-voice renders each with the slow,
// warm teaching voice. Same shape as math-quest's lessons/lines.js (shared format — see
// docs/specs/2026-06-13-lesson-content-format.md), so courses are portable/contributable.

export const LESSON_LINES = {
  // ── Letter Sounds (Phonics "Learn it") ──
  'lph-0': 'Here are all our letter sounds. Tap any letter to hear the sound it makes!',
  'lph-1': "Reading starts with listening. Every letter makes its own little sound — let's hear a few!",
  'lph-2': 'This is the letter S. It says sss, like at the start of sun.',
  'lph-3': 'This is the letter A. It says ah, like at the start of ant.',
  'lph-4': 'This is the letter P. It says puh, like at the start of pig.',
  'lph-5': 'When you hear a sound, find the letter that makes it and tap it. Now you try!',

  // ── Blending (Phonics → Blending Bay) ──
  'lbl-1': 'Letters team up to make words. Listen to these three sounds, one at a time.',
  'lbl-2': 'Now blend them together, nice and smooth: cat!',
  'lbl-3': "Let's try another word. Sound out each letter.",
  'lbl-4': 'Blend them together: pig!',
  'lbl-5': 'Your turn — listen to the sounds, then tap the letters in order to build the word. You try!',

  // ── Word Families (Phonics → Word Families) ──
  'lwf-1': 'Some words are a family — they share the very same ending. Here is the -at family.',
  'lwf-2': 'Keep the ending and swap the first letter: cat becomes hat!',
  'lwf-3': 'Swap it again — now it says mat. Same family, new word!',
  'lwf-4': 'Listen to the word, then tap the letter it starts with. You try!',

  // ── Tricky Teams / digraphs (Phonics → Tricky Teams) ──
  'ldg-1': 'Sometimes two letters team up to make just one new sound.',
  'ldg-2': 'S and H together say shh — like at the start of ship.',
  'ldg-3': 'C and H together say ch — like at the start of chip.',
  'ldg-4': 'T and H together say th — like at the start of thumb.',
  'ldg-5': 'Listen for the team sound, then tap the two letters that make it. You try!',

  // ── Picture Match (Word Woods → vocabulary) ──
  'lpm-1': "Welcome to Word Woods! Here we match words to pictures. Look — this is a cat.",
  'lpm-2': 'And this one is a dog. Every picture has a word that names it.',
  'lpm-3': 'Look at the picture, then tap the word that matches it. You try!',

  // ── Sight Words (Word Woods → high-frequency words) ──
  'lsw-1': "Some little words pop up everywhere, so we learn them by sight — quick as a flash! Here's one: the.",
  'lsw-2': "Here's another we see all the time: and.",
  'lsw-3': "Listen, then tap the word you hear. You'll know these in no time. You try!",

  // ── Same or Opposite (Word Woods → synonyms & antonyms) ──
  'lso-1': 'Some words mean almost the same thing. Big and large both mean really big!',
  'lso-2': 'Other words are opposites — they mean the very opposite. Like hot and cold!',
  'lso-3': "I'll show you a word. Tap the one that means the same, or the opposite. You try!",

  // ── Context Clues (Word Woods → reading clues) ──
  'lcc-1': 'Sometimes a word is missing from a sentence — but the other words give you clues!',
  'lcc-2': "Read: I sleep in my blank. 'Sleep' is the clue, so the missing word is bed!",
  'lcc-3': 'Read the whole sentence, look for the clues, then tap the word that fits. You try!',

  // ── Grammar Grove → parts of speech ──
  'lgn-1': 'A naming word — a noun — names a person, a place, or a thing. Like cat, hat, and bus!',
  'lgn-2': "I'll show some words. Tap the one that names a thing. You try!",
  'lgv-1': 'A doing word — a verb — is an action you can do. Like run, jump, and eat!',
  'lgv-2': 'Tap the word that shows an action. You try!',
  'lga-1': 'A describing word — an adjective — tells us more about something. Like big, hot, and happy!',
  'lga-2': 'Tap the word that describes something. You try!',

  // ── Grammar Grove → Build a Sentence + Capitals & Periods ──
  'lgb-1': 'A sentence puts words in an order that makes sense. The cat is big — that sounds right!',
  'lgb-2': 'Tap the words one by one, in the right order, to build the sentence. You try!',
  'lgc-1': 'Every sentence starts with a capital letter and ends with a period. The dog can run.',
  'lgc-2': 'Tap the sentence that is written the right way — capital at the start, period at the end. You try!',
};
