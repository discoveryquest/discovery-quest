// Tap-the-right-body, full-screen 3D: real spinning planets float in an arc
// and the child taps the one Luna asked for. Covers the course's tap-hotspot /
// compare-strength quiz kinds. Each body carries a DOM name chip (drei Html)
// — readable for kids, raycast-free tap target for phones, and a stable
// [data-body] hook for E2E. Wrong tap wobbles the planet and calls onHint.
// step.scene.options: [bodyId,...]; step.target.id: the right one.
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Planet, Sun, Asteroid, BODIES, displayRadius } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';

const SUN_POS = [-19, 5, -9];

function Bobbing({ position, wobble = 0, children }) {
  const ref = useRef();
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + phase.current) * 0.18;
    ref.current.rotation.z = wobble ? Math.sin(t * 24) * 0.09 : 0;
  });
  return <group ref={ref} position={position}>{children}</group>;
}

// Normalize display radii into a tap-friendly band while keeping relative size
// order (Jupiter still clearly bigger than Mercury).
function tapRadius(body) {
  const r = displayRadius(body);
  return 0.7 + Math.min(1.15, r * 0.16);
}

export default function TargetTap3D({ step, onCorrect, onHint }) {
  const options = step?.scene?.options ?? ['mars', 'saturn', 'neptune'];
  const answer = step?.target?.id;
  const doneRef = useRef(false);
  const [picked, setPicked] = useState(null); // body just tapped (for feedback)
  const [wrongAt, setWrongAt] = useState(0); // key to retrigger wobble
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const n = options.length;
  const spread = Math.min(9.5, n * 3.1);
  const posFor = (i) => {
    const x = n === 1 ? 0 : -spread / 2 + (i * spread) / (n - 1);
    const z = -Math.abs(x) * 0.28; // gentle arc, ends tucked back
    return [x, 0.4, z];
  };

  function tap(body) {
    if (doneRef.current) return;
    setPicked(body);
    if (body === answer) {
      doneRef.current = true;
      setTimeout(() => onCorrectRef.current?.(), 900);
    } else {
      setWrongAt(Date.now());
      onHintRef.current?.();
    }
  }

  return (
    <Stage3D camera={{ position: [0, 1.6, 10.5], fov: 50 }} ambient={0.26}>
      <Sun radius={1.2} position={SUN_POS} timeScale={4000} lightIntensity={2000} />
      {options.map((body, i) => {
        const pos = posFor(i);
        const r = tapRadius(body);
        const isPick = picked === body;
        const won = doneRef.current && body === answer;
        return (
          <Bobbing key={body} position={pos} wobble={isPick && !won && wrongAt ? 1 : 0}>
            <group
              onClick={() => tap(body)}
              onPointerOver={(e) => (e.object.parent ? (document.body.style.cursor = 'pointer') : null)}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              {body === 'asteroid'
                ? <Asteroid seed={13} radius={r * 0.8} spin={0.3} />
                : <Planet body={body} radius={r} timeScale={26000} />}
              {/* win halo */}
              {won && (
                <mesh>
                  <sphereGeometry args={[r * 1.5, 32, 32]} />
                  <meshBasicMaterial color="#34d399" transparent opacity={0.2} depthWrite={false} />
                </mesh>
              )}
            </group>
            <Html center position={[0, -(r + (BODIES[body]?.ring ? r * 0.7 : 0.5)) - 0.35, 0]} zIndexRange={[10, 0]}>
              <button
                type="button"
                data-body={body}
                onClick={() => tap(body)}
                className={`touch-manipulation whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold capitalize backdrop-blur-sm
                  ${won ? 'border-emerald-300/60 bg-emerald-400/20 text-emerald-200'
                    : 'border-white/15 bg-slate-950/60 text-slate-200'}`}
              >
                {body}
              </button>
            </Html>
          </Bobbing>
        );
      })}
    </Stage3D>
  );
}
