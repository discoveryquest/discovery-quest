// Pure board-logic mapping: board kind → { generate, content }. No JSX here, so it's
// unit-testable under `node --test`. The React board component is attached in
// boardRegistry.js (which imports .jsx and is verified at build time).
import { genSoundToLetter, genBlend, genWordFamily, genDigraph } from '@discoveryquest/content-english/phonics';
import { genPictureMatch, genVocabListen, genSightWords, genSameOpposite, genContextClues } from '@discoveryquest/content-english/vocab';
import { genWordSort, genBuildSentence, genPunctuation } from '@discoveryquest/content-english/grammar';
import { genFirstReaders, comprehension } from '@discoveryquest/content-english/reading';
import { genSentenceRu } from '@discoveryquest/content-english/sentencesRu';
import { genRuleQuiz } from '@discoveryquest/content-english/rules';
import { genWordBuild } from '@discoveryquest/content-english/build';

// Comprehension label+color values sourced from reading.js's C palette:
//   C = { rose: '#F472B6', pink: '#F9A8D4', plum: '#E879F9' }
// mainIdea  → comprehension('Main Idea',       '#F9A8D4')  (C.pink)
// findDetail → comprehension('Find the Detail', '#F9A8D4')  (C.pink)
// inference  → comprehension('Inference',       '#E879F9')  (C.plum)

export const BOARD_GENERATORS = {
  // ── Phonics (World 1) ──
  soundToLetter: { generate: genSoundToLetter,                                 content: 'phonemes' },
  blendWord:     { generate: genBlend,                                          content: 'blendWords' },
  wordFamily:    { generate: genWordFamily,                                     content: 'wordFamilies' },
  digraphs:      { generate: genDigraph,                                        content: 'digraphs' },

  // ── Vocabulary (World 2) ──
  pictureMatch:  { generate: genPictureMatch,                                   content: 'vocab' },
  vocabListen:   { generate: genVocabListen,                                    content: 'vocab' },
  sightWord:     { generate: genSightWords,                                     content: 'sightWords' },
  sameOpp:       { generate: genSameOpposite,                                   content: ['synonyms', 'antonyms'] },
  contextClue:   { generate: genContextClues,                                   content: 'contextClues' },

  // ── Grammar (World 3) ──
  grammarNoun:   { generate: (items, ctx) => genWordSort('noun',      items, ctx), content: 'parts_of_speech' },
  grammarVerb:   { generate: (items, ctx) => genWordSort('verb',      items, ctx), content: 'parts_of_speech' },
  grammarAdj:    { generate: (items, ctx) => genWordSort('adjective', items, ctx), content: 'parts_of_speech' },
  sentence:      { generate: genBuildSentence,                                  content: 'sentences' },
  sentenceRu:    { generate: genSentenceRu,                                     content: 'sentencesRu' },
  ruleQuiz:      { generate: genRuleQuiz,                                        content: 'rules' },
  soundPattern:  { generate: genRuleQuiz,                                        content: 'patterns' },
  spellBee:      { generate: genRuleQuiz,                                        content: 'spellings' },
  punctuation:   { generate: genPunctuation,                                    content: 'punctuationCores' },

  // ── Grammar Gym (World 9) & Word Lab (World 10) — grammar + vocabulary depth. wordBuild
  //    assembles a word form from morpheme tiles; the choose-the-form stations reuse the
  //    RuleQuiz interaction (genRuleQuiz) over their own collections, like soundPattern/spellBee ──
  wordBuild:     { generate: genWordBuild,                                       content: 'wordParts' },
  grammarDepth:  { generate: genRuleQuiz,                                        content: 'grammar_depth' },
  figurative:    { generate: genRuleQuiz,                                        content: 'figurative' },

  // ── Reading (World 4) ──
  firstReader:   { generate: genFirstReaders,                                                        content: 'storyItems' },
  mainIdea:      { generate: (items, ctx) => comprehension('Main Idea',        '#F9A8D4')(items, ctx), content: 'mainIdeaItems' },
  findDetail:    { generate: (items, ctx) => comprehension('Find the Detail',  '#F9A8D4')(items, ctx), content: 'detailItems' },
  inference:     { generate: (items, ctx) => comprehension('Inference',        '#E879F9')(items, ctx), content: 'inferenceItems' },
};
