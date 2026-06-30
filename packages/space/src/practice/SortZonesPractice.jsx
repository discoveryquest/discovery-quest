import { useEffect, useState } from 'react';

export default function SortZonesPractice({ step, onCorrect, onHint }) {
  const zones = step?.target?.zones || [];
  const tokens = step?.target?.tokens || [];
  const [selected, setSelected] = useState(null);
  const [placed, setPlaced] = useState({});
  const done = tokens.length > 0 && tokens.every((t) => placed[t.id]);
  const correct = done && tokens.every((t) => placed[t.id] === t.zone);

  useEffect(() => {
    if (!done) return;
    if (correct) {
      const t = setTimeout(() => onCorrect?.(), 500);
      return () => clearTimeout(t);
    }
    onHint?.(step?.feedback?.hintSay);
  }, [done, correct]); // eslint-disable-line react-hooks/exhaustive-deps

  const assign = (zoneId) => {
    if (!selected) return;
    setPlaced((p) => ({ ...p, [selected]: zoneId }));
    setSelected(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-col gap-4">
      <div className="rounded-[28px] border border-cyan-300/15 bg-slate-950/40 p-4 shadow-2xl shadow-cyan-950/30">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-cyan-200">1. Pick an object · 2. Tap a zone</p>
        <div className="flex flex-wrap justify-center gap-2">
          {tokens.map((token) => {
            const zone = placed[token.id];
            const isSelected = selected === token.id;
            const isWrong = done && zone !== token.zone;
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => setSelected(token.id)}
                className="rounded-2xl border px-3 py-2 text-sm font-extrabold text-white transition-transform active:scale-95"
                style={{
                  borderColor: isWrong ? '#fb7185' : isSelected ? '#67e8f9' : zone ? '#34d399' : 'rgba(255,255,255,.14)',
                  background: isSelected ? 'rgba(34,211,238,.22)' : 'rgba(2,6,23,.55)',
                }}
              >
                <span className="mr-1 text-xl">{token.emoji}</span>{token.label}
                {zone && <span className="ml-2 text-[10px] text-cyan-200">→ {zones.find((z) => z.id === zone)?.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => assign(zone.id)}
            disabled={!selected}
            className="min-h-[120px] rounded-[24px] border p-3 text-center transition-transform enabled:active:scale-95 disabled:opacity-55"
            style={{ borderColor: selected ? '#67e8f9' : 'rgba(255,255,255,.14)', background: 'rgba(15,23,42,.72)' }}
          >
            <div className="text-3xl">{zone.emoji || '✨'}</div>
            <div className="mt-1 text-base font-extrabold text-white">{zone.label}</div>
            <div className="mt-1 text-xs font-bold text-slate-400">{zone.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
