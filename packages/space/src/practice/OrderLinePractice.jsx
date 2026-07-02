import { useEffect, useMemo, useRef, useState } from 'react';

export default function OrderLinePractice({ step, onCorrect, onHint }) {
  const items = step?.target?.items || [];
  const targetOrder = step?.target?.order || items.map((i) => i.id);
  const initial = useMemo(() => [...items].reverse(), [step?.say]); // deliberately scrambled but deterministic
  const [list, setList] = useState(initial);
  const correct = list.length > 0 && list.map((i) => i.id).join('|') === targetOrder.join('|');

  useEffect(() => {
    setList(initial);
  }, [initial]);

  // Latest onCorrect without making it an effect dep: the parent recreates it on
  // every render (Luna's talking flips re-render PracticeScreen), and as a dep the
  // effect cleanup could cancel the pending timer mid-window.
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;
  useEffect(() => {
    if (!correct) return;
    const t = setTimeout(() => onCorrectRef.current?.(), 550);
    return () => clearTimeout(t);
  }, [correct]);

  const move = (idx, delta) => {
    const j = idx + delta;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[idx], next[j]] = [next[j], next[idx]];
    setList(next);
  };

  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[28px] border border-cyan-300/15 bg-slate-950/40 p-4 shadow-2xl shadow-cyan-950/30">
      <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-cyan-200">Arrange from first to last</p>
      <div className="flex flex-col gap-2">
        {list.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-extrabold text-cyan-200">{idx + 1}</span>
            <span className="text-2xl">{item.emoji}</span>
            <span className="flex-1 font-extrabold text-white">{item.label}</span>
            <button type="button" onClick={() => move(idx, -1)} className="rounded-xl bg-white/10 px-3 py-1 font-extrabold text-white disabled:opacity-30" disabled={idx === 0}>↑</button>
            <button type="button" onClick={() => move(idx, 1)} className="rounded-xl bg-white/10 px-3 py-1 font-extrabold text-white disabled:opacity-30" disabled={idx === list.length - 1}>↓</button>
          </div>
        ))}
      </div>
      {!correct && (
        <button type="button" onClick={() => onHint?.(step?.feedback?.hintSay)} className="mt-4 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-extrabold text-cyan-100">
          Ask Luna for a hint
        </button>
      )}
    </div>
  );
}
