import { useEffect, useState } from 'react';
import { telemetry } from '../telemetry.js';
import { useMarsState } from '../store/marsStore.js';

const SIZE = 136;
const CENTER = SIZE / 2;
const RANGE_M = 28;
const DOT_R = 7;

function clampToCircle(x, y, r) {
  const len = Math.hypot(x, y);
  if (len <= r) return { x, y, edge: false, angle: Math.atan2(y, x) };
  const k = r / (len || 1);
  return { x: x * k, y: y * k, edge: true, angle: Math.atan2(y, x) };
}

export default function MiniMap() {
  const { zoomMode } = useMarsState();
  const [snap, setSnap] = useState(() => ({ ...telemetry }));

  useEffect(() => {
    let raf;
    const tick = () => {
      setSnap({ ...telemetry });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  // The minimap is for navigating to landmarks — hidden in any zoom-in focus mode.
  if (zoomMode) return null;

  const dx = snap.roverX - snap.x;
  const dz = snap.roverZ - snap.z;
  const dist = Math.hypot(dx, dz);
  const scale = (CENTER - 18) / RANGE_M;
  const rel = clampToCircle(dx * scale, dz * scale, CENTER - 18);
  const roverLeft = CENTER + rel.x;
  const roverTop = CENTER + rel.y;
  const roverArrow = rel.edge ? `rotate(${rel.angle}rad)` : `rotate(${snap.roverHeading}rad)`;

  return (
    <div
      aria-label="Mars minimap showing rover direction"
      style={{
        position: 'fixed', left: 14, bottom: 14, zIndex: 3,
        width: SIZE, color: '#ffe9d0', font: '11px ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'none', userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative', width: SIZE, height: SIZE, borderRadius: 18,
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, rgba(255,149,77,0.18), rgba(42,16,7,0.72))',
          border: '1px solid rgba(255,178,96,0.38)', boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(3px)',
        }}
      >
        <div style={{ position: 'absolute', inset: 12, border: '1px dashed rgba(255,230,200,0.20)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: CENTER - 1, top: 12, width: 2, height: SIZE - 24, background: 'rgba(255,230,200,0.10)' }} />
        <div style={{ position: 'absolute', left: 12, top: CENTER - 1, width: SIZE - 24, height: 2, background: 'rgba(255,230,200,0.10)' }} />
        <div style={{ position: 'absolute', left: CENTER - 13, top: CENTER - 13, width: 26, height: 26, borderRadius: '50%', background: 'rgba(22,8,4,0.78)', border: '1px solid rgba(255,255,255,0.22)' }} />
        <div style={{ position: 'absolute', left: CENTER - 4, top: CENTER - 7, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '11px solid #bfe0ff', filter: 'drop-shadow(0 0 5px rgba(191,224,255,0.75))' }} />
        <div
          style={{
            position: 'absolute', left: roverLeft - DOT_R, top: roverTop - DOT_R, width: DOT_R * 2, height: DOT_R * 2,
            borderRadius: '50%', background: '#ffb35e', border: '2px solid rgba(40,12,3,0.9)',
            boxShadow: '0 0 12px rgba(255,179,94,0.75)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: roverLeft - 3, top: roverTop - 14, width: 0, height: 0,
            borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '9px solid #fff1df',
            transform: roverArrow, transformOrigin: '50% 14px', opacity: 0.9,
          }}
        />
        <div style={{ position: 'absolute', top: 8, left: 10, color: '#ffb35e', fontWeight: 800, letterSpacing: 0.8 }}>MAP</div>
        <div style={{ position: 'absolute', top: 8, right: 10, opacity: 0.75 }}>N</div>
      </div>
      <div
        style={{
          marginTop: 5, padding: '5px 8px', borderRadius: 999, textAlign: 'center',
          background: 'rgba(28,10,4,0.66)', border: '1px solid rgba(255,178,96,0.28)',
        }}
      >
        ROVER {dist.toFixed(0)}m {rel.edge ? '↗' : ''}
      </div>
    </div>
  );
}
