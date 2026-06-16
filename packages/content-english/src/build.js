// Word Build — construct a word FORM by assembling its morpheme tiles. Each item carries a
// rule (e.g. "add -ed for the past", "un- means not"), a prompt ("Make it past tense"), the
// ordered correct `parts` (the tiles that build the answer), `distractors` (extra tiles to
// reject), and the `answer` (= parts joined). The WordBuilder board shows the rule as a
// reminder banner, the prompt, a build line, and a tray of scrambled tiles; the child taps the
// right parts in order and presses Check. Generic contract: onPick(joined) → CourseQuest
// compares to step.expected. Tiles join with '' (no spaces), unlike SentenceBuilder.
//   item = { rule, prompt, parts, distractors, answer, band? }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// `items` is the wordParts array ({ rule, prompt, parts, distractors, answer, band? } objects).
export function genWordBuild(items, ctx = {}) {
  const item = pick(items);
  return {
    kind: 'wordBuild',
    word: item.answer,
    result: item.answer,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Build', color: '#818CF8' },
        rule: item.rule,
        banner: item.rule,
        prompt: item.prompt,
        tokens: shuffle([...item.parts, ...item.distractors]),
        inputKind: 'build',
        joinWith: '', // morphemes join with no space (walk + ed → walked)
        lower: true,
        expected: item.answer,
        audioPrompt: 'q-build',
        hint: `Remember: ${item.rule}.`,
        sayQ: ['q-build'],
        sayA: [],
      },
    ],
  };
}
