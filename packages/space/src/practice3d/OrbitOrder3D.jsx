// Order-the-sequence, full-screen 3D. Two flavours from the same component:
//   • all items are planets → the Sun burns at the left, orbit slots run
//     outward, and the correct order is DERIVED from BODIES aAU (authors can
//     never write a wrong key). Real mini-planets as pieces.
//   • generic sequence (star life, rocket trip…) → START➜ marker at the left,
//     numbered slots, EmojiOrb pieces, order from the authored target.order.
// DRAG a piece — it follows the pointer — release near a ring to snap in; a
// miss flies it home (Pavel: drag, not tap-tap). Hovered rings tint green/red.
// All slots full: right → onCorrect; wrong → only the misplaced fly back +
// onHint. Name chips live INSIDE each piece's group (always on screen, travel
// with it) and stay tappable as a two-tap fallback (a11y + E2E hooks).
// Accepts step.scene.bodies [id,...] OR step.target.items [{id,label,emoji}]
// (+ target.order for non-planet sequences).
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Sun, BODIES } from '../scene/bodies/index.js';
import Stage3D from './Stage3D.jsx';
import { renderPiece, chipClass } from './pieces.jsx';

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

// Slot ring that reacts to the live drag: hovering a planet within snap range
// tints it green when that slot is the planet's rightful place, red when not
// (Pavel 2026-07-04). Reads drag.current in useFrame — no re-renders.
function SlotRing({ center, wouldBeRight, filled, drag }) {
  const mat = useRef();
  const mesh = useRef();
  useFrame((state) => {
    if (!mat.current || !mesh.current) return;
    const d = drag.current;
    const hovering = d.body && Math.hypot(d.point.x - center[0], d.point.y - center[1]) < SNAP_DIST;
    if (hovering) {
      const right = wouldBeRight(d.body);
      mat.current.color.set(right ? '#4ade80' : '#f87171');
      mat.current.opacity = 0.95;
      mesh.current.scale.setScalar(1.1 + Math.sin(state.clock.elapsedTime * 6) * 0.06);
    } else {
      mat.current.color.set(filled ? '#34d399' : '#67e8f9');
      mat.current.opacity = filled ? 0.8 : 0.4;
      mesh.current.scale.setScalar(1);
    }
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, -0.9, 0]}>
      <ringGeometry args={[0.75, 0.9, 48]} />
      <meshBasicMaterial ref={mat} color="#67e8f9" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function PlanetPiece({ item, radius, target, drag, held, done, onGrab, onMove, onRelease, onChipTap }) {
  const body = item.id;
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
      {renderPiece(item, radius)}
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
          style={{ pointerEvents: drag.current.body ? 'none' : 'auto' }}
          className={chipClass(held ? 'held' : done ? 'won' : 'idle')}>
          {item.label ?? body}
        </button>
      </Html>
    </group>
  );
}

export default function OrbitOrder3D({ step, onCorrect, onHint }) {
  const items = useMemo(() => {
    if (step?.target?.items) return step.target.items;
    return (step?.scene?.bodies ?? ['earth', 'mercury', 'mars', 'venus']).map((id) => ({ id }));
  }, [step]);
  const allPlanets = items.every((it) => BODIES[it.id]?.orbit);
  const solution = useMemo(() => {
    if (allPlanets) return [...items].sort((a, b) => BODIES[a.id].orbit.aAU - BODIES[b.id].orbit.aAU).map((it) => it.id);
    return step?.target?.order ?? items.map((it) => it.id);
  }, [items, allPlanets, step]);
  const n = items.length;
  const compact = n > 5; // 8-planet missions pack tighter with smaller pieces
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

  const slotSpan = Math.min(14.5, n * 3.4);
  const anchorX = allPlanets ? SUN_X + 3.4 : -7.2;
  const slotPos = (j) => [anchorX + ((j + (allPlanets ? 0 : 0.5)) * slotSpan) / Math.max(1, n), 0.2, 0];
  const traySpan = Math.min(15, n * 3.2);
  const trayPos = (i) => [-traySpan / 2 + ((i + 0.5) * traySpan) / n, -3.1, 0];
  const slotOf = (body) => Object.entries(placed).find(([, b]) => b === body)?.[0];
  const radiusFor = (item) => {
    const base = BODIES[item.id] ? 0.62 + Math.min(0.75, BODIES[item.id].radiusKm / 90000) : 0.8;
    return base * (compact ? 0.62 : 1);
  };

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
    <Stage3D camera={{ position: [1.5, 2.6, 12.5], fov: 50 }} ambient={allPlanets ? 0.2 : 0.42} portraitScale={0.58}>
      {allPlanets ? (
        <Sun radius={2.1} position={[SUN_X, 0.2, 0]} timeScale={4000} lightIntensity={900} />
      ) : (
        <>
          <directionalLight position={[6, 8, 10]} intensity={1.5} color="#fff4de" />
          <Html center position={[anchorX - 1.7, 0.2, 0]} zIndexRange={[10, 0]}>
            <span className="pointer-events-none whitespace-nowrap rounded-full border border-white/12 bg-slate-950/60 px-3 py-1 text-xs font-black tracking-widest text-cyan-200 backdrop-blur-sm">START ➜</span>
          </Html>
        </>
      )}
      <DragCatcher drag={drag} onMove={move} onRelease={release} />
      {Array.from({ length: n }, (_, j) => {
        const p = slotPos(j);
        const filled = placed[j];
        return (
          <group key={j} position={p}>
            <SlotRing center={p} wouldBeRight={(b) => solution[j] === b} filled={!!filled} drag={drag} />
            <Html center position={[0, -1.75, 0]} zIndexRange={[10, 0]}>
              <button type="button" data-slot={j} onClick={() => tapSlot(j)}
                style={{ pointerEvents: drag.current.body ? 'none' : 'auto' }}
                className={`touch-manipulation rounded-full border px-2.5 py-0.5 text-[11px] font-black backdrop-blur-sm
                  ${held ? 'animate-pulse border-amber-300/70 bg-amber-400/15 text-amber-200' : 'border-white/12 bg-slate-950/55 text-slate-400'}`}>
                {j + 1}
              </button>
            </Html>
          </group>
        );
      })}
      {items.map((item, i) => (
        <PlanetPiece key={item.id} item={item} radius={radiusFor(item)} target={posFor(item.id, i)}
          drag={drag} held={held === item.id} done={done}
          onGrab={grab} onMove={move} onRelease={release} onChipTap={tapBody} />
      ))}
      <Html center position={[0, 4.2, 0]} zIndexRange={[10, 0]}>
        <p data-order-state={done ? 'won' : failNote ? 'retry' : 'playing'} className="pointer-events-none whitespace-nowrap text-sm font-bold text-slate-300 drop-shadow">
          {done ? (allPlanets ? '🎉 Perfect orbit order!' : '🎉 Perfect sequence!')
            : allPlanets ? 'Drag each planet onto a ring — closest to the Sun first!'
            : 'Drag each one onto a ring — first to last!'}
        </p>
      </Html>
    </Stage3D>
  );
}
