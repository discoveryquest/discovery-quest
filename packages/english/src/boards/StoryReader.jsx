// Story Harbor read-along: shows a short decodable story and narrates it word by word,
// highlighting the current word (karaoke) so a new reader can track along. Audio is
// automatic with a pause/resume control. When the story finishes it asks a comprehension
// question (tap the word you heard). Standard board contract: ({ step, picked, onPick }).
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Volume2 } from 'lucide-react';
import { playWords, speak } from '@discoveryquest/voice-kit/audio';

function tileClasses(state) {
  if (state === 'correct') return 'border-emerald-300 bg-emerald-400/20 text-emerald-200';
  if (state === 'wrong') return 'border-rose-400 bg-rose-500/15 text-rose-200';
  if (state === 'reveal') return 'border-emerald-300/70 bg-emerald-400/10 text-emerald-200';
  return 'border-white/10 bg-white/5 text-white hover:border-cyan-300/60 hover:bg-white/10';
}

export default function StoryReader({ step, picked, onPick }) {
  const words = step.words || []; // [{ text, say }]
  const storyKey = words.map((w) => w.text).join(' ');

  const [hi, setHi] = useState(-1); // index of the word being read
  const [phase, setPhase] = useState('reading'); // 'reading' | 'question'
  const [paused, setPaused] = useState(false);
  const ctrlRef = useRef(null);

  // (Re)start the read-along whenever the story changes. The quest host reuses this
  // component across questions (no key), so we drive off the story, not mount.
  useEffect(() => {
    setHi(-1); setPhase('reading'); setPaused(false);
    // map each clip back to its word index so we can highlight the right one
    const seq = words.map((w, idx) => ({ key: w.say, idx })).filter((x) => x.key);
    ctrlRef.current = playWords(seq.map((x) => x.key), {
      onWord: (n) => setHi(seq[n].idx),
      onDone: () => { setHi(-1); toQuestion(); },
    });
    return () => ctrlRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyKey]);

  function toQuestion() {
    setPhase('question');
    if (step.audioPrompt) setTimeout(() => speak(step.audioPrompt, { important: true }), 350);
  }

  function togglePause() {
    const c = ctrlRef.current; if (!c) return;
    if (c.isPaused()) { c.resume(); setPaused(false); } else { c.pause(); setPaused(true); }
  }

  function skip() { ctrlRef.current?.stop(); setHi(-1); toQuestion(); }

  const answered = picked != null;

  return (
    <div className="flex w-full max-w-[460px] flex-col items-center gap-6">
      {/* the story — each word a tappable/highlightable token */}
      <p className="text-center text-2xl font-extrabold leading-relaxed text-slate-100 sm:text-3xl">
        {words.map((w, i) => (
          <motion.span
            key={i}
            animate={hi === i ? { scale: 1.12 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="mx-[3px] inline-block rounded-lg px-1"
            style={hi === i
              ? { color: '#0e1124', background: '#fcd34d', boxShadow: '0 0 18px rgba(252,211,77,0.6)' }
              : { color: '#e2e8f0' }}
          >
            {w.text}
          </motion.span>
        ))}
      </p>

      {phase === 'reading' ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            className="flex items-center gap-2 rounded-full bg-cyan-400/15 px-6 py-3 text-base font-extrabold text-cyan-200 ring-2 ring-cyan-300/40 transition hover:bg-cyan-400/25"
          >
            {paused ? <Play size={22} /> : <Pause size={22} />}
            {paused ? 'Play' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={skip}
            className="rounded-full px-4 py-3 text-sm font-bold text-slate-400 transition hover:text-slate-200"
          >
            Skip →
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => step.audioPrompt && speak(step.audioPrompt, { important: true })}
            className="flex items-center gap-2 rounded-full bg-cyan-400/15 px-5 py-2.5 text-sm font-extrabold text-cyan-200 ring-2 ring-cyan-300/40 transition hover:bg-cyan-400/25"
          >
            <Volume2 size={20} /> {step.prompt || 'Tap the word you heard'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            {step.choices.map((c) => {
              const state = !answered ? 'idle'
                : c === picked && c === step.expected ? 'correct'
                  : c === picked ? 'wrong'
                    : c === step.expected ? 'reveal' : 'idle';
              return (
                <motion.button key={c} type="button" whileTap={{ scale: 0.94 }} disabled={answered} onClick={() => onPick(c)}
                  className={`flex h-14 min-w-[120px] items-center justify-center rounded-2xl border-2 px-5 text-2xl font-extrabold transition-colors ${tileClasses(state)}`}>
                  {step.lower ? c : c.toUpperCase()}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
