import { useState } from 'react';
import { scoreQuiz } from './lesson.js';
import { useGameActions } from './store/useGame.js';

// "Learn it" — the station's teaching beat (spec §6). Shown at STATION_IDLE before
// the Cosmic Gate: swipe through fact cards (Luna narrates), answer a couple of
// questions, then launch the gate. Correct answers + the concept feed XP.
export default function StationLesson({ station }) {
  const actions = useGameActions();
  const facts = station?.facts ?? [];
  const questions = station?.questions ?? [];

  const [step, setStep] = useState(facts.length ? 'facts' : questions.length ? 'quiz' : 'done');
  const [factIdx, setFactIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [picked, setPicked] = useState(null);

  const startGate = () => actions.startGate();
  // Record the lesson (→ XP + collect facts into the Discovery Deck), then finish.
  const finish = (correct) => { actions.recordLesson({ correct, concept: station?.concept }); setStep('done'); };

  const nextFact = () => {
    if (factIdx < facts.length - 1) setFactIdx(factIdx + 1);
    else if (questions.length) setStep('quiz');
    else finish(0);
  };

  const pick = (opt) => { if (!picked) { setPicked(opt); setAnswers((a) => ({ ...a, [qIdx]: opt })); } };

  const nextQuestion = () => {
    const merged = { ...answers, [qIdx]: picked };
    setPicked(null);
    if (qIdx < questions.length - 1) { setQIdx(qIdx + 1); }
    else finish(scoreQuiz(questions, merged).correct);
  };

  const q = questions[qIdx];

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.head}>
          <span style={{ fontSize: 22 }} role="img" aria-label="Luna">🦉</span>
          <strong>{station?.title}</strong>
          <button style={S.skip} onClick={startGate} aria-label="Skip to the challenge">skip →</button>
        </div>

        {step === 'facts' && (
          <>
            <div style={{ fontSize: 52 }} role="img" aria-hidden>{facts[factIdx].emoji}</div>
            <p style={S.fact}>{facts[factIdx].text}</p>
            <div style={S.dots}>{facts.map((_, i) => <span key={i} style={{ ...S.dot, opacity: i === factIdx ? 1 : 0.3 }} />)}</div>
            <button style={S.btn} onClick={nextFact}>{factIdx < facts.length - 1 ? 'Next' : questions.length ? "Let's check!" : 'Got it!'}</button>
          </>
        )}

        {step === 'quiz' && q && (
          <>
            <p style={S.prompt}>{q.prompt}</p>
            <div style={S.options}>
              {q.options.map((opt) => {
                const chosen = picked === opt;
                const reveal = picked != null;
                const isAnswer = opt === q.answer;
                const bg = reveal && isAnswer ? '#22c55e' : reveal && chosen ? '#ef4444' : 'rgba(15,23,42,0.7)';
                return (
                  <button key={opt} onClick={() => pick(opt)} disabled={reveal} style={{ ...S.opt, background: bg }}>{opt}</button>
                );
              })}
            </div>
            <div style={S.qfoot}>
              <span style={{ opacity: 0.6, fontSize: 13 }}>Question {qIdx + 1} of {questions.length}</span>
              {picked != null && <button style={S.btn} onClick={nextQuestion}>{qIdx < questions.length - 1 ? 'Next' : 'Done'}</button>}
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p style={S.fact}>Nice work! Now let's try the challenge. 🚀</p>
            <button style={S.btn} onClick={startGate}>Start the challenge</button>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', background: 'rgba(2,4,10,0.55)' },
  card: { pointerEvents: 'auto', width: 380, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: 24, borderRadius: 20, color: '#e2e8f0', font: '16px/1.45 system-ui, sans-serif', background: 'rgba(8,12,28,0.88)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.25)' },
  head: { display: 'flex', alignItems: 'center', gap: 8, width: '100%' },
  skip: { marginLeft: 'auto', cursor: 'pointer', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13 },
  fact: { margin: 0 },
  prompt: { margin: 0, fontWeight: 700 },
  dots: { display: 'flex', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#67e8f9' },
  options: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%' },
  opt: { cursor: 'pointer', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#e2e8f0', textAlign: 'left' },
  qfoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 16, fontWeight: 700, color: '#06121a', background: 'linear-gradient(180deg,#67e8f9,#22d3ee)' },
};
