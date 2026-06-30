// Interactive Space Quest practice host. Unlike QuizScreen's multiple-choice loop,
// this plays an authored ordered mission sequence from content.practice. Luna narrates
// every prompt (`step.say`), mechanics determine correctness, and persistence mirrors
// QuizScreen so map progression/stars keep working.
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { mutateSave } from '@discoveryquest/engine/save';
import { bump as track } from '@discoveryquest/engine/telemetry';
import MoonPositionPractice from './practice/MoonPositionPractice.jsx';
import StateDialPractice from './practice/StateDialPractice.jsx';
import TargetTapPractice from './practice/TargetTapPractice.jsx';
import SortZonesPractice from './practice/SortZonesPractice.jsx';
import OrderLinePractice from './practice/OrderLinePractice.jsx';
import ConnectStarsPractice from './practice/ConnectStarsPractice.jsx';

const MECHANICS = {
  'moon-position': MoonPositionPractice,
  'earth-spin': StateDialPractice,
  'orbit-season': StateDialPractice,
  'tap-hotspot': TargetTapPractice,
  'compare-strength': TargetTapPractice,
  'sort-zones': SortZonesPractice,
  'order-line': OrderLinePractice,
  'connect-stars': ConnectStarsPractice,
};

const pick = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);

export default function PracticeScreen({ station, course, onExit }) {
  const band = Math.max(...(station?.bands ?? [0]));
  const mission = useMemo(() => station.generate(), [station]);
  const steps = mission.steps || [];
  const startedAt = useMemo(() => Date.now(), [station]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);
  const [base, setBase] = useState('idle');
  const [bubble, setBubble] = useState("Listen to Luna, then solve the mission.");
  const mood = useLivelyMood(base);
  const talking = useSpeaking();

  const color = course.worlds?.find((w) => w.id === station?.worldId)?.color || '#22d3ee';
  const ui = course.meta.ui || {};
  const step = steps[idx];
  const Mechanic = step ? MECHANICS[step.kind] : null;

  useEffect(() => {
    if (!step || done) return;
    setLocked(false);
    setBase('idle');
    setBubble(step.prompt);
    const t = setTimeout(() => speak(step.say, { important: true }), 250);
    return () => clearTimeout(t);
  }, [step?.say, done]); // eslint-disable-line react-hooks/exhaustive-deps

  function replayPrompt() {
    if (!step?.say) return;
    hushAll();
    speak(step.say, { important: true });
  }

  function completeStep() {
    if (locked || done) return;
    setLocked(true);
    setCorrect((c) => c + 1);
    setBase('cheer');
    const say = step?.feedback?.correctSay || pick(course.meta.reactions?.praise);
    const line = say && course.narration?.[say] ? course.narration[say] : 'Yes! Nice work.';
    setBubble(line);
    hushAll();
    if (say) speak(say, { important: true });
    setTimeout(() => {
      if (idx + 1 >= steps.length) setDone(true);
      else setIdx((i) => i + 1);
    }, 1700);
  }

  function showHint(say = step?.feedback?.hintSay) {
    setBase('hint');
    const line = say && course.narration?.[say] ? course.narration[say] : 'Not quite — try again.';
    setBubble(line);
    hushAll();
    if (say) speak(say, { important: true });
  }

  const total = Math.max(steps.length, 1);
  const stars = correct >= total ? 3 : correct >= total - 1 ? 2 : correct >= Math.ceil(total / 2) ? 1 : 0;

  useEffect(() => {
    if (!done || !station?.id) return;
    mutateSave((s) => {
      s.stations = s.stations || {};
      const prev = s.stations[station.id] || { stars: 0, attempts: 0 };
      s.stations[station.id] = {
        stars: Math.max(prev.stars || 0, stars),
        bestBand: Math.max(prev.bestBand || 0, band),
        attempts: (prev.attempts || 0) + 1,
      };
      s.questCount = (s.questCount || 0) + 1;
    });
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    track(station.id, 'correct', correct);
    track(station.id, 'missed', total - correct);
    track(station.id, 'quests', 1);
    track(station.id, 'sec', elapsed);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreText = (ui.score ?? 'You logged {correct} of {total} discoveries!')
    .replace('{correct}', correct)
    .replace('{total}', total);

  return (
    <div className="font-display relative mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-10 pt-4 text-slate-200">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { hushAll(); onExit(); }} aria-label={ui.backToMap ?? 'Back'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
          <ArrowLeft size={18} />
        </button>
        <span className="truncate font-extrabold text-white">{station?.title}</span>
        <span className="ml-auto text-xs font-bold uppercase tracking-wider text-slate-400">
          {done ? 'Done' : `Mission ${Math.min(idx + 1, total)} of ${total}`}
        </span>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-2 w-2 rounded-full transition-colors"
            style={{ background: i < idx || done ? color : i === idx ? `${color}99` : '#ffffff22' }} />
        ))}
      </div>

      <motion.div drag dragMomentum={false} dragElastic={0.15} whileDrag={{ scale: 1.04 }}
        className="z-10 mx-auto mt-4 flex w-full cursor-grab touch-none flex-col items-center active:cursor-grabbing">
        <AnimatePresence mode="wait">
          <motion.div key={bubble} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-1 max-w-[310px] rounded-2xl border border-white/10 bg-[#141822]/90 px-4 py-2 text-center text-sm font-bold text-slate-200 backdrop-blur-md">
            {bubble}
            {!done && step?.say && (
              <button type="button" onClick={replayPrompt} aria-label="Replay Luna's prompt"
                className="ml-2 inline-flex align-middle text-cyan-300 hover:text-cyan-100">
                <RotateCcw size={13} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="scale-90"><LunaOwl mood={mood} talking={talking} /></div>
      </motion.div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-8 text-center">
            <h2 className="text-3xl font-extrabold text-white">{ui.done ?? 'Mission complete!'}</h2>
            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 1, 2].map((k) => <Star key={k} size={42} className={k < stars ? 'fill-yellow-300 text-yellow-300' : 'text-slate-700'} />)}
            </div>
            <p className="mt-2 font-bold text-slate-400">{scoreText}</p>
            <button type="button" onClick={() => { hushAll(); onExit(); }}
              className="mt-6 rounded-2xl px-7 py-3 text-lg font-extrabold text-slate-900 shadow-lg transition-transform hover:scale-[1.03]"
              style={{ background: color }}>
              {ui.backToMap ?? 'Back to the star map'}
            </button>
          </motion.div>
        ) : (
          <motion.div key={step?.say ?? 'empty'} initial={{ x: 28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -28, opacity: 0 }} className="mt-5">
            {Mechanic ? (
              <Mechanic step={step} disabled={locked} onCorrect={completeStep} onHint={showHint} />
            ) : (
              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-center">
                <p className="font-extrabold text-amber-100">This practice mechanic is not implemented yet.</p>
                <p className="mt-2 text-sm text-amber-100/70">Missing kind: {step?.kind ?? 'none'}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
