// Course-driven quest host — one host that plays any loaded course's station.
// Generalizes the per-game QuestHost: the board comes from the station (station.Board),
// the reveal shows emoji + word + optional gloss, and all chrome/reactions come from the
// loaded course (course.meta.ui / course.meta.reactions) rather than a local voiceLines.js.
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import Emoji from '@discoveryquest/engine-ui/Emoji';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { mutateSave } from '@discoveryquest/engine/save';

const QUEST_LEN = 6;
const pickReaction = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);

export default function CourseQuest({ station, course, onExit }) {
  const band = Math.max(...(station?.bands ?? [0]));
  const quest = useMemo(
    () => Array.from({ length: QUEST_LEN }, () => station.generate()),
    [station],
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [reveal, setReveal] = useState(null); // { emoji, en, ru }
  const [base, setBase] = useState('idle');
  const mood = useLivelyMood(base);
  const talking = useSpeaking();

  const problem = quest[idx];
  const step = problem.steps[0];
  const Board = station.Board;

  function onPick(choice) {
    if (picked != null) return;
    setPicked(choice);
    const right = choice === step.expected;
    hushAll(); // the child answered → clear any in-flight prompt so feedback plays now
    if (right) {
      setCorrect((c) => c + 1);
      setBase('cheer');
      setReveal({ emoji: problem.emoji, en: problem.word, ru: problem.ru });
      speak([pickReaction(course.meta.reactions?.praise), ...(step.sayA || [])].filter(Boolean), { important: true });
    } else {
      setBase('hint');
      const oops = pickReaction(course.meta.reactions?.oops);
      if (oops) speak(oops, { important: true });
    }
    setTimeout(() => {
      hushAll();
      setBase('idle');
      setReveal(null);
      if (idx + 1 >= QUEST_LEN) {
        setDone(true);
        setTimeout(() => {
          const solved = pickReaction(course.meta.reactions?.solved);
          if (solved) speak(solved, { important: true });
        }, 60);
      } else {
        setPicked(null);
        setIdx((i) => i + 1);
      }
    }, right ? 3000 : 1700);
  }

  const stars = correct >= QUEST_LEN ? 3 : correct >= QUEST_LEN - 2 ? 2 : correct >= QUEST_LEN / 2 ? 1 : 0;

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
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneHeading = course.meta.ui?.done ?? 'Great job!';
  const backToMap = course.meta.ui?.backToMap ?? 'Back to the map';
  const scoreTpl = course.meta.ui?.score ?? 'You got {correct} of {total}!';
  const scoreText = scoreTpl.replace('{correct}', correct).replace('{total}', QUEST_LEN);

  return (
    <div className="font-display relative flex min-h-full flex-col items-center px-5 py-6 text-slate-200">
      <button type="button" onClick={() => { hushAll(); onExit(); }} aria-label={course.meta.ui?.backToMap ?? 'Back'}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
        <ArrowLeft size={18} />
      </button>

      <div className="mt-1 flex gap-1.5">
        {quest.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < idx || done ? 'bg-emerald-300' : i === idx ? 'bg-emerald-300/60' : 'bg-white/15'}`} />
        ))}
      </div>

      <div className="mt-3 scale-90"><LunaOwl mood={mood} talking={talking} /></div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 text-center">
            <h2 className="text-3xl font-extrabold text-white">{doneHeading}</h2>
            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 1, 2].map((k) => (<Star key={k} size={40} className={k < stars ? 'fill-yellow-300 text-yellow-300' : 'text-slate-700'} />))}
            </div>
            <p className="mt-2 font-bold text-slate-400">{scoreText}</p>
            <button type="button" onClick={() => { hushAll(); onExit(); }}
              className="mt-6 rounded-2xl bg-amber-400 px-7 py-3 text-lg font-extrabold text-slate-900 hover:bg-amber-300">
              {backToMap}
            </button>
          </motion.div>
        ) : (
          <motion.div key={idx} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="mt-6 w-full max-w-md">
            <Board step={step} picked={picked} onPick={onPick} />
            <AnimatePresence>
              {reveal && (
                <motion.div key="reveal" initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="mt-6 flex flex-col items-center gap-1">
                  {reveal.emoji && <span className="text-7xl" style={{ filter: 'drop-shadow(0 0 14px rgba(74,222,128,0.4))' }}><Emoji char={reveal.emoji} /></span>}
                  <span className="text-3xl font-extrabold text-emerald-300" style={{ textShadow: '0 0 12px #4ADE8088' }}>{reveal.en}</span>
                  {reveal.ru && <span className="text-lg font-bold text-slate-400">{reveal.ru}</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
