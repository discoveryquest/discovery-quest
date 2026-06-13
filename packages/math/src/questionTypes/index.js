// QuestionType plugin registry (GDD §5).
// Every topic in the game is a plugin with this shape:
//   {
//     id:        string                 // stable id, referenced by curriculum
//     title:     string                 // kid-facing name
//     boardKind: string                 // which Board renders it (QuestScreen
//                                       // maps boardKind → component; new
//                                       // plugins introduce new kinds)
//     bands:     number                 // how many difficulty bands (0-based)
//     generate(band) → problem          // problem with .steps (engine shape:
//                                       // prompt/expected/hint/effects/sayQ/sayA)
//   }
// Bands replace the POC's easy/medium/hard; 0 is the station floor.

import { makeProblem } from '../engine.js';
import {
  genCounting, genCompare, genBonds, genFact, genPlaceValue,
  genTwoDigitNR, genSkip, genEvenOdd, genMulConcept, genTables, genDivFacts,
  genRounding, genStory, genStory2,
} from '../engine-facts.js';
import {
  genFracConcept, genFracEquiv, genFracCompare, genFracAddLike,
  genFracAddUnlike, genFracMixed, genFracMulWhole,
} from '../engine-fractions.js';
import {
  genDecPlace, genDecCompare, genDecAddSub, genDecPow10, genDecConvert,
} from '../engine-decimals.js';
import {
  genMoney, genTime, genElapsed, genUnits, genUnitConvert,
} from '../engine-measure.js';
import {
  genShape, genSymmetry, genAngle, genRectMeasure, genVolume,
} from '../engine-geometry.js';

const BAND_TO_DIFF = ['easy', 'medium', 'hard'];
const clampBand = (b) => Math.max(0, Math.min(b, 2));

const longArithmetic = (id, mode, title) => ({
  id,
  title,
  boardKind: mode, // 'add' | 'sub' | 'mul' | 'div' — matches problem.kind
  bands: 3,
  generate: (band) => makeProblem(mode, BAND_TO_DIFF[clampBand(band)]),
});

const facts = (id, title, gen) => ({
  id,
  title,
  boardKind: 'facts',
  bands: 3,
  generate: (band) => gen(clampBand(band)),
});

const PLUGINS = [
  longArithmetic('long-add', 'add', 'Long Addition'),
  longArithmetic('long-sub', 'sub', 'Long Subtraction'),
  longArithmetic('long-mul', 'mul', 'Long Multiplication'),
  longArithmetic('long-div', 'div', 'Long Division'),
  facts('counting', 'Counting', genCounting),
  facts('compare', 'Bigger or Smaller', genCompare),
  facts('bonds', 'Number Bonds', genBonds),
  facts('fact-add', 'Adding Facts', (b) => genFact('add', b)),
  facts('fact-sub', 'Taking Away', (b) => genFact('sub', b)),
  facts('tens-ones', 'Tens & Ones', genPlaceValue),
  facts('twodigit-nr', 'Two-Digit + and −', genTwoDigitNR),
  facts('skip', 'Skip Counting', genSkip),
  facts('even-odd', 'Even or Odd', genEvenOdd),
  facts('mul-concept', 'Groups & Arrays', genMulConcept),
  facts('tables', 'Times Tables', genTables),
  facts('div-facts', 'Division Facts', genDivFacts),
  facts('rounding', 'Rounding', genRounding),
  facts('word-1step', 'Story Problems', genStory),
  facts('frac-concept', 'What is a Fraction?', genFracConcept),
  facts('frac-equiv', 'Equivalent Fractions', genFracEquiv),
  facts('frac-compare', 'Compare Fractions', genFracCompare),
  facts('frac-addlike', 'Add Alike Fractions', genFracAddLike),
  facts('frac-unlike', 'Mixed Denominators', genFracAddUnlike),
  facts('frac-mixed', 'Mixed Numbers', genFracMixed),
  facts('frac-mulwhole', 'Fraction × Whole', genFracMulWhole),
  facts('dec-place', 'Decimal Places', genDecPlace),
  facts('dec-compare', 'Compare Decimals', genDecCompare),
  facts('dec-addsub', 'Decimal + and −', genDecAddSub),
  facts('dec-pow10', '× and ÷ by 10, 100', genDecPow10),
  facts('dec-convert', 'Fractions ↔ Decimals', genDecConvert),
  facts('money', 'Money & Change', genMoney),
  facts('time', 'Telling Time', genTime),
  facts('elapsed', 'Elapsed Time', genElapsed),
  facts('units', 'Length & Weight', genUnits),
  facts('unit-convert', 'Unit Conversions', genUnitConvert),
  facts('shapes', 'Name the Shapes', genShape),
  facts('symmetry', 'Symmetry', () => genSymmetry()),
  facts('angles', 'Angles', genAngle),
  facts('perimeter', 'Perimeter', (b) => genRectMeasure('perimeter', b)),
  facts('area', 'Area', (b) => genRectMeasure('area', b)),
  facts('volume', 'Volume', genVolume),
  facts('word-2step', 'Two-Step Stories', genStory2),
  // Grand Challenge: a random tour of the hardest content from every world
  {
    id: 'word-master',
    title: 'Grand Challenge',
    boardKind: 'mixed',
    bands: 3,
    generate: () => {
      const pool = [
        () => makeProblem('add', 'hard'),
        () => makeProblem('sub', 'hard'),
        () => makeProblem('mul', 'medium'),
        () => makeProblem('div', 'medium'),
        () => genStory(2),
        () => genStory2(2),
        () => genFracAddLike(2),
        () => genMoney(2),
        () => genElapsed(2),
        () => genRectMeasure('area', 2),
        () => genAngle(2),
      ];
      return pool[Math.floor(Math.random() * pool.length)]();
    },
  },
];

export const questionTypes = Object.fromEntries(PLUGINS.map((p) => [p.id, p]));

export function getQuestionType(id) {
  const qt = questionTypes[id];
  if (!qt) throw new Error(`unknown question type "${id}"`);
  return qt;
}
