// Board registry: board kind → { generate, content, board }. The loader binds each
// station's generator (band-sliced content) and picks its React component. Composes the
// pure BOARD_GENERATORS with the .jsx board(s) — imports JSX, so verified at integration
// time (not node:test). Mirrors packages/english/src/boardRegistry.js.
import { BOARD_GENERATORS } from './boardGenerators.js';
import Quiz from './boards/Quiz.jsx';

export const BOARD_REGISTRY = {
  quiz: { ...BOARD_GENERATORS.quiz, board: Quiz },
};
