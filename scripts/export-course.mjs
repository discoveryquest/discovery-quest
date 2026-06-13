// Export the live math + English content into the contributable course format
// (see docs/specs/2026-06-13-course-format-design.md) as YAML, for inspection / as the
// migration target. Reads the existing declarative data modules — no app code runs.
//   node scripts/export-course.mjs   → docs/specs/course-format/{math,english}.course.yml
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = root('../docs/specs/course-format/');
mkdirSync(OUT, { recursive: true });

// ── helpers ──
const lessonsFrom = (...objs) => Object.assign({}, ...objs);

function buildCourse({ id, title, subject, worlds, lessonObjs, lines, content }) {
  const lessons = lessonsFrom(...lessonObjs);
  // narration: only the lesson lines actually referenced (keeps it tidy)
  const used = new Set();
  for (const l of Object.values(lessons)) for (const s of l.sections) for (const b of s.beats) used.add(b.say);
  const narration = {};
  for (const k of Object.keys(lines)) if (used.has(k)) narration[k] = lines[k];
  return {
    course: {
      formatVersion: 1, // schema version (see docs/specs/2026-06-13-course-format-design.md)
      id, title, subject, companion: 'luna',
      voice: { id: 'jessica', profile: 'teaching-slow' },
      engine: '>=1.0',
      worlds: worlds.map((w) => ({
        id: w.id, title: w.title, emoji: w.emoji, color: w.color,
        ...(w.blurb ? { blurb: w.blurb } : {}), ...(w.soon ? { soon: true } : {}),
        stations: w.stations.map((st) => {
          const board = st.boardKind || st.qt || null; // math: `qt`; English: `boardKind`
          const soon = st.soon || !board; // no board ⇒ a "coming soon" station
          return {
            id: st.id, title: st.title, icon: st.icon, ...(st.sub ? { sub: st.sub } : {}),
            ...(board ? { board } : {}),
            ...(board ? { bands: 'band' in st ? [st.band] : [st.floor, st.cap] } : {}),
            ...(st.lesson ? { lesson: st.lesson } : {}),
            ...(st.concept ? { concept: st.concept } : {}),
            ...(soon ? { soon: true } : {}),
          };
        }),
      })),
      lessons,
      narration,
      ...(content ? { content } : {}),
    },
  };
}

const dump = (obj) => yaml.dump(obj, { lineWidth: 100, noRefs: true, quotingType: '"' });

// ── MATH ──
const M = (m) => import(`../packages/math/src/lessons/${m}`);
const mathMods = await Promise.all([
  'numberMeadow.js', 'placeValuePeaks.js', 'carryCanyon.js', 'timesTableTrail.js',
  'multiplicationMountain.js', 'fractionForest.js', 'decimalDocks.js', 'measureMarsh.js', 'geometryGalaxy.js',
].map((f) => M(f)));
const { LESSON_LINES: mathLines } = await M('lines.js');
const { WORLDS: mathWorlds } = await import('../packages/math/src/curriculum.js');
const mathCourse = buildCourse({
  id: 'math', title: "Luna's Math Quest", subject: 'Mathematics',
  worlds: mathWorlds, lessonObjs: mathMods.map((m) => Object.values(m)[0]), lines: mathLines,
});
writeFileSync(`${OUT}math.course.yml`, dump(mathCourse));

// ── ENGLISH ──
const { PHONICS_LESSONS } = await import('../packages/english/src/lessons/phonics.js');
const { VOCAB_LESSONS } = await import('../packages/english/src/lessons/vocab.js');
const { GRAMMAR_LESSONS } = await import('../packages/english/src/lessons/grammar.js');
const { LESSON_LINES: enLines } = await import('../packages/english/src/lessons/lines.js');
const { WORLDS: enWorlds } = await import('../packages/english/src/curriculum.js');
// authored content data the boards consume (the contributable, subject-specific layer)
const ph = await import('@discoveryquest/content-english/phonics');
const vo = await import('@discoveryquest/content-english/vocab');
const gr = await import('@discoveryquest/content-english/grammar');
const enContent = {
  phonemes: ph.PHONEMES.map(({ letter, sound, word }) => ({ letter, sound, word })),
  digraphs: ph.DIGRAPHS.map(({ team, sound, word }) => ({ team, sound, word })),
  blendWords: ph.BLEND_WORDS,
  wordFamilies: ph.FAMILIES.map(({ rime, words, band }) => ({ rime, words, band })),
  vocab: vo.VOCAB,
  sightWords: vo.SIGHT_WORDS,
  // word-pair lists (the generator flips a pair either direction) → contributor-friendly objects
  synonyms: vo.SYNONYMS.map(([word, match]) => ({ word, match })),
  antonyms: vo.ANTONYMS.map(([word, match]) => ({ word, match })),
  // cloze items: rename the terse engine fields (s/a/d) to readable ones for authors
  contextClues: vo.CONTEXT_ITEMS.map(({ s, a, d }) => ({ sentence: s, answer: a, distractors: d })),
  parts_of_speech: { note: 'word → part of speech (one generator, 3 categories)', words: gr.GRAMMAR_WORDS },
  sentences: gr.SENTENCES,
  punctuationCores: gr.PUNCT_CORES,
};
const enCourse = buildCourse({
  id: 'english', title: 'English Quest', subject: 'English',
  worlds: enWorlds, lessonObjs: [PHONICS_LESSONS, VOCAB_LESSONS, GRAMMAR_LESSONS], lines: enLines, content: enContent,
});
writeFileSync(`${OUT}english.course.yml`, dump(enCourse));

console.log(`exported → ${OUT}{math,english}.course.yml`);
console.log(`  math:    ${mathWorlds.length} worlds, ${Object.keys(mathCourse.course.lessons).length} lessons`);
console.log(`  english: ${enWorlds.length} worlds, ${Object.keys(enCourse.course.lessons).length} lessons`);
