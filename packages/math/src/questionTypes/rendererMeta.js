// Catalog metadata for math BOARD RENDERERS. Unlike English, math boards are
// ENGINE-GENERATED: each of the 43 topics (questionTypes) names a `boardKind` renderer here
// and supplies its own problem generator — a contributor picks a topic + difficulty `bands`,
// they don't author question data. So the documented surface is the handful of renderers, and
// gen-capabilities attaches the matching renderer description to each topic in the manifest.
// gen-capabilities verifies every plugin's boardKind has an entry here (no orphans).
export const RENDERER_META = {
  add: { description: 'Multi-digit column addition with carrying.' },
  sub: { description: 'Multi-digit column subtraction with borrowing.' },
  mul: { description: 'Multi-digit column multiplication.' },
  div: { description: 'Long division with the standard bracket algorithm.' },
  facts: {
    description:
      'The general problem board: shows a prompt and takes the answer (number pad or choices). Drives most math topics — each topic\'s generator supplies the questions, so the topic id is what varies, not the board.',
  },
  mixed: { description: 'Mixed review: draws problems across several topics in one station (boss level).' },
};
