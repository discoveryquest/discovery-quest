// Pure scoring for a station's "Learn it" check — the multiple-choice questions
// a child answers after the fact cards, before the Cosmic Gate (spec §6).
// No three/React → unit-testable.

export function scoreQuiz(questions = [], answers = {}) {
  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
  const total = questions.length;
  return { correct, total, allCorrect: total > 0 && correct === total };
}
