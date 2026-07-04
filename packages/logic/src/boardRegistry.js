// Board registry: board kind → { generate, content, board }. Logic Quest v1 is
// all interactive practice (matchstick); PracticeScreen hosts it, so no board
// component here. Mirrors packages/space/src/boardRegistry.js.
import { BOARD_GENERATORS } from './boardGenerators.js';

export const BOARD_REGISTRY = {
  practice: { ...BOARD_GENERATORS.practice, board: null },
};
