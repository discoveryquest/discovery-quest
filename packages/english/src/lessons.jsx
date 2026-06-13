// Lesson index for English Quest (mirrors packages/math/src/lessons.jsx). The shared
// @discoveryquest/engine-ui/LessonScreen plays these; renderLessonView turns a beat's view into a
// visual. Narration text lives in ./lessons/lines.js (plain JS, shared with gen-voice).
import { renderLessonView } from './lessons/views.jsx';
import { PHONICS_LESSONS } from './lessons/phonics.js';
import { VOCAB_LESSONS } from './lessons/vocab.js';
import { GRAMMAR_LESSONS } from './lessons/grammar.js';

export { renderLessonView };

export const LESSONS = {
  ...PHONICS_LESSONS,
  ...VOCAB_LESSONS,
  ...GRAMMAR_LESSONS,
};
