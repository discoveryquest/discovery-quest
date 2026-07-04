// Pure board-logic for Space Quest: board kind → { generate, content }. No JSX here,
// so it's node-testable. `generate(items, ctx)` receives the station's band-sliced
// content (the loader slices it) and returns the quest's steps. One board kind for
// now — `quiz` — reused by every station (content partitioned by band). The Cosmic
// Gates would be added here later as their own kinds.

function shuffle(arr, rnd = Math.random) {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Returns ONE quiz PROBLEM (a random question from the band-sliced pool). The quest host
// (CourseQuest) calls generate() once per question and reads `problem.steps[0]` for the
// board + `problem.word` for the on-correct reveal — so the shape must be
// { steps: [step], word }, not a bare step. The board contract for a step is
// { prompt, choices, expected }; onPick(choice) is compared to step.expected.
export function genQuiz(items = [], _ctx = {}, rnd = Math.random) {
  const pool = items || [];
  const q = pool.length ? pool[Math.floor(rnd() * pool.length)] : { question: '', answer: null, distractors: [] };
  return {
    word: q.answer, // shown as the positive reveal when answered correctly
    steps: [{
      kind: 'quiz',
      prompt: q.question,
      choices: shuffle([q.answer, ...(q.distractors || [])], rnd),
      expected: q.answer,
      audioPrompt: q.question, // voice key; speak() no-ops until clips exist (commercial layer)
    }],
  };
}

// Practice missions are authored as an ordered list in YAML. Unlike `quiz`, this returns
// the full station mission sequence; the PracticeScreen paces through `steps`.
export function genPractice(items = [], _ctx = {}) {
  const steps = (items || []).map((item) => ({
    kind: item.kind,
    say: item.say,
    prompt: item.prompt,
    scene: item.scene,
    choices: item.choices, // pattern-pick answer tiles (optional)
    target: item.target || {},
    feedback: item.feedback || {},
    station: item.station,
    band: item.band,
  }));
  return {
    word: steps[0]?.target?.label ?? steps[0]?.target?.phase ?? null,
    steps,
  };
}

export const BOARD_GENERATORS = {
  quiz: { generate: genQuiz, content: 'questions' },
  practice: { generate: genPractice, content: 'practice' },
};
