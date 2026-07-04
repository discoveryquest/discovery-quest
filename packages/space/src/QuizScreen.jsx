// Space Quest practice screen — a richer, Math-style quest host (vs English's plain
// CourseQuest): a question counter, a DRAGGABLE Luna with a speech bubble that reacts, and
// big animated answer tiles with A/B/C badges + correct/wrong feedback. Same quest logic as
// CourseQuest (6 questions from station.generate(), best-of stars persisted to the save).
// The per-question visuals (emoji/images) come later with the real content.
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { mutateSave } from '@discoveryquest/engine/save';
import { bump as track } from '@discoveryquest/engine/telemetry';

const QUEST_LEN = 6;
const BADGES = ['A', 'B', 'C', 'D'];
const pick = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
const CHEER = ['Tap the best answer!', "You've got this!", 'Think it through…', 'Keep exploring!'];

export default function QuizScreen({ station, course, onExit }) {
  const band = Math.max(...(station?.bands ?? [0]));
  const quest = useMemo(() => Array.from({ length: QUEST_LEN }, () => station.generate()), [station]);
  const startedAt = useMemo(() => Date.now(), [station]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [base, setBase] = useState('idle');
  const [bubble, setBubble] = useState("Let's explore! Tap the best answer.");
  const mood = useLivelyMood(base);
  const talking = useSpeaking();

  const color = course.worlds?.find((w) => w.id === station?.worldId)?.color || '#22d3ee';
  const step = quest[idx].steps[0];

  function onPick(choice) {
    if (picked != null) return;
    setPicked(choice);
    const right = choice === step.expected;
    hushAll();
    if (right) {
      setCorrect((c) => c + 1);
      setBase('cheer');
      setBubble(pick(['Yes! 🎉', 'Nice work!', 'You got it!']));
      const r = pick(course.meta.reactions?.praise);
      if (r) speak(r, { important: true });
    } else {
      setBase('hint');
      setBubble('Not quite — remember what we learned!');
      const o = pick(course.meta.reactions?.oops);
      if (o) speak(o, { important: true });
    }
    setTimeout(() => {
      setBase('idle');
      if (idx + 1 >= QUEST_LEN) {
        setDone(true);
        const solved = pick(course.meta.reactions?.solved);
        if (solved) setTimeout(() => speak(solved, { important: true }), 60);
      } else {
        setPicked(null);
        setBubble(pick(CHEER));
        setIdx((i) => i + 1);
      }
    }, right ? 1500 : 1900);
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
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    track(station.id, 'correct', correct);
    track(station.id, 'missed', QUEST_LEN - correct);
    track(station.id, 'quests', 1);
    track(station.id, 'sec', elapsed);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const ui = course.meta.ui || {};
  const scoreText = (ui.score ?? 'You got {correct} of {total}!').replace('{correct}', correct).replace('{total}', QUEST_LEN);

  return (
    <div className="font-display relative mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-10 pt-4 text-slate-200">
      {/* header: back + station title + question counter */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { hushAll(); onExit(); }} aria-label={ui.backToMap ?? 'Back'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
          <ArrowLeft size={18} />
        </button>
        <span className="truncate font-extrabold text-white">{station?.title}</span>
        <span className="ml-auto text-xs font-bold uppercase tracking-wider text-slate-400">
          {done ? 'Done' : `Question ${idx + 1} of ${QUEST_LEN}`}
        </span>
      </div>

      {/* progress dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {quest.map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-full transition-colors"
            style={{ background: i < idx || done ? color : i === idx ? `${color}99` : '#ffffff22' }} />
        ))}
      </div>

      {/* draggable Luna + speech bubble */}
      <motion.div drag dragMomentum={false} dragElastic={0.15} whileDrag={{ scale: 1.05 }}
        className="z-10 mx-auto mt-4 flex w-full cursor-grab touch-none flex-col items-center active:cursor-grabbing">
        <AnimatePresence mode="wait">
          <motion.div key={bubble} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-1 max-w-[280px] rounded-2xl border border-white/10 bg-[#141822]/90 px-4 py-2 text-center text-sm font-bold text-slate-200 backdrop-blur-md">
            {bubble}
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
          <motion.div key={idx} initial={{ x: 28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -28, opacity: 0 }} className="mt-6">
            <p className="text-center text-2xl font-extrabold leading-snug text-white">{step.prompt}</p>
            <div className="mt-6 flex flex-col gap-3">
              {step.choices.map((c, i) => {
                const answered = picked != null;
                const isPick = c === picked;
                const isAnswer = c === step.expected;
                const stateStyle = !answered
                  ? { borderColor: '#ffffff1a', background: '#ffffff0a' }
                  : isAnswer ? { borderColor: '#34d399', background: '#10b98122' }
                    : isPick ? { borderColor: '#fb7185', background: '#f43f5e1f' }
                      : { borderColor: '#ffffff14', background: '#ffffff05', opacity: 0.6 };
                return (
                  <motion.button key={c} type="button" disabled={answered}
                    whileHover={!answered ? { scale: 1.02 } : undefined} whileTap={!answered ? { scale: 0.97 } : undefined}
                    onClick={() => onPick(c)}
                    className="flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold text-white transition-colors"
                    style={stateStyle}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                      style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}>
                      {BADGES[i]}
                    </span>
                    <span className="flex-1">{c}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
