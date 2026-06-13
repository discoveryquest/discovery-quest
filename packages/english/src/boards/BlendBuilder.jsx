// Audio-first blending board: play a word's sounds, child taps scrambled letter tiles
// in order to BUILD the spelling. Calls onPick(assembledWord) once all slots are filled
// (the quest then compares it to step.expected — same generic contract as SoundToLetter).
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Music } from 'lucide-react';
import { speak } from '@discoveryquest/voice-kit/audio';

export default function BlendBuilder({ step, picked, onPick }) {
  const tiles = step.tiles; // scrambled letters; track by index (handles repeats)
  const n = step.expected.length;
  const [placed, setPlaced] = useState([]); // tile indices, in placed order
  const answered = picked != null;
  const lastKey = useRef(null);

  // play the segmented sounds when a new problem appears
  useEffect(() => {
    if (lastKey.current === step.audioPrompt) return;
    lastKey.current = step.audioPrompt;
    const t = setTimeout(() => speak(step.sounds || [step.audioPrompt], { important: true }), 450);
    return () => clearTimeout(t);
  }, [step.audioPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  function place(i) {
    if (answered || placed.includes(i) || placed.length >= n) return;
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === n) onPick(next.map((k) => tiles[k]).join(''));
  }
  const removeAt = (slot) => !answered && setPlaced(placed.filter((_, s) => s !== slot));

  const assembled = placed.map((k) => tiles[k]).join('');
  const correct = answered && assembled === step.expected;
  const disp = (s) => (step.lower ? s : s.toUpperCase()); // case matches the stage

  const slotState = (slot) => {
    if (!answered) return placed[slot] != null ? 'filled' : 'empty';
    return correct ? 'correct' : 'wrong';
  };
  const slotCls = {
    empty: 'border-white/15 text-slate-600',
    filled: 'border-cyan-300/60 bg-cyan-400/10 text-white',
    correct: 'border-emerald-300 bg-emerald-400/20 text-emerald-200',
    wrong: 'border-rose-400 bg-rose-500/15 text-rose-200',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        <button type="button" onClick={() => speak(step.sounds || [step.audioPrompt], { important: true })}
          className="flex items-center gap-2 rounded-full bg-cyan-400/15 px-5 py-3 font-extrabold text-cyan-200 ring-2 ring-cyan-300/40 transition hover:bg-cyan-400/25">
          <Music size={20} /> Play the sounds
        </button>
        <button type="button" onClick={() => speak(step.audioPrompt, { important: true })}
          className="flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 font-extrabold text-slate-200 ring-1 ring-white/15 transition hover:bg-white/10">
          <Volume2 size={20} /> The word
        </button>
      </div>

      <p className="text-sm font-bold text-slate-400">{step.prompt}</p>

      {/* slots */}
      <div className="flex gap-2.5">
        {Array.from({ length: n }, (_, slot) => {
          const idx = placed[slot];
          return (
            <button key={slot} type="button" onClick={() => idx != null && removeAt(slot)} disabled={answered}
              className={`font-mono flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-4xl font-extrabold ${slotCls[slotState(slot)]}`}>
              {idx != null ? disp(tiles[idx]) : ''}
            </button>
          );
        })}
      </div>

      {/* tray of remaining tiles */}
      <div className="flex min-h-[64px] flex-wrap items-center justify-center gap-3">
        {tiles.map((c, i) => placed.includes(i) ? (
          <span key={i} className="h-14 w-14" />
        ) : (
          <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} disabled={answered} onClick={() => place(i)}
            className="font-mono flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/10 bg-white/5 text-3xl font-extrabold text-white transition-colors hover:border-cyan-300/60 hover:bg-white/10">
            {disp(c)}
          </motion.button>
        ))}
      </div>

      {answered && !correct && (
        <p className="font-mono text-sm font-bold text-slate-400">It spells <span className="text-emerald-300">{disp(step.expected)}</span></p>
      )}
    </div>
  );
}
