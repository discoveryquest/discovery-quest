// Connect-the-stars, full-screen 3D: real glowing stars floating at slightly
// different depths against the Milky Way; tap them in order and luminous
// lines draw the constellation. Wrong final order → lines dissolve + hint.
// Same YAML contract: target.stars [{id,x,y} in 0-100 screen-ish coords],
// target.order. Tap targets are DOM buttons ([data-star]) centered on each
// star — big, phone-friendly, E2E-stable.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import Stage3D from './Stage3D.jsx';

const W = 13; // world width the 0-100 x range maps onto
const H = 8.2;

const hash01 = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((h >>> 0) % 1000) / 1000;
};

function StarPoint({ pos, picked, index, won, onTap, id }) {
  const core = useRef();
  const glow = useRef();
  const phase = useMemo(() => hash01(id) * Math.PI * 2, [id]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tw = 1 + Math.sin(t * 2.2 + phase) * (picked ? 0.06 : 0.16);
    core.current?.scale.setScalar(tw);
    glow.current?.scale.setScalar(tw * (picked ? 2.4 : 1.9));
  });
  const color = won ? '#6ee7b7' : picked ? '#67e8f9' : '#f8fafc';
  return (
    <group position={pos}>
      <mesh ref={core}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <Html center zIndexRange={[10, 0]}>
        <button type="button" data-star={id} onClick={onTap} aria-label={`Star ${id}`}
          className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-transparent">
          {picked && (
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-slate-900 ${won ? 'bg-emerald-300' : 'bg-cyan-300'}`}>
              {index + 1}
            </span>
          )}
        </button>
      </Html>
    </group>
  );
}

export default function ConnectStars3D({ step, onCorrect, onHint }) {
  const stars = step?.target?.stars ?? [];
  const order = step?.target?.order ?? stars.map((s) => s.id);
  const [picked, setPicked] = useState([]);
  const doneRef = useRef(false);
  const [won, setWon] = useState(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const posOf = useMemo(() => {
    const m = {};
    for (const s of stars) m[s.id] = [((s.x - 50) / 100) * W, ((50 - s.y) / 100) * H, (hash01(s.id) - 0.5) * 1.6];
    return m;
  }, [stars]);

  const complete = picked.length === order.length && order.length > 0;
  useEffect(() => {
    if (!complete || doneRef.current) return;
    const correct = picked.every((id, i) => id === order[i]);
    if (correct) {
      doneRef.current = true;
      setWon(true);
      const t = setTimeout(() => onCorrectRef.current?.(), 900);
      return () => clearTimeout(t);
    }
    onHintRef.current?.(step?.feedback?.hintSay);
    const t = setTimeout(() => setPicked([]), 900);
    return () => clearTimeout(t);
  }, [complete, picked, order]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (id) => {
    if (doneRef.current || picked.includes(id) || complete) return;
    setPicked((p) => [...p, id]);
  };

  const linePoints = picked.map((id) => posOf[id]).filter(Boolean);

  return (
    <Stage3D camera={{ position: [0, 0.4, 10.5], fov: 50 }} ambient={0.4} portraitScale={0.72}>
      {linePoints.length >= 2 && (
        <Line points={linePoints} color={won ? '#6ee7b7' : '#67e8f9'} lineWidth={3} transparent opacity={0.9} />
      )}
      {stars.map((s) => (
        <StarPoint key={s.id} id={s.id} pos={posOf[s.id]}
          picked={picked.includes(s.id)} index={picked.indexOf(s.id)} won={won}
          onTap={() => tap(s.id)} />
      ))}
      <Html center position={[0, -H / 2 - 0.9, 0]} zIndexRange={[10, 0]}>
        <p data-stars-state={won ? 'won' : 'playing'} className="pointer-events-none whitespace-nowrap rounded-full border border-white/10 bg-slate-950/70 px-4 py-1.5 text-sm font-bold text-slate-300 backdrop-blur-sm">
          {won ? '🎉 A constellation is born!' : 'Tap the stars in order to draw the pattern.'}
        </p>
      </Html>
    </Stage3D>
  );
}
