// Tap-the-right-one, full-screen 3D: items float in an arc — REAL spinning
// planets when the item id is a body, glowing EmojiOrbs for concepts (Core,
// GPS, Nebula…) — and the child taps the one Luna asked for. Covers the
// course's tap-hotspot / compare-strength kinds with their YAML shape
// (target.items [{id,label,emoji,size?}], target.id) plus the body-list shape
// (scene.options: [bodyId…]). Name chips are DOM (drei Html): readable for
// kids, phone-friendly tap targets, stable [data-body] E2E hooks. Wrong tap
// wobbles the item and calls onHint.
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Sun, BODIES, displayRadius } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';
import { renderPiece, chipClass } from './pieces.jsx';

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
// order (Jupiter still clearly bigger than Mercury). Authored `size` (the
// compare-strength 48-96px scale) wins when present.
function tapRadius(item) {
  if (item.size) return 0.55 + (item.size / 96) * 0.95;
  if (BODIES[item.id]) return 0.7 + Math.min(1.15, displayRadius(item.id) * 0.16);
  return 0.85;
}

export default function TargetTap3D({ step, onCorrect, onHint }) {
  const options = step?.target?.items ?? (step?.scene?.options ?? ['mars', 'saturn', 'neptune']).map((id) => ({ id }));
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
    <Stage3D camera={{ position: [0, 1.6, 10.5], fov: 50 }} ambient={0.3} portraitScale={0.7}>
      <Sun radius={1.2} position={SUN_POS} timeScale={4000} lightIntensity={2000} />
      {options.map((item, i) => {
        const id = item.id;
        const pos = posFor(i);
        const r = tapRadius(item);
        const isPick = picked === id;
        const won = doneRef.current && id === answer;
        return (
          <Bobbing key={id} position={pos} wobble={isPick && !won && wrongAt ? 1 : 0}>
            <group
              onClick={() => tap(id)}
              onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              {renderPiece(item, r)}
              {/* win halo */}
              {won && (
                <mesh>
                  <sphereGeometry args={[r * 1.5, 32, 32]} />
                  <meshBasicMaterial color="#34d399" transparent opacity={0.2} depthWrite={false} />
                </mesh>
              )}
            </group>
            <Html center position={[0, -(r + (BODIES[id]?.ring ? r * 0.7 : 0.5)) - 0.35, 0]} zIndexRange={[10, 0]}>
              <button type="button" data-body={id} onClick={() => tap(id)} className={chipClass(won ? 'won' : 'idle')}>
                {item.label ?? id}
              </button>
            </Html>
          </Bobbing>
        );
      })}
    </Stage3D>
  );
}
