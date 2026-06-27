// Reveal2D — INTERACTIVE tap-to-reveal hotspots over an optional base scene.
// Tapping a hotspot adds it to a revealed Set, shows label+caption, and calls speak().
// Hotspots positioned by x/y percentages or auto-laid-out in a row.
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';
import { SpaceStage } from './base.jsx';
// Static import is SAFE despite the Scene → renderers.jsx → Reveal2D cycle: Scene is only
// referenced at RENDER time (not module-eval time), so ES live bindings are resolved by then.
import Scene from '../Scene.jsx';

export default function Reveal2D({ base, hotspots = [] }) {
  const [revealed, setRevealed] = useState(new Set());
  const [active, setActive] = useState(null);

  const tap = useCallback(
    (h) => {
      setRevealed((prev) => new Set([...prev, h.id]));
      setActive(h);
      if (h.say) speak(h.say, { important: true });
    },
    [],
  );

  const hasPositions = hotspots.some((h) => h.x != null || h.y != null);

  return (
    <SpaceStage>
      <div className="relative h-full w-full">
        {/* Base scene */}
        {base && (
          <div className="absolute inset-0">
            <Scene descriptor={base} />
          </div>
        )}

        {/* Hotspot buttons — positioned or row */}
        {hasPositions ? (
          // Absolutely-positioned hotspots
          hotspots.map((h) => {
            const isRevealed = revealed.has(h.id);
            const isActive = active?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => tap(h)}
                aria-pressed={isRevealed}
                aria-label={h.label}
                style={{
                  position: 'absolute',
                  left: `${h.x ?? 50}%`,
                  top: `${h.y ?? 50}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
                className="flex items-center justify-center"
              >
                <motion.div
                  className="rounded-full border-2 flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderColor: isRevealed ? '#22d3ee' : 'rgba(148,163,184,0.5)',
                    background: isActive
                      ? 'rgba(34,211,238,0.25)'
                      : isRevealed
                        ? 'rgba(34,211,238,0.12)'
                        : 'rgba(14,16,20,0.7)',
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  animate={isRevealed ? { boxShadow: '0 0 12px 3px rgba(34,211,238,0.45)' } : {}}
                >
                  <span className="text-xs font-extrabold text-cyan-300">
                    {isRevealed ? '✓' : '+'}
                  </span>
                </motion.div>
                {isRevealed && (
                  <span
                    className="absolute bottom-full mb-1 whitespace-nowrap text-[10px] font-bold text-cyan-200 bg-[#0e1014]/90 px-1.5 py-0.5 rounded"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                  >
                    {h.label}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          // Auto-layout: row at bottom
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-3 flex-wrap">
            {hotspots.map((h) => {
              const isRevealed = revealed.has(h.id);
              const isActive = active?.id === h.id;
              return (
                <motion.button
                  key={h.id}
                  type="button"
                  onClick={() => tap(h)}
                  aria-pressed={isRevealed}
                  aria-label={h.label}
                  className="rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors"
                  style={{
                    borderColor: isRevealed ? '#22d3ee' : 'rgba(148,163,184,0.4)',
                    color: isRevealed ? '#22d3ee' : '#94a3b8',
                    background: isActive
                      ? 'rgba(34,211,238,0.18)'
                      : 'rgba(14,16,20,0.75)',
                  }}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                >
                  {isRevealed ? '✓ ' : ''}{h.label}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Active hotspot caption — floats in center */}
        <AnimatePresence mode="wait">
          {active?.caption && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 max-w-[320px] text-center"
            >
              <p
                className="rounded-xl bg-[#0e1014]/90 px-3 py-2 text-xs font-bold text-slate-200 leading-snug border border-cyan-400/20"
                style={{ backdropFilter: 'blur(6px)' }}
              >
                <span className="block text-cyan-300 font-extrabold mb-0.5">{active.label}</span>
                {active.caption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SpaceStage>
  );
}
