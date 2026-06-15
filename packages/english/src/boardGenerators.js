// Pure board-logic mapping: board kind → { generate, content }. No JSX here, so it's
// unit-testable under `node --test`. The React board component is attached in
// boardRegistry.js (which imports .jsx and is verified at build time).
import { genPictureMatch, genVocabListen } from '@discoveryquest/content-english/vocab';

export const BOARD_GENERATORS = {
  pictureMatch: { generate: genPictureMatch, content: 'vocab' },
  vocabListen:  { generate: genVocabListen,  content: 'vocab' },
};
