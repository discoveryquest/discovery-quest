// Order-the-planets, full-screen 3D: the Sun burns at the left, empty orbit
// slots run outward, and real mini-planets wait in a tray below. DRAG a
// planet — it follows the pointer — and release it near a ring to snap in;
// a miss flies it home (Pavel 2026-07-04: drag, not tap-tap). The correct
// order is DERIVED from BODIES[..].orbit.aAU (authors can never write a
// wrong answer key). When all slots fill: right → onCorrect; wrong → only
// the misplaced ones fly back and onHint fires. Name chips live INSIDE each
// planet's group (they move together, always on screen) and stay tappable as
// a two-tap fallback (accessibility + E2E hooks).
// step.scene.bodies: unordered [bodyId,...] (any subset of planets).
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Sun, BODIES } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';

const SUN_X = -8.6;
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // everything plays on z=0
// Generous magnet: slots sit 3.4 apart, so nearest-slot stays unambiguous
// while fat-finger drops (especially in scaled-down portrait) still catch.
const SNAP_DIST = 2.6;

// Once a drag starts, moves/releases are caught by this scene-sized plane —
// touch pointers stop reporting to the small grab sphere the instant the
// finger leaves it (pointer capture is unreliable for touch in the R3F event
// layer), and a huge surface is always under the finger. Same trick as the
// MoonPhase3D drag surface.
function DragCatcher({ drag, onMove, onRelease }) {
  const ref = useRef();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const local = (e) => {
    e.ray.intersectPlane(DRAG_PLANE, tmp);
    ref.current?.parent?.worldToLocal(tmp);
    return tmp;
  };
  return (
    <mesh ref={ref} visible={false}
      onPointerMove={(e) => { if (drag.current.body) onMove(drag.current.body, local(e)); }}
      onPointerUp={() => { if (drag.current.body) onRelease(drag.current.body); }}
      onPointerCancel={() => { if (drag.current.body) onRelease(drag.current.body); }}>
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
}

function PlanetPiece({ body, radius, target, drag, held, done, onGrab, onMove, onRelease, onChipTap }) {
  const ref = useRef();
  const dest = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  // Pointer ray → LOCAL point in the (possibly portrait-scaled) stage group —
  // world coords would land planets offset whenever portraitScale ≠ 1.
  const localPoint = (e) => {
    e.ray.intersectPlane(DRAG_PLANE, tmp);
    ref.current?.parent?.worldToLocal(tmp);
    return tmp;
  };
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const dragging = drag.current.body === body;
    if (dragging) dest.copy(drag.current.point);
    else dest.set(...target);
    g.position.lerp(dest, Math.min(1, dt * (dragging ? 26 : 6)));
    const s = dragging || held ? 1.22 : 1;
    g.scale.lerp(dest.set(s, s, s), Math.min(1, dt * 8)); // dest reused as tmp — after position
  });
  return (
    <group ref={ref} position={target}>
      <Planet body={body} radius={radius} timeScale={6000} detail={body === 'saturn' || body === 'uranus'} />
      {(drag.current.body === body || held) && (
        <mesh>
          <sphereGeometry args={[radius * 1.6, 24, 24]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}
      {/* fat-finger grab surface */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          if (done) return;
          e.stopPropagation();
          e.target.setPointerCapture?.(e.pointerId);
          onGrab(body, localPoint(e));
        }}
        onPointerMove={(e) => onMove(body, localPoint(e))}
        onPointerUp={(e) => { e.target.releasePointerCapture?.(e.pointerId); onRelease(body); }}
        onPointerCancel={() => onRelease(body)}
      >
        <sphereGeometry args={[Math.max(1.1, radius * 1.7), 16, 16]} />
      </mesh>
      <Html center position={[0, -radius - 0.75, 0]} zIndexRange={[10, 0]}>
        <button type="button" data-planet={body} onClick={() => onChipTap(body)}
          className={`touch-manipulation whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold capitalize backdrop-blur-sm
            ${held ? 'border-amber-300 bg-amber-400/20 text-amber-100'
              : done ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200'
              : 'border-white/15 bg-slate-950/60 text-slate-200'}`}>
          {body}
        </button>
      </Html>
    </group>
  );
}

export default function OrbitOrder3D({ step, onCorrect, onHint }) {
  const bodies = step?.scene?.bodies ?? ['earth', 'mercury', 'mars', 'venus'];
  const solution = useMemo(() => [...bodies].sort((a, b) => (BODIES[a]?.orbit?.aAU ?? 99) - (BODIES[b]?.orbit?.aAU ?? 99)), [bodies]);
  const n = bodies.length;
  const [placed, setPlaced] = useState({}); // slotIdx -> bodyId
  const [held, setHeld] = useState(null); // chip-tap fallback selection
  const [, force] = useState(0); // re-render when a drag starts/ends (halo)
  const drag = useRef({ body: null, point: new THREE.Vector3() });
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);
  const [failNote, setFailNote] = useState(0);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const slotSpan = Math.min(13.5, n * 3.4);
  const slotPos = (j) => [SUN_X + 3.4 + (j * slotSpan) / Math.max(1, n), 0.2, 0];
  const trayPos = (i) => [-(n - 1) * 1.6 + i * 3.2, -3.1, 0];
  const slotOf = (body) => Object.entries(placed).find(([, b]) => b === body)?.[0];
  const radiusFor = (body) => 0.62 + Math.min(0.75, (BODIES[body]?.radiusKm ?? 6000) / 90000);

  function commit(next) {
    setPlaced(next);
    if (Object.keys(next).length !== n) return;
    const right = solution.every((b, idx) => next[idx] === b);
    if (right) {
      doneRef.current = true;
      setDone(true);
      setTimeout(() => onCorrectRef.current?.(), 900);
    } else {
      setFailNote(Date.now());
      onHintRef.current?.();
      setTimeout(() => setPlaced((p) => {
        const keep = {};
        for (const [k, b] of Object.entries(p)) if (solution[k] === b) keep[k] = b;
        return keep;
      }), 650);
    }
  }

  function placeInto(body, j) {
    const next = { ...placed };
    for (const k of Object.keys(next)) if (next[k] === body) delete next[k];
    if (next[j] && next[j] !== body) delete next[j]; // evict occupant to tray
    next[j] = body;
    commit(next);
  }

  // --- drag handlers ---------------------------------------------------------
  function grab(body, point) {
    if (doneRef.current) return;
    setHeld(null);
    drag.current.point.copy(point);
    drag.current.body = body;
    // dragging out of a slot frees it immediately
    const s = slotOf(body);
    if (s !== undefined) setPlaced((p) => { const nx = { ...p }; delete nx[s]; return nx; });
    force((c) => c + 1);
  }
  function move(body, point) {
    if (drag.current.body !== body) return;
    drag.current.point.copy(point);
  }
  function release(body) {
    if (drag.current.body !== body) return;
    const p = drag.current.point;
    drag.current.body = null;
    force((c) => c + 1);
    let best = -1, bestD = SNAP_DIST;
    for (let j = 0; j < n; j++) {
      const sp = slotPos(j);
      const d = Math.hypot(p.x - sp[0], p.y - sp[1]);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0) placeInto(body, best);
    else setPlaced((prev) => ({ ...prev })); // no snap — lerp carries it home
  }

  // --- chip-tap fallback (accessibility + E2E) --------------------------------
  function tapBody(body) {
    if (doneRef.current) return;
    const s = slotOf(body);
    if (s !== undefined) {
      setPlaced((p) => { const nx = { ...p }; delete nx[s]; return nx; });
      setHeld(body);
    } else setHeld(held === body ? null : body);
  }
  function tapSlot(j) {
    if (doneRef.current || !held) return;
    const b = held;
    setHeld(null);
    placeInto(b, j);
  }

  const posFor = (body, i) => {
    const s = slotOf(body);
    return s !== undefined ? slotPos(+s) : held === body ? [trayPos(i)[0], -2.1, 0] : trayPos(i);
  };

  return (
    <Stage3D camera={{ position: [1.5, 2.6, 12.5], fov: 50 }} ambient={0.2} portraitScale={0.58}>
      <Sun radius={2.1} position={[SUN_X, 0.2, 0]} timeScale={4000} lightIntensity={900} />
      <DragCatcher drag={drag} onMove={move} onRelease={release} />
      {Array.from({ length: n }, (_, j) => {
        const p = slotPos(j);
        const filled = placed[j];
        return (
          <group key={j} position={p}>
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.9, 0]}>
              <ringGeometry args={[0.75, 0.9, 48]} />
              <meshBasicMaterial color={filled ? '#34d399' : '#67e8f9'} transparent opacity={filled ? 0.8 : 0.4} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Html center position={[0, -1.75, 0]} zIndexRange={[10, 0]}>
              <button type="button" data-slot={j} onClick={() => tapSlot(j)}
                className={`touch-manipulation rounded-full border px-2.5 py-0.5 text-[11px] font-black backdrop-blur-sm
                  ${held ? 'animate-pulse border-amber-300/70 bg-amber-400/15 text-amber-200' : 'border-white/12 bg-slate-950/55 text-slate-400'}`}>
                {j + 1}
              </button>
            </Html>
          </group>
        );
      })}
      {bodies.map((body, i) => (
        <PlanetPiece key={body} body={body} radius={radiusFor(body)} target={posFor(body, i)}
          drag={drag} held={held === body} done={done}
          onGrab={grab} onMove={move} onRelease={release} onChipTap={tapBody} />
      ))}
      <Html center position={[0, 4.2, 0]} zIndexRange={[10, 0]}>
        <p data-order-state={done ? 'won' : failNote ? 'retry' : 'playing'} className="pointer-events-none whitespace-nowrap text-sm font-bold text-slate-300 drop-shadow">
          {done ? '🎉 Perfect orbit order!' : 'Drag each planet onto a ring — closest to the Sun first!'}
        </p>
      </Html>
    </Stage3D>
  );
}
