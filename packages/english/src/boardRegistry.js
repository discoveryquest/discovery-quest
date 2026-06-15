// Board registry: board kind → { generate, content, board }. The loader uses this to bind
// each station's generator (band-sliced content) and pick its React component. Composes
// the pure BOARD_GENERATORS with the .jsx board components — so this module imports JSX and
// is verified at build/integration time (not node:test).
import { BOARD_GENERATORS } from './boardGenerators.js';
import SoundToLetter from './boards/SoundToLetter.jsx';
import BlendBuilder from './boards/BlendBuilder.jsx';
import WordFamily from './boards/WordFamily.jsx';
import PictureMatch from './boards/PictureMatch.jsx';
import WordChoice from './boards/WordChoice.jsx';
import SameOpposite from './boards/SameOpposite.jsx';
import ContextClue from './boards/ContextClue.jsx';
import GrammarSort from './boards/GrammarSort.jsx';
import SentenceBuilder from './boards/SentenceBuilder.jsx';
import PunctuationChoice from './boards/PunctuationChoice.jsx';
import StoryReader from './boards/StoryReader.jsx';

export const BOARD_REGISTRY = {
  // ── Phonics (World 1) ──
  soundToLetter: { ...BOARD_GENERATORS.soundToLetter, board: SoundToLetter },
  blendWord:     { ...BOARD_GENERATORS.blendWord,     board: BlendBuilder },
  wordFamily:    { ...BOARD_GENERATORS.wordFamily,    board: WordFamily },
  digraphs:      { ...BOARD_GENERATORS.digraphs,      board: SoundToLetter },   // genDigraph emits kind:'soundToLetter'

  // ── Vocabulary (World 2) ──
  pictureMatch:  { ...BOARD_GENERATORS.pictureMatch,  board: PictureMatch },
  vocabListen:   { ...BOARD_GENERATORS.vocabListen,   board: WordChoice },
  sightWord:     { ...BOARD_GENERATORS.sightWord,     board: WordChoice },
  sameOpp:       { ...BOARD_GENERATORS.sameOpp,       board: SameOpposite },
  contextClue:   { ...BOARD_GENERATORS.contextClue,   board: ContextClue },

  // ── Grammar (World 3) ──
  grammarNoun:   { ...BOARD_GENERATORS.grammarNoun,   board: GrammarSort },
  grammarVerb:   { ...BOARD_GENERATORS.grammarVerb,   board: GrammarSort },
  grammarAdj:    { ...BOARD_GENERATORS.grammarAdj,    board: GrammarSort },
  sentence:      { ...BOARD_GENERATORS.sentence,      board: SentenceBuilder },
  punctuation:   { ...BOARD_GENERATORS.punctuation,   board: PunctuationChoice },

  // ── Reading (World 4) ──
  firstReader:   { ...BOARD_GENERATORS.firstReader,   board: StoryReader },
  mainIdea:      { ...BOARD_GENERATORS.mainIdea,      board: StoryReader },
  findDetail:    { ...BOARD_GENERATORS.findDetail,    board: StoryReader },
  inference:     { ...BOARD_GENERATORS.inference,     board: StoryReader },
};
