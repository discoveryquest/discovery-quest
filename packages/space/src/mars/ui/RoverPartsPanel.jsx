import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';
import { FACT_NEAR } from '../scene/landmarks.js';
import { ROVER_PARTS } from '../scene/roverParts.js';

function roverDistance() {
  return Math.hypot(telemetry.x - telemetry.roverX, telemetry.z - telemetry.roverZ);
}

const button = {
  appearance: 'none', border: '1px solid rgba(255,178,96,0.38)', borderRadius: 999,
  background: 'rgba(255,145,72,0.12)', color: '#ffe9d0', padding: '6px 10px',
  font: '12px system-ui, sans-serif', cursor: 'pointer',
};

export default function RoverPartsPanel() {
  const { roverTour, roverPartIndex } = useMarsState();
  const open = roverTour !== 'closed';
  const [near, setNear] = useState(false);
  const [dist, setDist] = useState(999);
  const part = roverPartIndex >= 0 ? ROVER_PARTS[roverPartIndex] : null;

  const setIndex = (i) => marsStore.setRoverPartIndex((i + ROVER_PARTS.length) % ROVER_PARTS.length);
  const next = () => setIndex(roverPartIndex < 0 ? 0 : roverPartIndex + 1);
  const prev = () => setIndex(roverPartIndex < 0 ? ROVER_PARTS.length - 1 : roverPartIndex - 1);

  useEffect(() => {
    let raf;
    const tick = () => {
      const d = roverDistance();
      setDist(d);
      setNear(d < FACT_NEAR);
      // No walk-away auto-close: the player is frozen for the whole exploded-view
      // tour, so distance can't grow — closing is Esc / × only. (Auto-close here
      // used to race the explode open and slam the tour shut on the first frame.)
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'KeyE' && e.code !== 'Escape' && e.code !== 'ArrowRight' && e.code !== 'ArrowLeft') return;
      const state = marsStore.getState();
      const isNear = roverDistance() < FACT_NEAR;
      const tourLive = state.roverTour !== 'closed';
      if (!tourLive && !isNear) return;

      // Capture rover-tour keys before the rock interaction listener sees E.
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      if (e.code === 'Escape') { marsStore.closeRoverTour(); return; }
      if (!tourLive) { marsStore.openRoverTour(); return; }
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

  return (
    <div
      style={{
        position: 'fixed', right: 18, bottom: 96, zIndex: 5, width: 360, maxWidth: 'calc(100vw - 36px)',
        color: '#fff1df', background: 'linear-gradient(160deg, rgba(40,16,8,0.94), rgba(22,8,4,0.94))',
        border: '1px solid rgba(255,178,96,0.55)', borderRadius: 18, boxShadow: '0 16px 50px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)', font: '14px system-ui, sans-serif', lineHeight: 1.45, overflow: 'hidden',
      }}
    >
      <div style={{ padding: '13px 15px 10px', borderBottom: '1px solid rgba(255,178,96,0.22)' }}>
        <button
          type="button"
          onClick={marsStore.closeRoverTour}
          aria-label="Close rover parts tour"
          style={{ position: 'absolute', top: 10, right: 12, appearance: 'none', border: 'none', background: 'transparent', color: '#ffb877', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
        >×</button>
        <div style={{ color: '#ff9e5a', fontWeight: 800, letterSpacing: 0.4, paddingRight: 28 }}>🔎 Perseverance parts tour</div>
        <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2 }}>Click a floating part · → / E next · Esc close · {dist.toFixed(0)}m away</div>
      </div>
      <div style={{ padding: '14px 15px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ color: '#ffcc8a', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{part ? part.title : 'Tap a floating part'}</div>
          {part && <div style={{ marginLeft: 'auto', color: '#2a1007', background: '#ffb35e', borderRadius: 999, padding: '3px 8px', fontWeight: 800, fontSize: 11 }}>{roverPartIndex + 1}/{ROVER_PARTS.length}</div>}
        </div>
        <div>{part ? part.summary : 'The rover has come apart into its subsystems. Click any floating piece — or use the arrows — to learn what it does.'}</div>
        {part && <div style={{ marginTop: 9, opacity: 0.86 }}>{part.detail}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
          <button type="button" style={button} onClick={prev}>← Previous</button>
          <button type="button" style={{ ...button, background: 'rgba(255,179,94,0.22)' }} onClick={next}>Next part →</button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
          {ROVER_PARTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              title={p.title}
              style={{
                width: 9, height: 9, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
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
