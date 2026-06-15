// Board registry: board kind → { generate, content, board }. The loader uses this to bind
// each station's generator (band-sliced content) and pick its React component. Composes
// the pure BOARD_GENERATORS with the .jsx board components — so this module imports JSX and
// is verified at build/integration time (not node:test). Plan 1 wires the vocab boards;
// the phonics/grammar boards are added in Plan 2.
import { BOARD_GENERATORS } from './boardGenerators.js';
import PictureMatch from './boards/PictureMatch.jsx';
import WordChoice from './boards/WordChoice.jsx';

export const BOARD_REGISTRY = {
  pictureMatch: { ...BOARD_GENERATORS.pictureMatch, board: PictureMatch },
  vocabListen:  { ...BOARD_GENERATORS.vocabListen,  board: WordChoice },
};
