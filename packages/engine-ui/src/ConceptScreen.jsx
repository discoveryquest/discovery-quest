// "Learn it" concept screen — a generic, content-agnostic modal that walks
// through one idea as several narrated representations. The app supplies:
//
//   { title, intro: <voiceKey>, example, reps: [{ id, label, voice, render(example, run) }] }
//
// Hands-free + chaptered (YouTube-style): on open it narrates the intro, plays
// the first chapter, and AUTO-ADVANCES to the next when that chapter's narration
// finishes — no clicks needed. A chapter bar shows the sections; tap one to jump
// or replay, and pause/resume the walkthrough. Reps are arbitrary nodes, so this
// works for any subject (math, English, …) without the screen knowing content.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Pause, Play, RotateCcw } from 'lucide-react';
import { speak, hushAll, isSpeaking } from '@discoveryquest/voice-kit/audio';

// Shown briefly when the walkthrough auto-advances to the next representation.
const TRANSITIONS = [
  "Here's another way to look at it!",
  "Now let's see it a different way!",
  'Same idea — a new picture!',
];

export default function ConceptScreen({ concept, onDone }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(0); // bumps on every nav/replay → re-mounts the rep so its animation plays again
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transMsg, setTransMsg] = useState(null); // "here's another way…" between chapters

  const reps = concept?.reps || [];
  const multi = reps.length > 1;

  // Intro the concept once on open. (A parent must NOT hushAll for this screen —
  // child effects run before parent effects, so a parent hush would cut the
  // intro off. The parent only pauses music for concepts.)
  useEffect(() => {
    if (!concept) return;
    hushAll();
    speak(concept.intro, { important: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Narrate the current chapter whenever we navigate or replay.
  useEffect(() => {
    if (!concept) return;
    speak(reps[idx].voice, { important: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, run]);

  // Hands-free auto-advance: once this chapter's narration finishes (or a max
  // dwell elapses), move to the next — unless paused or we're on the last one.
  useEffect(() => {
    if (!concept || paused || done) return;
    const startedAt = Date.now();
    const MIN = 2800; // each chapter lingers at least this long (covers no-audio)
    const MAX = 13000; // safety cap if narration never reports done
    let advanceT;
    const poll = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if ((elapsed > MIN && !isSpeaking()) || elapsed > MAX) {
        clearInterval(poll);
        advanceT = setTimeout(() => {
          if (idx < reps.length - 1) {
            setTransMsg(TRANSITIONS[idx % TRANSITIONS.length]);
            setIdx(idx + 1);
            setRun((r) => r + 1);
          } else {
            setDone(true);
          }
        }, reduce ? 150 : 800);
      }
    }, 250);
    return () => {
      clearInterval(poll);
      clearTimeout(advanceT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, run, paused, done]);

  // The "here's another way…" caption is brief.
  useEffect(() => {
    if (!transMsg) return;
    const t = setTimeout(() => setTransMsg(null), 1600);
    return () => clearTimeout(t);
  }, [transMsg]);

  if (!concept) {
    onDone();
    return null;
  }
  const rep = reps[idx];

  function jump(i) {
    setIdx(i);
    setRun((r) => r + 1);
    setDone(false);
    setPaused(false);
  }

  // Watch again from the very start — the play/pause control becomes this once
  // the walkthrough finishes (replaces per-rep "Show again" buttons).
  function replayAll() {
    hushAll();
    speak(concept.intro, { important: true });
    setIdx(0);
    setRun((r) => r + 1);
    setDone(false);
    setPaused(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm font-display"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative w-full max-w-[460px] rounded-3xl border-2 border-cyan-300/30 bg-[#14171f] p-5 text-slate-200 shadow-2xl"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onDone}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
          <h2 className="mb-1 text-center text-xl font-extrabold text-white">📖 {concept.title}</h2>
          <p className="mb-3 text-center text-xs font-bold text-slate-400">
            {multi ? 'Watch and listen — Luna walks you through each way to see it.' : 'Watch and listen — Luna shows you how.'}
          </p>

          {/* chapter stage */}
          <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden rounded-2xl bg-[#0e1014] p-4">
            <AnimatePresence>
              {transMsg && (
                <motion.div
                  key={transMsg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[#0e1014]"
                >
                  <motion.span
                    initial={{ scale: 0.9, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-extrabold text-cyan-200"
                  >
                    ✨ {transMsg}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${idx}-${run}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {rep.render(concept.example, run)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* play / pause / watch-again control + chapter sections (auto-plays) */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              aria-label={done ? 'Watch again' : paused ? 'Play' : 'Pause'}
              onClick={() => (done ? replayAll() : setPaused((p) => !p))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              {done ? (
                <RotateCcw size={16} />
              ) : paused ? (
                <Play size={16} className="fill-slate-200" />
              ) : (
                <Pause size={16} className="fill-slate-200" />
              )}
            </button>
            {multi && (
              <div className="flex flex-1 gap-1.5">
                {reps.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => jump(i)}
                    className="group flex flex-1 flex-col items-center gap-1"
                    title={r.label}
                  >
                    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-white/12">
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ background: i <= idx ? '#22d3ee' : 'transparent' }}
                        animate={i === idx && !paused && !done ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
                        transition={i === idx && !paused && !done ? { repeat: Infinity, duration: 1.4 } : {}}
                      />
                    </span>
                    <span
                      className={`text-[10px] font-extrabold leading-tight ${
                        i === idx ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    >
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.button
            type="button"
            onClick={onDone}
            animate={done ? { scale: [1, 1.035, 1] } : { scale: 1 }}
            transition={done ? { repeat: Infinity, duration: 1.5 } : { duration: 0.2 }}
            className="mt-4 w-full rounded-xl bg-cyan-400 py-3 text-lg font-extrabold text-slate-900 hover:bg-cyan-300"
          >
            Let's practice! →
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
