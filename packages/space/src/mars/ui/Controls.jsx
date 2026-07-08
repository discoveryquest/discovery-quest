import { useRef, useState } from 'react';
import { input } from '../input/inputStore.js';
import { useMarsState } from '../store/marsStore.js';

// Touch controls for phones (spec R5). They write into the SAME `input` object the
// keyboard/mouse path uses, so the Player/InteractionController need no changes:
//   • left virtual joystick → input.forward / input.right (analog direction)
//   • right-half drag       → input.yaw / input.pitch (look), like mouse-look
//   • JUMP button (hold)    → input.jump
//   • GRAB button (tap)     → input.actionTap (pick up, or throw if holding)
// Rendered only on coarse-pointer devices so desktop never sees a joystick. Each
// control tracks its own touch by identifier, so joystick + look + button work at
// once. Buttons/look sit above the top-right 📸/🔊 (which are bumped to zIndex 5).
const coarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

const R = 54; // joystick travel radius (px)

function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const origin = useRef(null);
  const id = useRef(null);

  const start = (e) => {
    const t = e.changedTouches[0];
    id.current = t.identifier;
    origin.current = { x: t.clientX, y: t.clientY };
  };
  const move = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id.current) continue;
      let dx = t.clientX - origin.current.x;
      let dy = t.clientY - origin.current.y;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, R);
      dx = (dx / len) * clamped;
      dy = (dy / len) * clamped;
      setKnob({ x: dx, y: dy });
      input.right = dx / R;
      input.forward = -dy / R; // up = forward
    }
    e.preventDefault();
  };
  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id.current) continue;
      id.current = null;
      setKnob({ x: 0, y: 0 });
      input.forward = 0;
      input.right = 0;
    }
  };

  return (
    <div
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={end}
      style={{
        position: 'fixed', left: 22, bottom: 26, width: 132, height: 132, borderRadius: '50%',
        border: '2px solid rgba(255,180,120,0.4)', background: 'rgba(20,8,4,0.32)',
        display: 'grid', placeItems: 'center', touchAction: 'none', pointerEvents: 'auto',
        zIndex: 6, backdropFilter: 'blur(1px)',
      }}
    >
      <div
        style={{
          width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,158,90,0.55)',
          border: '1px solid rgba(255,220,190,0.6)', transform: `translate(${knob.x}px, ${knob.y}px)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function LookPad() {
  const id = useRef(null);
  const last = useRef(null);
  const LOOK = 0.004;
  const start = (e) => {
    const t = e.changedTouches[0];
    id.current = t.identifier;
    last.current = { x: t.clientX, y: t.clientY };
  };
  const move = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id.current) continue;
      input.yaw -= (t.clientX - last.current.x) * LOOK;
      input.pitch = Math.max(-1.2, Math.min(1.2, input.pitch - (t.clientY - last.current.y) * LOOK));
      last.current = { x: t.clientX, y: t.clientY };
    }
    e.preventDefault();
  };
  const end = (e) => {
    for (const t of e.changedTouches) if (t.identifier === id.current) id.current = null;
  };
  return (
    <div
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={end}
      style={{
        position: 'fixed', right: 0, top: 64, width: '55%', bottom: 0,
        touchAction: 'none', pointerEvents: 'auto', zIndex: 4,
      }}
    />
  );
}

const btn = {
  position: 'fixed', appearance: 'none', borderRadius: '50%', width: 78, height: 78,
  border: '2px solid rgba(255,180,120,0.45)', background: 'rgba(255,145,72,0.18)',
  color: '#ffe9d0', font: '700 15px system-ui, sans-serif', touchAction: 'none',
  pointerEvents: 'auto', zIndex: 7, backdropFilter: 'blur(1px)',
};

export default function Controls() {
  const [show] = useState(coarsePointer);
  const { roverTour } = useMarsState();
  // Hide the move/look/jump/grab controls during the rover tour: movement is
  // frozen and the whole screen is dedicated to spinning/pinching the part.
  if (!show || roverTour !== 'closed') return null;
  return (
    <>
      <LookPad />
      <Joystick />
      <button
        type="button"
        onTouchStart={(e) => { e.preventDefault(); input.actionTap += 1; }}
        style={{ ...btn, right: 118, bottom: 40 }}
      >
        GRAB
      </button>
      <button
        type="button"
        onTouchStart={(e) => { e.preventDefault(); input.jump = true; }}
        onTouchEnd={() => { input.jump = false; }}
        onTouchCancel={() => { input.jump = false; }}
        style={{ ...btn, right: 30, bottom: 30, width: 88, height: 88 }}
      >
        JUMP
      </button>
    </>
  );
}
