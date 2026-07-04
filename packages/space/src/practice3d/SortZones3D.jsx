// Sort-zones, full-screen 3D: zone pads float like landing platforms and the
// tokens (emoji orbs / real bodies) are DRAGGED onto them — same drag language
// as OrbitOrder3D (grab → follow → snap; DragCatcher plane; hover tints the
// pad green/red per Pavel's hint rule). All placed → right ones stay, wrong
// ones fly home with Luna's hint. Uses the course YAML's sort-zones shape:
// step.target.zones [{id,label,emoji}], step.target.tokens [{id,label,emoji,zone}].
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Stage3D from './Stage3D.jsx';
import { renderPiece, chipClass } from './pieces.jsx';

const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const SNAP_DIST = 2.6;
const TOKEN_R = 0.8;

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
      onPointerMove={(e) => { if (drag.current.id) onMove(local(e)); }}
      onPointerUp={() => { if (drag.current.id) onRelease(); }}
      onPointerCancel={() => { if (drag.current.id) onRelease(); }}>
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
}

function ZonePad({ zone, center, drag, rightTokenIds, count }) {
  const mat = useRef();
  const mesh = useRef();
  useFrame((state) => {
    if (!mat.current || !mesh.current) return;
    const d = drag.current;
    const hovering = d.id && Math.hypot(d.point.x - center[0], d.point.y - center[1]) < SNAP_DIST;
    if (hovering) {
      mat.current.color.set(rightTokenIds.has(d.id) ? '#4ade80' : '#f87171');
      mat.current.opacity = 0.5;
      mesh.current.scale.setScalar(1.06 + Math.sin(state.clock.elapsedTime * 6) * 0.04);
    } else {
      mat.current.color.set('#38bdf8');
      mat.current.opacity = count ? 0.34 : 0.2;
      mesh.current.scale.setScalar(1);
    }
  });
  return (
    <group position={center}>
      <mesh ref={mesh} rotation-x={-Math.PI / 2.6} position={[0, -0.4, 0]}>
        <circleGeometry args={[2.15, 48]} />
        <meshBasicMaterial ref={mat} color="#38bdf8" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html center position={[0, 1.7, 0]} zIndexRange={[10, 0]}>
        {/* text-only header — no emoji glyphs in 3D practice */}
        <span data-zone={zone.id} className="pointer-events-none whitespace-nowrap rounded-full border border-white/12 bg-slate-950/60 px-3 py-1 text-xs font-extrabold text-slate-200 backdrop-blur-sm">{zone.label}</span>
      </Html>
    </group>
  );
}

function TokenPiece({ token, target, drag, done, onGrab, onChipTap }) {
  const ref = useRef();
  const dest = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const dragging = drag.current.id === token.id;
    if (dragging) dest.copy(drag.current.point);
    else dest.set(...target);
    g.position.lerp(dest, Math.min(1, dt * (dragging ? 26 : 6)));
  });
  return (
    <group ref={ref} position={target}>
      {renderPiece(token, TOKEN_R)}
      <mesh visible={false}
        onPointerDown={(e) => {
          if (done) return;
          e.stopPropagation();
          onGrab(token.id, e);
        }}>
        <sphereGeometry args={[1.15, 16, 16]} />
      </mesh>
      <Html center position={[0, -TOKEN_R - 0.7, 0]} zIndexRange={[10, 0]}>
        <button type="button" data-token={token.id} onClick={() => onChipTap(token.id)}
          style={{ pointerEvents: drag.current.id ? 'none' : 'auto' }}
          className={chipClass(done ? 'won' : 'idle')}>
          {token.label}
        </button>
      </Html>
    </group>
  );
}

export default function SortZones3D({ step, onCorrect, onHint }) {
  const zones = step?.target?.zones ?? [];
  const tokens = step?.target?.tokens ?? [];
  const [placed, setPlaced] = useState({}); // tokenId -> zoneId
  const [held, setHeld] = useState(null); // chip-tap fallback
  const [, force] = useState(0);
  const drag = useRef({ id: null, point: new THREE.Vector3() });
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);
  const onCorrectRef = useRef(onCorrect);
  const onHintRef = useRef(onHint);
  onCorrectRef.current = onCorrect;
  onHintRef.current = onHint;

  const nz = zones.length;
  const zoneCenter = (k) => [-(nz - 1) * 2.9 + k * 5.8, 1.5, 0];
  const trayPos = (i) => [-(tokens.length - 1) * 1.25 + i * 2.5, -3.2, 0];
  const zoneById = Object.fromEntries(zones.map((z, k) => [z.id, k]));

  function commit(next) {
    setPlaced(next);
    if (Object.keys(next).length !== tokens.length) return;
    const wrong = tokens.filter((t) => next[t.id] !== t.zone);
    if (wrong.length === 0) {
      doneRef.current = true;
      setDone(true);
      setTimeout(() => onCorrectRef.current?.(), 800);
    } else {
      onHintRef.current?.(step?.feedback?.hintSay);
      setTimeout(() => setPlaced((p) => {
        const keep = { ...p };
        for (const t of wrong) delete keep[t.id];
        return keep;
      }), 650);
    }
  }

  function grab(id, e) {
    if (doneRef.current) return;
    setHeld(null);
    drag.current.id = id;
    drag.current.point.set(...trayPos(0)); // corrected on first catcher move
    setPlaced((p) => { const nx = { ...p }; delete nx[id]; return nx; });
    force((c) => c + 1);
  }
  function move(point) { drag.current.point.copy(point); }
  function release() {
    const id = drag.current.id;
    const p = drag.current.point;
    drag.current.id = null;
    force((c) => c + 1);
    let best = null, bestD = SNAP_DIST;
    zones.forEach((z, k) => {
      const c = zoneCenter(k);
      const d = Math.hypot(p.x - c[0], p.y - c[1]);
      if (d < bestD) { bestD = d; best = z.id; }
    });
    if (best) commit({ ...placed, [id]: best });
    else setPlaced((prev) => ({ ...prev }));
  }

  // chip-tap fallback: tap token, tap zone label region — zones' Html is
  // pointer-none, so the fallback taps zone pads via data on the token order:
  // tapping a held token's chip again drops it on the next zone cyclically is
  // confusing — instead E2E/keyboard users tap token then a zone hotspot chip.
  function tapToken(id) {
    if (doneRef.current) return;
    if (placed[id]) { setPlaced((p) => { const nx = { ...p }; delete nx[id]; return nx; }); setHeld(id); }
    else setHeld(held === id ? null : id);
  }
  function tapZoneChip(zoneId) {
    if (doneRef.current || !held) return;
    const id = held;
    setHeld(null);
    commit({ ...placed, [id]: zoneId });
  }

  const posFor = (token, i) => {
    const z = placed[token.id];
    if (z !== undefined && zoneById[z] !== undefined) {
      const c = zoneCenter(zoneById[z]);
      const idx = tokens.filter((t) => placed[t.id] === z).findIndex((t) => t.id === token.id);
      return [c[0] - 0.9 + (idx % 2) * 1.8, c[1] - 0.6 - Math.floor(idx / 2) * 0.6, 0.6 + idx * 0.02];
    }
    return held === token.id ? [trayPos(i)[0], -2.3, 0] : trayPos(i);
  };

  return (
    <Stage3D camera={{ position: [0, 1.2, 12.5], fov: 50 }} ambient={0.5} portraitScale={0.62}>
      <directionalLight position={[6, 8, 10]} intensity={1.6} color="#fff4de" />
      <DragCatcher drag={drag} onMove={move} onRelease={release} />
      {zones.map((z, k) => (
        <group key={z.id}>
          <ZonePad zone={z} center={zoneCenter(k)} drag={drag}
            rightTokenIds={new Set(tokens.filter((t) => t.zone === z.id).map((t) => t.id))}
            count={tokens.filter((t) => placed[t.id] === z.id).length} />
          {/* tap-fallback hotspot for the zone — pointer-events ONLY while a
              token is chip-held, or it swallows canvas moves mid-drag */}
          <Html center position={[zoneCenter(k)[0], zoneCenter(k)[1] + 0.6, 0]} zIndexRange={[9, 0]}>
            <button type="button" data-zone-tap={z.id} onClick={() => tapZoneChip(z.id)}
              style={{ pointerEvents: held ? 'auto' : 'none' }}
              className={`h-16 w-24 touch-manipulation rounded-2xl border-2 border-transparent bg-transparent ${held ? 'border-dashed border-amber-300/50' : ''}`}
              aria-label={`Place in ${z.label}`} />
          </Html>
        </group>
      ))}
      {tokens.map((t, i) => (
        <TokenPiece key={t.id} token={t} target={posFor(t, i)} drag={drag} done={done}
          onGrab={grab} onChipTap={tapToken} />
      ))}
      <Html center position={[0, 4.4, 0]} zIndexRange={[10, 0]}>
        <p data-sort-state={done ? 'won' : 'playing'} className="pointer-events-none whitespace-nowrap text-sm font-bold text-slate-300 drop-shadow">
          {done ? '🎉 All sorted!' : 'Drag each one onto the zone where it belongs!'}
        </p>
      </Html>
    </Stage3D>
  );
}
