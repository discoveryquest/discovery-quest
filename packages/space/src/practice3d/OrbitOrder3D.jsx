// Order-the-planets, full-screen 3D: the Sun burns at the left, empty orbit
// slots run outward, and real mini-planets wait in a tray. Tap a planet, tap
// a slot — it flies there on a spring. The correct order is DERIVED from
// BODIES[..].orbit.aAU (authors can never write a wrong answer key). When all
// slots are filled: right → onCorrect; wrong → the misplaced ones fly back to
// the tray and onHint fires. Replaces the 'order-line' chip row.
// step.scene.bodies: unordered [bodyId,...] (any subset of planets).
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Sun, BODIES } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';

const SUN_X = -8.6;

function FlyingPlanet({ body, radius, target, held }) {
  const ref = useRef();
  const vec = useMemo(() => new THREE.Vector3(...target), []);
  vec.set(...target);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.lerp(vec, Math.min(1, dt * 6));
    const s = held ? 1.22 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
  });
  return (
    <group ref={ref} position={target}>
      <Planet body={body} radius={radius} timeScale={26000} detail={body === 'saturn' || body === 'uranus'} />
      {held && (
        <mesh>
          <sphereGeometry args={[radius * 1.6, 24, 24]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export default function OrbitOrder3D({ step, onCorrect, onHint }) {
  const bodies = step?.scene?.bodies ?? ['earth', 'mercury', 'mars', 'venus'];
  const solution = useMemo(() => [...bodies].sort((a, b) => (BODIES[a]?.orbit?.aAU ?? 99) - (BODIES[b]?.orbit?.aAU ?? 99)), [bodies]);
  const n = bodies.length;
  const [placed, setPlaced] = useState({}); // slotIdx -> bodyId
  const [held, setHeld] = useState(null);
  const [checkFail, setCheckFail] = useState(0);
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const slotSpan = Math.min(13.5, n * 3.4);
  const slotPos = (j) => [SUN_X + 3.4 + (j * slotSpan) / Math.max(1, n - 0), 0.2, 0];
  const trayPos = (i) => [-(n - 1) * 1.5 + i * 3, -3.1, 3.2];
  const slotOf = (body) => Object.entries(placed).find(([, b]) => b === body)?.[0];
  const radiusFor = (body) => 0.62 + Math.min(0.75, (BODIES[body]?.radiusKm ?? 6000) / 90000);

  function tapBody(body) {
    if (doneRef.current) return;
    const s = slotOf(body);
    if (s !== undefined) { // pull it back out of its slot
      setPlaced((p) => { const nx = { ...p }; delete nx[s]; return nx; });
      setHeld(body);
    } else setHeld(held === body ? null : body);
  }

  function tapSlot(j) {
    if (doneRef.current || !held) return;
    const next = { ...placed };
    for (const k of Object.keys(next)) if (next[k] === held) delete next[k];
    next[j] = held;
    setPlaced(next);
    setHeld(null);
    if (Object.keys(next).length === n) {
      const right = solution.every((b, idx) => next[idx] === b);
      if (right) {
        doneRef.current = true;
        setDone(true);
        setTimeout(() => onCorrectRef.current?.(), 900);
      } else {
        setCheckFail(Date.now());
        onHintRef.current?.();
        // send only the WRONG ones home — keep earned progress
        setTimeout(() => setPlaced((p) => {
          const keep = {};
          for (const [k, b] of Object.entries(p)) if (solution[k] === b) keep[k] = b;
          return keep;
        }), 650);
      }
    }
  }

  const posFor = (body, i) => {
    const s = slotOf(body);
    return s !== undefined ? slotPos(+s) : held === body ? [trayPos(i)[0], -2.2, 3.4] : trayPos(i);
  };

  return (
    <Stage3D camera={{ position: [1.5, 2.6, 12.5], fov: 50 }} ambient={0.2}>
      <Sun radius={2.1} position={[SUN_X, 0.2, 0]} timeScale={4000} lightIntensity={900} />
      {/* orbit slots */}
      {Array.from({ length: n }, (_, j) => {
        const p = slotPos(j);
        const filled = placed[j];
        return (
          <group key={j} position={p}>
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.9, 0]}>
              <ringGeometry args={[0.75, 0.9, 48]} />
              <meshBasicMaterial color={filled ? '#34d399' : '#67e8f9'} transparent opacity={filled ? 0.8 : 0.4} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Html center position={[0, -1.7, 0]} zIndexRange={[10, 0]}>
              <button type="button" data-slot={j} onClick={() => tapSlot(j)}
                className={`touch-manipulation rounded-full border px-2.5 py-0.5 text-[11px] font-black backdrop-blur-sm
                  ${held ? 'animate-pulse border-amber-300/70 bg-amber-400/15 text-amber-200' : 'border-white/12 bg-slate-950/55 text-slate-400'}`}>
                {j + 1}
              </button>
            </Html>
          </group>
        );
      })}
      {/* the planets */}
      {bodies.map((body, i) => (
        <group key={body}>
          <FlyingPlanet body={body} radius={radiusFor(body)} target={posFor(body, i)} held={held === body} />
          <Html center position={[posFor(body, i)[0], posFor(body, i)[1] - radiusFor(body) - 0.8, posFor(body, i)[2]]} zIndexRange={[10, 0]}>
            <button type="button" data-planet={body} onClick={() => tapBody(body)}
              className={`touch-manipulation whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold capitalize backdrop-blur-sm
                ${held === body ? 'border-amber-300 bg-amber-400/20 text-amber-100'
                  : done ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200'
                  : 'border-white/15 bg-slate-950/60 text-slate-200'}`}>
              {body}
            </button>
          </Html>
        </group>
      ))}
      <Html center position={[0, 4.2, 0]} zIndexRange={[10, 0]}>
        <p data-order-state={done ? 'won' : checkFail ? 'retry' : 'playing'} className="pointer-events-none whitespace-nowrap text-sm font-bold text-slate-300 drop-shadow">
          {done ? '🎉 Perfect orbit order!' : 'Tap a planet, then tap its place — closest to the Sun first!'}
        </p>
      </Html>
    </Stage3D>
  );
}
