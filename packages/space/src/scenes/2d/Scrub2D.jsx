// Scrub2D — INTERACTIVE scrubber through ordered scene states.
// A range input drives a current index; when the index changes, speak() is called.
// If `base` descriptor is provided, renders a Scene beneath the state label.
import { useState, useCallback, useRef } from 'react';
import { speak } from '@discoveryquest/voice-kit/audio';
import { clampIndex } from '../scrub.js';
import { SpaceStage } from './base.jsx';
// SceneContent renders the base BARE (no nested SpaceStage) so the outer stage is the only
// backdrop. Static import is safe: it's referenced at render time, not module-eval time.
import SceneContent from '../SceneContent.jsx';

// Inject the scrub's phase fraction (0..1) into a base descriptor:
//  - body base → set body.phase (moon-phase shadow)
//  - spin base → set fraction (turns the globe: dawn → noon → dusk → night)
//  - orbit base → set phaseLit on bodies flagged phaseLit, AND drive every orbiter's
//    position from the scrub (scrubFraction stops the free-running orbit animation —
//    the learner's drag, not a timer, moves the body around its orbit)
function withPhase(base, fraction) {
  if (!base) return base;
  if (base.kind === 'body') {
    return { ...base, body: { ...(base.body ?? {}), phase: fraction } };
  }
  if (base.kind === 'spin') {
    return { ...base, fraction };
  }
  if (base.kind === 'orbit') {
    return {
      ...base,
      bodies: (base.bodies ?? []).map((b) => {
        let next = b.phaseLit != null ? { ...b, phaseLit: fraction } : b;
        if (b.orbits) next = { ...next, scrubFraction: fraction };
        return next;
      }),
    };
  }
  return base;
}

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

  // Reflect the scrub position into the base scene (phase fraction across the states)
  const enrichedBase =
    base && states.length > 1 ? withPhase(base, index / (states.length - 1)) : base;

  return (
    <SpaceStage>
      <div className="relative h-full w-full">
        {/* Base scene fills the stage above the control scrim (bare — shares the outer
            stage). Reserving the bottom strip keeps the scene clear of the labels —
            previously the fixed-pixel scene bled underneath the caption text. */}
        {enrichedBase ? (
          <div className="absolute inset-x-0 top-0 bottom-16">
            <SceneContent descriptor={enrichedBase} />
          </div>
        ) : (
          <div className="absolute inset-x-0 top-0 bottom-16 flex items-center justify-center">
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

        {/* Controls — a bottom scrim overlay: state label + caption + scrubber */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-1.5 pt-6">
          {/* One caption line ("Dawn — ...") — captions open with the state name, so no
              separate label row; the highlighted tick under the slider marks the state too. */}
          {current?.caption ? (
            <p className="mx-auto max-w-[360px] text-center text-xs font-bold leading-snug text-slate-200 line-clamp-2">
              {current.caption}
            </p>
          ) : enrichedBase && current?.label ? (
            <p className="text-center text-sm font-extrabold text-cyan-300">{current.label}</p>
          ) : null}

          {/* Range scrubber — custom track + thumb so it's clearly draggable on iOS Safari */}
          {states.length > 1 && (
          <div className="w-full mt-1.5">
            <style>{`
              .scrub-range { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; background: transparent; cursor: pointer; }
              .scrub-range:focus { outline: none; }
              .scrub-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: linear-gradient(90deg, rgba(34,211,238,0.55), rgba(34,211,238,0.18)); border: 1px solid rgba(34,211,238,0.4); }
              .scrub-range::-moz-range-track { height: 8px; border-radius: 9999px; background: rgba(34,211,238,0.25); border: 1px solid rgba(34,211,238,0.4); }
              .scrub-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -8px; width: 24px; height: 24px; border-radius: 9999px; background: #22d3ee; border: 3px solid #0e1014; box-shadow: 0 0 10px 2px rgba(34,211,238,0.7); }
              .scrub-range::-moz-range-thumb { width: 24px; height: 24px; border-radius: 9999px; background: #22d3ee; border: 3px solid #0e1014; box-shadow: 0 0 10px 2px rgba(34,211,238,0.7); }
              .scrub-range:focus-visible::-webkit-slider-thumb { outline: 2px solid #a5f3fc; outline-offset: 2px; }
            `}</style>
            <input
              type="range"
              min={0}
              max={states.length - 1}
              step={1}
              value={index}
              onChange={handleChange}
              className="scrub-range"
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
      </div>
    </SpaceStage>
  );
}
