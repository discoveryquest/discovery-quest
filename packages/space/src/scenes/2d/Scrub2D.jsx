// Scrub2D — INTERACTIVE scrubber through ordered scene states.
// A range input drives a current index; when the index changes, speak() is called.
// If `base` descriptor is provided, renders a Scene beneath the state label.
import { useState, useCallback, useRef } from 'react';
import { speak } from '@discoveryquest/voice-kit/audio';
import { clampIndex } from '../scrub.js';
import { SpaceStage } from './base.jsx';
// Static import is SAFE despite the Scene → renderers.jsx → Scrub2D cycle: Scene is only
// referenced at RENDER time (not module-eval time), so ES live bindings are resolved by then.
import Scene from '../Scene.jsx';

export default function Scrub2D({ base, states = [] }) {
  const [index, setIndex] = useState(0);
  const prevIndex = useRef(-1);

  // Speak when index changes (not on mount — LessonScreen handles initial narration)
  const handleChange = useCallback(
    (e) => {
      const next = clampIndex(Number(e.target.value), states.length);
      if (next !== prevIndex.current) {
        prevIndex.current = next;
        setIndex(next);
        const state = states[next];
        if (state?.say) speak(state.say, { important: true });
      }
    },
    [states],
  );

  const current = states[index];

  // When base is an orbit/body scene, inject phase derived from state index fraction
  const enrichedBase =
    base && states.length > 1
      ? (() => {
          const fraction = index / (states.length - 1);
          if (base.kind === 'body') {
            return { ...base, body: { ...(base.body ?? {}), phase: fraction } };
          }
          return base;
        })()
      : base;

  return (
    <SpaceStage>
      <div className="flex h-full w-full flex-col items-center justify-between py-3 px-4">
        {/* Base scene underneath */}
        {enrichedBase ? (
          <div className="w-full flex-1 min-h-0">
            <Scene descriptor={enrichedBase} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            {current?.label && (
              <p
                className="text-2xl font-extrabold text-white text-center"
                style={{ textShadow: '0 0 20px rgba(103,232,249,0.7)' }}
              >
                {current.label}
              </p>
            )}
          </div>
        )}

        {/* State label (shown above scrubber when base is rendered) */}
        {enrichedBase && current?.label && (
          <p className="text-sm font-bold text-cyan-300 text-center">{current.label}</p>
        )}

        {/* Caption */}
        {current?.caption && (
          <p className="text-xs font-bold text-slate-400 text-center leading-snug max-w-[340px]">
            {current.caption}
          </p>
        )}

        {/* Range scrubber */}
        {states.length > 1 && (
          <div className="w-full mt-2">
            <input
              type="range"
              min={0}
              max={states.length - 1}
              step={1}
              value={index}
              onChange={handleChange}
              className="w-full accent-cyan-400"
              aria-label="Scrub through states"
            />
            {/* State labels below track */}
            <div className="flex justify-between mt-0.5 px-0.5">
              {states.map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] font-bold text-slate-500"
                  style={{ color: i === index ? '#67e8f9' : undefined }}
                >
                  {s.label ?? ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SpaceStage>
  );
}
