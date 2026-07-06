import { useEffect, useState } from 'react';
import { windState } from '../fx/windState.js';
import { startAmbient, setWindGain, setEnabled, isEnabled, dispose } from './marsAudio.js';

// DOM glue for the Mars audio graph (rendered outside the Canvas, in MarsRoute).
// Autoplay is blocked until a user gesture, so we arm the ambient bed on the first
// pointer/key. Each frame we push the live gust value into the wind gain so the
// bed swells with the pennant. A small speaker button mutes/unmutes. Tears the
// AudioContext down on unmount.
export default function MarsAudio() {
  const [on, setOn] = useState(isEnabled());

  useEffect(() => {
    const arm = () => { startAmbient(); };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);

    let raf;
    const tick = () => { setWindGain(windState.gust); raf = requestAnimationFrame(tick); };
    tick();

    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      cancelAnimationFrame(raf);
      dispose();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => { const next = !on; setEnabled(next); setOn(next); startAmbient(); }}
      aria-label={on ? 'Mute sound' : 'Unmute sound'}
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 5,
        appearance: 'none', width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
        border: '1px solid rgba(255,180,120,0.35)', background: 'rgba(20,8,4,0.5)',
        color: '#ffe9d0', font: '18px system-ui', backdropFilter: 'blur(2px)',
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  );
}
