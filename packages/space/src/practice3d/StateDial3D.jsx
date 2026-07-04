// Slider-driven state practice on the REAL 3D bodies:
//   earth-spin   → the actual Earth turns under fixed sunlight until "your
//                  town" (the YOU pin) has the target time of day.
//   orbit-season → Earth rides its orbit around the Sun with a FIXED 23.4°
//                  axis (N pole marked) — summer is where the northern half
//                  leans sunward. Positions match the 2D lesson: spring top,
//                  summer right, autumn bottom, winter left.
// Same YAML contract as StateDialPractice: target.states [{id,label}],
// target.state. The slider is a DOM overlay ([data-dial]) — reliable on phones.
import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Sun } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';

const DEFAULT_STATES = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'noon', label: 'Noon' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
];
const ICONS = {
  dawn: '🌅', noon: '☀️', dusk: '🌇', night: '🌙',
  spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️',
};

const SPIN_SUN = [-13, 0.6, 0];

// YOU pin rides the equator; rotating this group moves the town dawn→noon→
// dusk→night relative to the fixed Sun on -X.
function SpinScene({ fraction }) {
  const angle = -Math.PI / 2 - fraction * Math.PI * 1.5;
  return (
    <>
      <Sun radius={1.1} position={SPIN_SUN} timeScale={4000} lightIntensity={1400} />
      <group rotation-y={angle}>
        <Planet body="earth" radius={2.7} timeScale={0} nightLights sunPosition={SPIN_SUN} detail={false} atmosphere />
        <group position={[2.7, 0, 0]}>
          <mesh position={[0.22, 0, 0]} rotation-z={-Math.PI / 2}>
            <coneGeometry args={[0.16, 0.45, 12]} />
            <meshBasicMaterial color="#fcd34d" />
          </mesh>
          <Html center position={[1.05, 0, 0]} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded-full border border-amber-300/50 bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-200 backdrop-blur-sm">YOU</span>
          </Html>
        </group>
      </group>
    </>
  );
}

// Earth on its orbit; axis fixed in world space (leaning toward -X), so the
// season falls out of the geometry. spring top → summer right → autumn bottom
// → winter left over fraction 0..1 (three-quarter turn, like the 2D lesson).
function SeasonScene({ fraction }) {
  const R = 6.4;
  const phi = Math.PI * 2 * (fraction * 0.75);
  const pos = [Math.sin(phi) * R, 0, -Math.cos(phi) * R];
  return (
    <>
      <Sun radius={1.5} position={[0, 0, 0]} timeScale={4000} lightIntensity={1400} />
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[R - 0.03, R + 0.03, 96]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group position={pos}>
        <Planet body="earth" radius={1.05} timeScale={9000} detail={false} />
        {/* the axis rod — same fixed 23.4° lean the Planet applies, made visible */}
        <group rotation-z={THREE.MathUtils.degToRad(23.44)}>
          <mesh>
            <cylinderGeometry args={[0.035, 0.035, 3.1, 8]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.75} />
          </mesh>
          <Html center position={[0, 1.85, 0]} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
            <span className="rounded-full border border-white/20 bg-slate-950/60 px-1.5 text-[10px] font-black text-slate-200">N</span>
          </Html>
        </group>
      </group>
    </>
  );
}

export default function StateDial3D({ step, onCorrect }) {
  const states = step?.target?.states || DEFAULT_STATES;
  const targetId = step?.target?.state || states[0]?.id;
  const kind = step?.kind;
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const current = states[index] || states[0];
  const close = current?.id === targetId;
  const fraction = states.length > 1 ? index / (states.length - 1) : 0;
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;

  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    const t = setTimeout(() => onCorrectRef.current?.(), 700);
    return () => clearTimeout(t);
  }, [close]);

  return (
    <Stage3D
      camera={kind === 'orbit-season' ? { position: [0, 8.5, 10.5], fov: 50 } : { position: [0, 1.6, 9.5], fov: 46 }}
      ambient={0.16}
      portraitScale={kind === 'orbit-season' ? 0.72 : 0.9}
      overlay={
        <div data-practice3d={kind} data-state={current?.id} data-done={done ? 1 : 0}>
          <div className="absolute inset-x-0 bottom-3 mx-auto flex w-fit max-w-[92vw] flex-col items-center gap-2 rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-3 backdrop-blur-sm">
            <p className="text-sm font-extrabold text-white">
              {ICONS[current?.id] ?? '🌍'} {current?.label}
              <span className="ml-3 text-xs font-bold text-slate-400">Target: {states.find((s) => s.id === targetId)?.label ?? targetId}</span>
            </p>
            <input
              type="range" data-dial min={0} max={states.length - 1} step={1} value={index} disabled={done}
              onChange={(e) => setIndex(+e.target.value)}
              className="pointer-events-auto h-2 w-64 cursor-pointer accent-cyan-400"
              style={{ touchAction: 'none' }}
              aria-label={kind === 'orbit-season' ? 'Move Earth around its orbit' : 'Spin the Earth'}
            />
            <div className="flex w-64 justify-between text-[10px] font-bold text-slate-500">
              {states.map((s) => <span key={s.id} className={s.id === current?.id ? 'text-cyan-300' : ''}>{ICONS[s.id] ?? ''}</span>)}
            </div>
          </div>
        </div>
      }
    >
      {kind === 'orbit-season' ? <SeasonScene fraction={fraction} /> : <SpinScene fraction={fraction} />}
    </Stage3D>
  );
}
