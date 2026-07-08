import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { FACT_NEAR, FACT_FAR } from '../scene/landmarks.js';
import { ROVER_PARTS } from '../scene/roverParts.js';

function roverDistance() {
  return Math.hypot(telemetry.x - telemetry.roverX, telemetry.z - telemetry.roverZ);
}

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

const button = {
  appearance: 'none', border: '1px solid rgba(255,178,96,0.38)', borderRadius: 999,
  background: 'rgba(255,145,72,0.12)', color: '#ffe9d0',
  padding: coarse ? '11px 16px' : '6px 10px', font: `${coarse ? 14 : 12}px system-ui, sans-serif`,
  cursor: 'pointer', touchAction: 'manipulation',
};

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
            appearance: 'none', padding: '13px 22px', color: '#2a1007', fontWeight: 800,
            font: '700 16px system-ui, sans-serif', letterSpacing: 0.2, cursor: 'pointer',
            background: 'linear-gradient(180deg, #ffc27a, #ff9e4f)', border: 'none', borderRadius: 999,
            boxShadow: '0 10px 26px rgba(0,0,0,0.4)', touchAction: 'manipulation', pointerEvents: 'auto',
          }}
        >
          🔍 Inspect the rover
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
    ? { position: 'fixed', right: 18, bottom: 96, zIndex: 5, width: 360, maxWidth: 'calc(100vw - 36px)', borderRadius: 18, border: '1px solid rgba(255,178,96,0.55)' }
    : landscape
      ? {
          // Landscape phone: a right-side panel, leaving the left of the wide
          // screen for the inspected part (which shifts left to match).
          position: 'fixed', right: 10, bottom: 10, zIndex: 5, width: 'min(44vw, 380px)',
          maxHeight: 'calc(100vh - 76px)', borderRadius: 18, border: '1px solid rgba(255,178,96,0.55)',
        }
      : {
          // Portrait phone: a centered bottom sheet (max-width so text isn't too wide).
          position: 'fixed', left: '50%', bottom: 0, transform: 'translateX(-50%)', zIndex: 5,
          width: 'min(94vw, 540px)', maxHeight: '58vh',
          borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,178,96,0.55)', borderBottom: 'none',
        };
  return (
    <div
      style={{
        ...shell,
        color: '#fff1df', background: 'linear-gradient(160deg, rgba(40,16,8,0.95), rgba(22,8,4,0.96))',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        font: '14px system-ui, sans-serif', lineHeight: 1.45, overflow: coarse ? 'auto' : 'hidden',
      }}
    >
      <div style={{ padding: '13px 15px 10px', borderBottom: '1px solid rgba(255,178,96,0.22)' }}>
        <button
          type="button"
          onClick={marsStore.closeRoverTour}
          aria-label="Close rover parts tour"
          style={{ position: 'absolute', top: 6, right: 8, appearance: 'none', border: 'none', background: 'transparent', color: '#ffb877', fontSize: coarse ? 30 : 20, cursor: 'pointer', lineHeight: 1, padding: coarse ? 8 : 0, touchAction: 'manipulation' }}
        >×</button>
        <div style={{ color: '#ff9e5a', fontWeight: 800, letterSpacing: 0.4, paddingRight: 34 }}>🔎 Perseverance parts tour</div>
        <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2 }}>
          {coarse ? 'Tap a part · drag to spin · pinch to zoom · ✕ to close' : `Click a floating part · → / E next · Esc close · ${dist.toFixed(0)}m away`}
        </div>
      </div>
      <div style={{ padding: '14px 15px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ color: '#ffcc8a', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{part ? part.title : 'Tap a floating part'}</div>
          {part && <div style={{ marginLeft: 'auto', color: '#2a1007', background: '#ffb35e', borderRadius: 999, padding: '3px 8px', fontWeight: 800, fontSize: 11 }}>{roverPartIndex + 1}/{ROVER_PARTS.length}</div>}
        </div>
        {/* On short landscape phones, cap the text so Previous/Next stay in view. */}
        <div style={coarse ? { maxHeight: '20vh', overflowY: 'auto' } : undefined}>
          <div>{part ? part.summary : 'The rover has come apart into its subsystems. Tap any floating piece — or use the arrows — to learn what it does.'}</div>
          {part && <div style={{ marginTop: 9, opacity: 0.86 }}>{part.detail}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
          <button type="button" style={button} onClick={prev}>← Previous</button>
          <button type="button" style={{ ...button, background: 'rgba(255,179,94,0.22)' }} onClick={next}>Next part →</button>
        </div>
        <div style={{ display: 'flex', gap: coarse ? 10 : 5, flexWrap: 'wrap', marginTop: 12 }}>
          {ROVER_PARTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={p.title}
              title={p.title}
              style={{
                width: coarse ? 15 : 9, height: coarse ? 15 : 9, borderRadius: '50%', border: 'none',
                padding: 0, cursor: 'pointer', touchAction: 'manipulation',
                background: i === roverPartIndex ? '#ffb35e' : 'rgba(255,230,200,0.28)',
                boxShadow: i === roverPartIndex ? '0 0 8px rgba(255,179,94,0.8)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
