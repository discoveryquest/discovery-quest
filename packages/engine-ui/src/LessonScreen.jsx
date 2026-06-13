// LessonScreen — the lesson engine (see docs/specs/2026-06-13-lesson-engine-design.md).
// A lesson is a sequence of BEATS; each beat speaks one line while one visual is on
// screen, and we advance to the next beat when that line FINISHES — so the animation is
// always in sync with the narration. Content-agnostic: the app supplies the lesson data
// + a `renderView(view)` that turns a beat's `view` into a node.
//
//   lesson = { title, sections: [ { id, label, beats: [ { say, caption?, view, advance? } ] } ] }
//   beat.advance: 'narration' (default — when the clip ends) | <ms> (for silent beats)
//   beat.view:    { kind, key?, ...props }  — `key` groups beats that share one scene so
//                 the visual persists (and animates) across them; a new key cross-fades.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Pause, Play, RotateCcw } from 'lucide-react';
import { speak, hushAll, isSpeaking, currentClipDuration } from '@discoveryquest/voice-kit/audio';

export default function LessonScreen({ lesson, renderView, onDone }) {
  const reduce = useReducedMotion();
  // flatten beats, remembering each beat's section index for the scrub bar
  const beats = [];
  (lesson?.sections || []).forEach((s, si) => (s.beats || []).forEach((b) => beats.push({ ...b, si })));

  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);

  // narrate the current beat (also runs on replay/jump). Hush first so a beat's line
  // always starts fresh — never queues behind a previous line that ran long.
  useEffect(() => {
    if (!beats.length) return;
    hushAll();
    speak(beats[i].say, { important: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // advance when this beat's narration finishes (or after a fixed ms for silent beats)
  useEffect(() => {
    if (!beats.length || paused || done) return;
    const beat = beats[i];
    // 'hold' beats never auto-advance — an interactive/explore screen the learner leaves
    // via the section bar or "Let's practice!" (e.g. a tap-to-hear sound board).
    if (beat.advance === 'hold') return;
    const fixed = typeof beat.advance === 'number' ? beat.advance : null;
    const startedAt = Date.now();
    const MIN = 1100; // even a one-word beat lingers a touch
    const HARD_MAX = 16000; // absolute safety net if duration never resolves
    let advanceT;
    const poll = setInterval(() => {
      const el = Date.now() - startedAt;
      // Primary: when narration ENDS (isSpeaking flips false on the clip's 'ended').
      // Fallback: the clip's known duration + a breath — so a beat advances close to
      // the end of the line even if the 'ended' event never fires (e.g. no audio
      // device, or a clip that fails to load), instead of waiting a flat cap.
      const durMs = (currentClipDuration() || 0) * 1000;
      const byDuration = durMs > 0 && el >= durMs + 600;
      const ready = fixed != null ? el >= fixed : el > MIN && (!isSpeaking() || byDuration);
      if (ready || el > HARD_MAX) {
        clearInterval(poll);
        advanceT = setTimeout(() => (i < beats.length - 1 ? setI(i + 1) : setDone(true)), reduce ? 120 : 320);
      }
    }, 120);
    return () => {
      clearInterval(poll);
      clearTimeout(advanceT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused, done]);

  // clean up audio on unmount
  useEffect(() => () => hushAll(), []);

  if (!lesson || !beats.length) {
    onDone();
    return null;
  }
  const beat = beats[i];

  function replayAll() {
    hushAll();
    setI(0);
    setDone(false);
    setPaused(false);
    // re-narrate beat 0 even if already there
    setTimeout(() => speak(beats[0].say, { important: true }), 0);
  }
  function jumpToSection(si) {
    const target = beats.findIndex((b) => b.si === si);
    if (target < 0) return;
    setI(target);
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
          className="relative w-full max-w-[480px] rounded-3xl border-2 border-cyan-300/30 bg-[#14171f] p-5 text-slate-200 shadow-2xl"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onDone}
            className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
          <h2 className="mb-3 text-center text-xl font-extrabold text-white">📖 {lesson.title}</h2>

          {/* stage — the beat's visual; persists across beats that share a view.key */}
          <div className="relative flex min-h-[250px] items-center justify-center rounded-2xl bg-[#0e1014] p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat.view?.key || beat.view?.kind || i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {renderView(beat.view, beat)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* caption — the line being spoken, for readers */}
          <div className="mt-3 flex min-h-[40px] items-center justify-center">
            <AnimatePresence mode="wait">
              {beat.caption && (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm font-bold leading-snug text-slate-300"
                >
                  {beat.caption}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* control + section scrub bar */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              aria-label={done ? 'Watch again' : paused ? 'Play' : 'Pause'}
              onClick={() => (done ? replayAll() : setPaused((p) => !p))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              {done ? <RotateCcw size={16} /> : paused ? <Play size={16} className="fill-slate-200" /> : <Pause size={16} className="fill-slate-200" />}
            </button>
            <div className="flex flex-1 gap-1.5">
              {lesson.sections.map((s, si) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpToSection(si)}
                  className="group flex flex-1 flex-col items-center gap-1"
                  title={s.label}
                >
                  <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-white/12">
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ background: si <= beat.si ? '#22d3ee' : 'transparent' }}
                      animate={si === beat.si && !paused && !done ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
                      transition={si === beat.si && !paused && !done ? { repeat: Infinity, duration: 1.4 } : {}}
                    />
                  </span>
                </button>
              ))}
            </div>
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
