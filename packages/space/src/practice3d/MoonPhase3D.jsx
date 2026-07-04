// Moon-phase practice, full-screen 3D: the REAL Moon dragged around the REAL
// Earth (night-side city lights and all), lit by the actual Sun off to the
// left — the phase emerges from the physics instead of being drawn. The
// from-Earth view ("YOU SEE") and the GOAL phase are SVG insets in the
// overlay, reusing the same litPath math as the 2D version, so what the
// scene shows and what the child must match stay provably consistent.
// Contract: { step, onCorrect, onHint, demo } — same as every mechanic.
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { angularError, phaseForAngle, targetAngle } from '../gates/phaseLock.js';
import { litPath } from '../scenes/geometry.js';
import { Planet, Sun } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';

// Close enough to sit in-frame at the left — the child SEES the light source
// that makes the phase, which is the whole lesson.
const SUN_POS = [-11, -0.8, -6.5];
const R_ORBIT = 5.4;
const START_ANGLE = 35;
const clampAngle = (n) => ((n % 360) + 360) % 360;
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

// phase angle (0=new: Moon sunward; 180=full: Moon opposite) → orbit position.
// The Sun sits along -X, so new moon is at -X.
const moonPos = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return [-Math.cos(rad) * R_ORBIT, 0, Math.sin(rad) * R_ORBIT];
};
const angleFromPoint = (p) => clampAngle((Math.atan2(p.z, -p.x) * 180) / Math.PI);

function OrbitRing() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[R_ORBIT - 0.03, R_ORBIT + 0.03, 96]} />
      <meshBasicMaterial color="#67e8f9" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function TargetMarker({ angle, close }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.1;
    ref.current.scale.setScalar(close ? 1.15 : s);
  });
  return (
    <group position={moonPos(angle)}>
      <mesh ref={ref} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.78, 0.92, 48]} />
        <meshBasicMaterial color={close ? '#34d399' : '#22d3ee'} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// timeScale 5200 ≈ one Earth day in ~17s — clearly spinning, never dizzying.
function Scene({ angle, close, done, onDragTo, timeScale = 5200 }) {
  const draggingRef = useRef(false);
  return (
    <>
      <Sun radius={1.05} position={SUN_POS} timeScale={timeScale} lightIntensity={1150} />
      <Planet body="earth" radius={1.85} timeScale={timeScale} nightLights sunPosition={SUN_POS} />
      <OrbitRing />
      <Planet body="moon" radius={0.55} timeScale={timeScale} position={moonPos(angle)} atmosphere={false} />
      {/* selection halo around the Moon so it reads as THE draggable thing */}
      <mesh position={moonPos(angle)}>
        <sphereGeometry args={[0.68, 32, 32]} />
        <meshBasicMaterial color={close ? '#34d399' : '#e2e8f0'} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {/* invisible drag surface far larger than the screen: touch ANYWHERE and
          the Moon follows the pointer's direction from Earth — no need to hit
          the orbit line (Pavel's mobile feedback 2026-07-04) */}
      <mesh
        rotation-x={-Math.PI / 2}
        visible={false}
        onPointerDown={(e) => {
          if (done) return;
          draggingRef.current = true;
          e.target.setPointerCapture?.(e.pointerId);
          onDragTo(angleFromPoint(e.point));
        }}
        onPointerMove={(e) => { if (draggingRef.current && !done) onDragTo(angleFromPoint(e.point)); }}
        onPointerUp={(e) => { draggingRef.current = false; e.target.releasePointerCapture?.(e.pointerId); }}
      >
        <circleGeometry args={[80, 32]} />
      </mesh>
    </>
  );
}

function PhaseDisc({ angle, r = 24, lit = '#ece7d6', ring }) {
  const d = litPath(angle, r, r + 2, r + 2);
  return (
    <svg width={(r + 2) * 2} height={(r + 2) * 2} className="block">
      <circle cx={r + 2} cy={r + 2} r={r} fill="#0a0c15" />
      {d && <path d={d} fill={lit} />}
      <circle cx={r + 2} cy={r + 2} r={r} fill="none" stroke={ring} strokeWidth="2" />
    </svg>
  );
}

export default function MoonPhase3D({ step, onCorrect, demo = false }) {
  const [angle, setAngle] = useState(START_ANGLE);
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);
  const targetPhase = step?.target?.phase ?? 'full';
  const tolerance = step?.target?.toleranceDeg ?? 16;
  const target = targetAngle(targetPhase);
  const close = angularError(angle, target) <= tolerance;
  const current = phaseForAngle(angle);
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;

  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    setAngle(target); // snap visibly into the ring
    const t = setTimeout(() => onCorrectRef.current?.(), 700);
    return () => clearTimeout(t);
  }, [close, target]);

  useEffect(() => {
    if (!demo || doneRef.current) return;
    const delta = ((target - START_ANGLE + 540) % 360) - 180;
    const startAt = performance.now() + 900;
    let raf;
    const tick = (now) => {
      if (doneRef.current) return;
      const p = Math.min(1, Math.max(0, (now - startAt) / 3400));
      setAngle(clampAngle(START_ANGLE + delta * easeInOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [demo, target]);

  return (
    <Stage3D
      camera={{ position: [0, 6.2, 11.5], fov: 46 }}
      portraitScale={0.88}
      overlay={
        <div data-practice3d="moon-phase" data-phase={current.name} data-close={close ? 1 : 0}>
          <div className="absolute left-4 top-4 flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-sm">
            <span className="text-[10px] font-black tracking-widest text-slate-400">YOU SEE</span>
            <PhaseDisc angle={angle} ring="rgba(226,232,240,0.5)" />
            <span className="text-xs font-extrabold text-cyan-200">{current.label}</span>
          </div>
          <div className="absolute right-4 top-4 flex flex-col items-center gap-1 rounded-2xl border border-cyan-300/25 bg-slate-950/60 p-3 backdrop-blur-sm">
            <span className="text-[10px] font-black tracking-widest text-cyan-300">GOAL</span>
            <PhaseDisc angle={target} lit="#67e8f9" ring={close ? '#34d399' : 'rgba(103,232,249,0.6)'} />
          </div>
          <p className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full border border-white/10 bg-slate-950/70 px-4 py-1.5 text-center text-sm font-bold text-slate-300 backdrop-blur-sm">
            Drag the Moon around the Earth — sunlight makes the phase. Land inside the ring!
          </p>
        </div>
      }
    >
      <Scene angle={angle} close={close} done={done} onDragTo={setAngle} />
      <TargetMarker angle={target} close={close} />
    </Stage3D>
  );
}
