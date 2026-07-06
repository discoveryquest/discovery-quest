import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { useMarsState } from '../store/marsStore.js';

// DOM overlay (outside the Canvas): live position/speed/altitude readout so
// movement is visible even over featureless terrain, plus a controls hint. Polls
// the telemetry object on rAF rather than re-rendering the scene.
export default function Hud() {
  const { view, gravityMode } = useMarsState();
  const [t, setT] = useState({ x: 0, y: 0, z: 0, speed: 0, grounded: false });

  useEffect(() => {
    let raf;
    const tick = () => { setT({ ...telemetry }); raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const box = {
    position: 'fixed', top: 12, left: 12, padding: '9px 12px',
    font: '13px ui-monospace, SFMono-Regular, Menlo, monospace',
    color: '#ffe9d0', background: 'rgba(20,8,4,0.5)', borderRadius: 10,
    lineHeight: 1.55, letterSpacing: 0.3, pointerEvents: 'none',
    border: '1px solid rgba(255,180,120,0.25)', backdropFilter: 'blur(2px)',
  };
  return (
    <div style={box}>
      <div style={{ color: '#ff9e5a', fontWeight: 700 }}>◉ MARS · {gravityMode.toUpperCase()} GRAVITY</div>
      <div>X {t.x.toFixed(1)}m&nbsp;&nbsp;Z {t.z.toFixed(1)}m&nbsp;&nbsp;ALT {t.y.toFixed(1)}m</div>
      <div>SPEED {t.speed.toFixed(1)} m/s&nbsp;&nbsp;{t.grounded ? 'GROUNDED' : '✦ AIRBORNE'}</div>
      <div style={{ opacity: 0.65, marginTop: 5 }}>
        WASD move · SPACE jump · V → {view === 'first' ? '3rd' : '1st'} person
      </div>
    </div>
  );
}
