// Lesson index for the lesson engine (@discoveryquest/engine-ui/LessonScreen).
// A lesson = sections → beats; `renderLessonView` turns a beat's `view` into a visual.
// Lessons are authored per world in ./lessons/*; narration text lives in ./lessons/lines.js
// (plain JS, shared with the node gen-voice script). See docs/specs/2026-06-13-lesson-*.
import { renderLessonView } from './lessons/views.jsx';
import { NUMBER_MEADOW } from './lessons/numberMeadow.js';
import { PLACE_VALUE_PEAKS } from './lessons/placeValuePeaks.js';
import { CARRY_CANYON } from './lessons/carryCanyon.js';
import { TIMES_TABLE_TRAIL } from './lessons/timesTableTrail.js';
import { MULTIPLICATION_MOUNTAIN } from './lessons/multiplicationMountain.js';
import { FRACTION_FOREST } from './lessons/fractionForest.js';
import { DECIMAL_DOCKS } from './lessons/decimalDocks.js';
import { MEASURE_MARSH } from './lessons/measureMarsh.js';
import { GEOMETRY_GALAXY } from './lessons/geometryGalaxy.js';

export { renderLessonView };

export const LESSONS = {
  ...NUMBER_MEADOW,
  ...PLACE_VALUE_PEAKS,
  ...CARRY_CANYON,
  ...TIMES_TABLE_TRAIL,
  ...MULTIPLICATION_MOUNTAIN,
  ...FRACTION_FOREST,
  ...DECIMAL_DOCKS,
  ...MEASURE_MARSH,
  ...GEOMETRY_GALAXY,
};
