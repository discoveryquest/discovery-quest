import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { marsStore, useMarsState } from '../store/marsStore.js';

// DOM overlay (outside the Canvas): live position/speed/altitude readout so
// movement is visible even over featureless terrain, plus a controls hint. Polls
// the telemetry object on rAF rather than re-rendering the scene.
export default function Hud() {
  const { view, gravityMode, interaction } = useMarsState();
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
    lineHeight: 1.55, letterSpacing: 0.3, pointerEvents: 'auto',
    border: '1px solid rgba(255,180,120,0.25)', backdropFilter: 'blur(2px)',
  };
  const button = {
    appearance: 'none',
    border: '1px solid rgba(255,180,120,0.35)',
    borderRadius: 999,
    background: 'rgba(255,145,72,0.12)',
    color: '#ffe9d0',
    font: '12px system-ui, sans-serif',
    padding: '5px 9px',
    cursor: 'pointer',
  };
  return (
    <>
      <div style={box}>
        <div style={{ color: '#ff9e5a', fontWeight: 700 }}>◉ MARS · {gravityMode.toUpperCase()} GRAVITY</div>
        <div>X {t.x.toFixed(1)}m&nbsp;&nbsp;Z {t.z.toFixed(1)}m&nbsp;&nbsp;ALT {t.y.toFixed(1)}m</div>
        <div>SPEED {t.speed.toFixed(1)} m/s&nbsp;&nbsp;{t.grounded ? 'GROUNDED' : '✦ AIRBORNE'}</div>
        <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" style={button} onClick={marsStore.toggleView}>
            {view === 'first' ? '3rd person' : '1st person'}
          </button>
          <button type="button" style={button} onClick={marsStore.toggleGravity}>
            {gravityMode === 'mars' ? 'Try Earth gravity' : 'Back to Mars gravity'}
          </button>
          <button type="button" style={button} onClick={marsStore.resetRocks}>Reset rocks</button>
        </div>
        <div style={{ opacity: 0.65, marginTop: 5 }}>
          WASD move · SPACE jump · E/click rocks · V view
        </div>
      </div>
      {interaction.prompt && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 36,
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            color: '#fff1df',
            background: 'rgba(28,10,4,0.72)',
            border: '1px solid rgba(255,178,96,0.45)',
            borderRadius: 999,
            font: '14px system-ui, sans-serif',
            letterSpacing: 0.2,
            pointerEvents: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          {interaction.prompt}
        </div>
      )}
    </>
  );
}
