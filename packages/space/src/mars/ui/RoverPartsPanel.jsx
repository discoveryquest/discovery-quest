import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { FACT_NEAR, FACT_FAR } from '../scene/landmarks.js';
import { ROVER_PARTS, PART_EMOJI } from '../scene/roverParts.js';

function roverDistance() {
  return Math.hypot(telemetry.x - telemetry.roverX, telemetry.z - telemetry.roverZ);
}

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

// Rounded, playful font — SF Rounded on Apple, friendly fallbacks elsewhere.
const FUN = "ui-rounded, 'Baloo 2', 'Fredoka', 'Trebuchet MS', system-ui, sans-serif";

export default function RoverPartsPanel() {
  const { roverTour, roverPartIndex } = useMarsState();
  const open = roverTour !== 'closed';
  const [near, setNear] = useState(false);
  const [dist, setDist] = useState(999);
  const [landscape, setLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
  );
  const part = roverPartIndex >= 0 ? ROVER_PARTS[roverPartIndex] : null;

  const setIndex = (i) => marsStore.setRoverPartIndex((i + ROVER_PARTS.length) % ROVER_PARTS.length);
  const next = () => setIndex(roverPartIndex < 0 ? 0 : roverPartIndex + 1);
  const prev = () => setIndex(roverPartIndex < 0 ? ROVER_PARTS.length - 1 : roverPartIndex - 1);

  useEffect(() => {
    let raf;
    const tick = () => {
      const d = roverDistance();
      setDist(d);
      // Hysteresis: the rover patrols, so a plain "d < 7" made the inspect prompt
      // flicker as it drifted past you. Latch on when near, off only once clearly
      // away, so the prompt stays put and is easy to tap on mobile.
      setNear((prev) => (d < FACT_NEAR ? true : d > FACT_FAR ? false : prev));
      // No walk-away auto-close: the player is frozen for the whole exploded-view
      // tour, so distance can't grow — closing is Esc / × only. (Auto-close here
      // used to race the explode open and slam the tour shut on the first frame.)
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onResize = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const state = marsStore.getState();
      const tourLive = state.roverTour !== 'closed';

      // OPEN only with E, only when near. Arrow keys must NOT open the tour — they
      // are also Luna's movement keys, so opening on ← / → made the rover explode
      // the moment you steered past it. Everything else falls through to movement.
      if (!tourLive) {
        if (e.code !== 'KeyE') return;
        if (roverDistance() >= FACT_NEAR) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        marsStore.openRoverTour();
        return;
      }

      // Tour is open: E / → next, Shift+E / ← previous, Esc closes.
      if (e.code !== 'KeyE' && e.code !== 'Escape' && e.code !== 'ArrowRight' && e.code !== 'ArrowLeft') return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      if (e.code === 'Escape') { marsStore.closeRoverTour(); return; }
      const i = state.roverPartIndex;
      if (e.code === 'ArrowLeft' || e.shiftKey) {
        marsStore.setRoverPartIndex(((i < 0 ? 0 : i) - 1 + ROVER_PARTS.length) % ROVER_PARTS.length);
      } else {
        marsStore.setRoverPartIndex((i < 0 ? 0 : i + 1) % ROVER_PARTS.length);
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  if (!open) {
    if (!near) return null;
    // Touch: a big tappable button to open the tour (there's no E key). Desktop:
    // a passive hint.
    if (coarse) {
      return (
        <button
          type="button"
          onClick={marsStore.openRoverTour}
          style={{
            position: 'fixed', left: '50%', bottom: 185, transform: 'translateX(-50%)', zIndex: 8,
            appearance: 'none', padding: '14px 24px', color: '#3a1400', fontWeight: 900,
            fontFamily: FUN, fontSize: 17, letterSpacing: 0.2, cursor: 'pointer',
            background: 'linear-gradient(180deg, #ffd58c, #ff9e4f)', border: 'none', borderRadius: 999,
            boxShadow: '0 6px 0 #c25f22, 0 12px 24px rgba(0,0,0,0.4)', touchAction: 'manipulation', pointerEvents: 'auto',
          }}
        >
          🔍 Inspect the rover!
        </button>
      );
    }
    return (
      <div
        style={{
          position: 'fixed', left: '50%', bottom: 84, transform: 'translateX(-50%)', zIndex: 4,
          padding: '10px 16px', color: '#fff1df', background: 'rgba(28,10,4,0.76)',
          border: '1px solid rgba(255,178,96,0.48)', borderRadius: 999,
          font: '14px system-ui, sans-serif', letterSpacing: 0.2, pointerEvents: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}
      >
        Press <strong style={{ color: '#ffb35e' }}>E</strong> to inspect rover parts
      </div>
    );
  }

  const shell = !coarse
    ? { position: 'fixed', right: 18, bottom: 96, zIndex: 5, width: 360, maxWidth: 'calc(100vw - 36px)', borderRadius: 22, border: '3px solid #ff9e4f' }
    : landscape
      ? {
          // Landscape phone: a right-side panel, leaving the left of the wide
          // screen for the inspected part (which shifts left to match).
          position: 'fixed', right: 10, bottom: 10, zIndex: 5, width: 'min(44vw, 380px)',
          maxHeight: 'calc(100vh - 76px)', borderRadius: 22, border: '3px solid #ff9e4f',
        }
      : {
          // Portrait phone: a centered bottom sheet (max-width so text isn't too wide).
          position: 'fixed', left: '50%', bottom: 0, transform: 'translateX(-50%)', zIndex: 5,
          width: 'min(94vw, 540px)', maxHeight: '58vh',
          borderRadius: '24px 24px 0 0', border: '3px solid #ff9e4f', borderBottom: 'none',
        };

  const emoji = part ? (PART_EMOJI[part.id] ?? '🔧') : '👀';
  const total = ROVER_PARTS.length;
  const backBtn = {
    flex: 1, appearance: 'none', cursor: 'pointer', touchAction: 'manipulation', fontFamily: FUN,
    border: '2px solid rgba(255,196,140,0.6)', background: 'rgba(255,240,220,0.10)', color: '#ffe9d0',
    borderRadius: 15, padding: coarse ? '12px 10px' : '9px 12px', fontWeight: 800, fontSize: coarse ? 15 : 13,
    boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
  };
  const nextBtn = {
    ...backBtn, flex: 1.4, border: 'none', color: '#3a1400',
    background: 'linear-gradient(180deg, #ffd58c, #ff9e4f)', boxShadow: '0 4px 0 #c25f22',
  };

  return (
    <div
      style={{
        ...shell, color: '#fff1df', fontFamily: FUN, lineHeight: 1.4,
        background: 'linear-gradient(165deg, rgba(58,26,12,0.97), rgba(30,13,7,0.98))',
        boxShadow: '0 12px 44px rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        overflow: coarse ? 'auto' : 'hidden',
      }}
    >
      {/* Bright, playful header banner */}
      <div style={{ position: 'relative', padding: coarse ? '12px 16px' : '11px 14px', background: 'linear-gradient(90deg, #ff9e4f, #ffbf7d)', color: '#3a1400' }}>
        <button
          type="button"
          onClick={marsStore.closeRoverTour}
          aria-label="Close rover explorer"
          style={{
            position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', appearance: 'none',
            width: coarse ? 34 : 26, height: coarse ? 34 : 26, borderRadius: '50%', border: 'none',
            background: 'rgba(58,20,0,0.22)', color: '#3a1400', fontSize: coarse ? 20 : 16, fontWeight: 900,
            cursor: 'pointer', lineHeight: 1, touchAction: 'manipulation',
          }}
        >✕</button>
        <div style={{ fontWeight: 900, fontSize: coarse ? 18 : 16, letterSpacing: 0.3, paddingRight: 38 }}>🔎 Rover Explorer</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.72, marginTop: 1 }}>
          {coarse ? 'Drag to spin · pinch to zoom' : `Click a part · → next · Esc close · ${dist.toFixed(0)}m`}
        </div>
      </div>

      <div style={{ padding: coarse ? '14px 16px 16px' : '13px 14px 14px' }}>
        {/* Hero: emoji badge + title + progress pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
          <div
            style={{
              flex: '0 0 auto', width: coarse ? 58 : 50, height: coarse ? 58 : 50, borderRadius: '50%',
              display: 'grid', placeItems: 'center', fontSize: coarse ? 30 : 26,
              background: 'radial-gradient(circle at 50% 38%, rgba(63,240,255,0.38), rgba(63,240,255,0.08))',
              border: '2px solid rgba(63,240,255,0.65)', boxShadow: '0 0 16px rgba(63,240,255,0.35)',
            }}
          >{emoji}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: coarse ? 19 : 17, color: '#fff4e6', lineHeight: 1.15 }}>
              {part ? part.title : 'Tap a floating part!'}
            </div>
            {part && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: '#ffce6a', color: '#3a1400', borderRadius: 999, padding: '3px 11px', fontWeight: 800, fontSize: 12 }}>
                ⭐ Part {roverPartIndex + 1} of {total}
              </div>
            )}
          </div>
        </div>

        {/* Text — kid copy + a "Cool fact" callout. Scroll-capped on mobile. */}
        <div style={coarse ? { maxHeight: '20vh', overflowY: 'auto' } : undefined}>
          <div style={{ fontSize: coarse ? 15.5 : 14, lineHeight: 1.5 }}>
            {part ? part.summary : 'The rover popped apart into its pieces! Tap any floating piece to find out what it does.'}
          </div>
          {part && (
            <div style={{ marginTop: 11, padding: '9px 12px', borderRadius: 13, background: 'rgba(63,240,255,0.10)', border: '1px solid rgba(63,240,255,0.35)', fontSize: coarse ? 14.5 : 13.5 }}>
              <span style={{ color: '#8ff3ff', fontWeight: 800 }}>✨ Cool fact! </span>
              <span style={{ opacity: 0.95 }}>{part.detail}</span>
            </div>
          )}
        </div>

        {/* Chunky game buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" style={backBtn} onClick={prev}>⬅ Back</button>
          <button type="button" style={nextBtn} onClick={next}>Next ➡</button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: coarse ? 9 : 6, flexWrap: 'wrap', marginTop: 13 }}>
          {ROVER_PARTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={p.title}
              title={p.title}
              style={{
                width: i === roverPartIndex ? (coarse ? 22 : 15) : (coarse ? 12 : 8), height: coarse ? 12 : 8,
                borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer', touchAction: 'manipulation',
                transition: 'width 140ms ease',
                background: i === roverPartIndex ? '#3ff0ff' : 'rgba(255,230,200,0.30)',
                boxShadow: i === roverPartIndex ? '0 0 10px rgba(63,240,255,0.85)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
