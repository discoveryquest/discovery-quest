// Rules & Tricks — apply a spelling/grammar rule. Each item carries a rule mnemonic
// (e.g. "i before e, except after c", Bossy R, Magic E), a question, the answer that
// follows the rule, and distractors that break it. The RuleQuiz board shows the rule as a
// reminder banner, then the question + word tiles. Same generic contract:
// onPick(word) → quest compares to step.expected.
//   item = { rule, question, answer, distractors, band? }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// `items` is the rules array ({ rule, question, answer, distractors, band? } objects).
export function genRuleQuiz(items, ctx = {}) {
  const item = pick(items);
  const choices = shuffle([item.answer, ...item.distractors]);
  return {
    kind: 'ruleQuiz',
    word: item.answer,
    result: item.answer,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Rule', color: '#FBBF24' },
        rule: item.rule,
        banner: item.rule,
        prompt: item.question,
        audioPrompt: 'q-rule',
        inputKind: 'choice',
        choices,
        lower: true,
        expected: item.answer,
        hint: `Remember: ${item.rule}.`,
        sayQ: ['q-rule'],
        sayA: [],
      },
    ],
  };
}
