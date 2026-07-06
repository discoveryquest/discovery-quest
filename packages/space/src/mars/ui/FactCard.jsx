import { useEffect, useRef, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { ROVER_POS, FACT_NEAR, FACT_FAR } from '../scene/landmarks.js';

// Luna-brand "did you know" popup that appears when the player walks up to the
// Perseverance rover — the educational payoff of finding a real object on Mars.
// Polls the player's distance to the rover on rAF (no scene re-render). Shows
// within FACT_NEAR; dismissible; re-arms once the player wanders past FACT_FAR so
// it can greet them again on a return trip.
export default function FactCard() {
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    let raf;
    const tick = () => {
      const dx = telemetry.x - ROVER_POS[0];
      const dz = telemetry.z - ROVER_POS[2];
      const dist = Math.hypot(dx, dz);
      if (dist > FACT_FAR) dismissed.current = false; // re-arm
      setVisible(dist < FACT_NEAR && !dismissed.current);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', right: 18, bottom: 96, maxWidth: 320, zIndex: 3,
        padding: '14px 16px 16px', color: '#fff1df',
        background: 'linear-gradient(160deg, rgba(40,16,8,0.92), rgba(24,9,4,0.92))',
        border: '1px solid rgba(255,178,96,0.5)', borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
        font: '14px system-ui, sans-serif', lineHeight: 1.5,
      }}
    >
      <button
        type="button"
        onClick={() => { dismissed.current = true; setVisible(false); }}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 8, right: 10, appearance: 'none', border: 'none',
          background: 'transparent', color: '#ffb877', fontSize: 18, cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div style={{ color: '#ff9e5a', fontWeight: 700, marginBottom: 6, letterSpacing: 0.2 }}>
        🚀 You found Perseverance!
      </div>
      <div>
        This is a real NASA rover exploring Mars <em>right now</em>. It landed in
        Jezero Crater in 2021, hunting for signs of ancient life.
      </div>
      <div style={{ marginTop: 8, opacity: 0.85 }}>
        Fun fact: sunsets on Mars are <strong style={{ color: '#bfe0ff' }}>blue</strong> —
        the fine dust scatters light the opposite way Earth's air does.
      </div>
    </div>
  );
}
