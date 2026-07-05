// 3D lesson scenes (space-3d upgrade, Pavel: "update all the space learn it
// to use new 3d design"). Each bare component mounts a TRANSPARENT Canvas, so
// it drops into the existing 2D SpaceStage (gradient + Starfield show through)
// and the interactive wrappers (Scrub2D range input, Reveal2D hotspots) keep
// working unchanged — they just render richer bases. No emojis anywhere:
// bodies come from the textured kit, concepts from concepts3d.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Sun, Asteroid, BODIES } from '../../scene/bodies/index.js';
import ReleaseContextOnUnmount from '../../scene/ReleaseContextOnUnmount.jsx';
import { CONCEPTS } from '../../practice3d/concepts3d.jsx';
import { SpinScene, SeasonScene } from '../../practice3d/StateDial3D.jsx';

// --- canvas shell ------------------------------------------------------------
function LookAtOrigin() {
  const camera = useThree((s) => s.camera);
  useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
  return null;
}

export function Content3D({ camera = { position: [0, 0.9, 9], fov: 42 }, ambient = 0.4, sunLight = true, children }) {
  return (
    <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={camera}
      style={{ background: 'transparent', touchAction: 'none', position: 'absolute', inset: 0 }}>
      <LookAtOrigin />
      <ReleaseContextOnUnmount />
      <ambientLight intensity={ambient} />
      {sunLight && <directionalLight position={[6, 5, 8]} intensity={2.1} color="#fff4de" />}
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

// Auto-advance a fraction when none is provided (standalone spin/seasons/starLife).
function FractionState({ period, render }) {
  const [f, setF] = useState(0);
  useFrame((state) => {
    const nf = (state.clock.elapsedTime % period) / period;
    if (Math.abs(nf - f) > 0.01) setF(nf);
  });
  return render(f);
}

// --- shared body builder -------------------------------------------------------
const ROLE_R = { star: 1.7, planet: 1.6, moon: 1.35, blackhole: 1.5 };

export function LessonBody({ role = 'planet', color, phase, tilt, rings, glow = true, label, r }) {
  const radius = r ?? ROLE_R[role] ?? 1.5;
  const spinRef = useRef();
  useFrame((_, dt) => { if (spinRef.current) spinRef.current.rotation.y += dt * 0.12; });

  let core;
  if (role === 'star') core = <Sun radius={radius} timeScale={4000} lightIntensity={500} />;
  else if (role === 'blackhole') core = <group scale={radius}>{CONCEPTS.blackhole()}</group>;
  else if (color === 'asteroid') core = <Asteroid seed={13} radius={radius * 0.9} spin={0.2} />;
  else if (color === 'comet') core = <group scale={radius}>{CONCEPTS.comet()}</group>;
  else {
    const body = BODIES[color] ? color : role === 'moon' ? 'moon' : 'earth';
    core = <Planet body={rings ? 'saturn' : body} radius={radius} timeScale={5200} detail
      nightLights={body === 'earth'} sunPosition={phase != null ? phaseLightPos(phase) : [6, 5, 8]} />;
  }

  return (
    <group>
      {/* phase: a dedicated light angle makes the lit fraction (ambient stays low) */}
      {phase != null && <directionalLight position={phaseLightPos(phase)} intensity={2.6} color="#fff4de" />}
      <group ref={spinRef}>{core}</group>
      {tilt && role !== 'star' && (
        <group rotation-z={THREE.MathUtils.degToRad(23.44)}>
          <mesh><cylinderGeometry args={[0.035, 0.035, radius * 2.9, 8]} /><meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} /></mesh>
          <Html center position={[0, radius * 1.7, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <span className="rounded-full border border-white/20 bg-slate-950/60 px-1.5 text-[10px] font-black text-slate-200">N</span>
          </Html>
        </group>
      )}
      {label && (
        <Html center position={[0, -radius - 0.75, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full border border-white/12 bg-slate-950/60 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-200">{label}</span>
        </Html>
      )}
    </group>
  );
}

// phase 0 = dark (new), 0.5 = half-lit from the side, 1 = fully lit toward camera
function phaseLightPos(phase) {
  const a = Math.PI * (1 - Math.max(0, Math.min(1, phase)));
  return [Math.sin(a) * 10, 2, Math.cos(a) * 10];
}

// --- bare scenes ---------------------------------------------------------------
export function BodyContent3D({ body = {}, label }) {
  return (
    <div className="absolute inset-0">
      <Content3D sunLight={body.phase == null}>
        <LessonBody {...body} label={label ?? body.label} />
      </Content3D>
    </div>
  );
}

const ORBIT_ROLE_R = { star: 1.15, planet: 0.52, moon: 0.26, blackhole: 0.9 };
const PX = 0.03; // course yml radii are in 2D-stage px; ~430px stage ↔ ~12.9 world units

function Orbiters({ bodies }) {
  const refs = useRef({});
  const items = useMemo(() => bodies.map((b, i) => ({ ...b, phase0: (i * 2.4) % (Math.PI * 2) })), [bodies]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = {};
    for (const b of items) {
      if (!b.orbits) { pos[b.id] = [0, 0, 0]; continue; }
      const parent = pos[b.orbits] ?? [0, 0, 0];
      const ang = b.scrubFraction != null ? b.scrubFraction * Math.PI * 2 - Math.PI / 2 : b.phase0 + (t * Math.PI * 2) / (b.period ?? 12);
      pos[b.id] = [parent[0] + Math.cos(ang) * (b.radius ?? 60) * PX, 0, parent[2] + Math.sin(ang) * (b.radius ?? 60) * PX];
      refs.current[b.id]?.position.set(...pos[b.id]);
    }
  });
  return (
    <group rotation-x={0.42}>
      {items.map((b) => (
        <group key={b.id}>
          {b.orbits && (
            <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
              <ringGeometry args={[(b.radius ?? 60) * PX - 0.02, (b.radius ?? 60) * PX + 0.02, 96]} />
              <meshBasicMaterial color="#67e8f9" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          )}
          <group ref={(el) => { refs.current[b.id] = el; }}>
            <LessonBody role={b.role} color={b.color} r={ORBIT_ROLE_R[b.role] ?? 0.5}
              phase={b.phaseLit != null ? b.phaseLit : undefined} label={b.label} />
          </group>
        </group>
      ))}
    </group>
  );
}

export function OrbitContent3D({ bodies = [], camera }) {
  return (
    <div className="absolute inset-0">
      <Content3D camera={camera ?? { position: [0, 3.2, 9.5], fov: 44 }}>
        <Orbiters bodies={bodies} />
      </Content3D>
    </div>
  );
}

const FIELD_TINTS = { 'deep-space': '#a5b4fc', nebula: '#c4b5fd', aurora: '#5eead4' };
const FIELD_COUNT = { low: 60, medium: 120, high: 200 };

function FieldCloud({ tint, density }) {
  const geo = useMemo(() => {
    const n = FIELD_COUNT[density] ?? 120;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [density]);
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) { ref.current.rotation.y += dt * 0.03; ref.current.rotation.z += dt * 0.008; } });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.08} color={FIELD_TINTS[tint] ?? '#a5b4fc'} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

export function FieldContent3D({ tint, density = 'medium', label }) {
  return (
    <div className="absolute inset-0">
      <Content3D sunLight={false}>
        <FieldCloud tint={tint} density={density} />
      </Content3D>
      {label && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <p className="text-center text-xl font-extrabold text-white" style={{ textShadow: '0 0 20px rgba(103,232,249,0.7)' }}>{label}</p>
        </div>
      )}
    </div>
  );
}

export function CompareContent3D({ items = [] }) {
  const sized = items.map((it) => ({ ...it, r: 0.3 + Math.sqrt(Math.max(0.05, it.relSize ?? 1)) * 0.62 }));
  const total = sized.reduce((a, it) => a + it.r * 2 + 0.7, 0);
  const scale = Math.min(1, 10.5 / total);
  let x = -((total - 0.7) / 2);
  const placed = sized.map((it) => { const cx = x + it.r; x += it.r * 2 + 0.7; return { ...it, cx }; });
  return (
    <div className="absolute inset-0">
      <Content3D camera={{ position: [0, 0.4, 9.5], fov: 44 }}>
        <group scale={scale}>
          {placed.map((it) => (
            <group key={it.label} position={[it.cx, 0, 0]}>
              <LessonBody role={it.role ?? 'planet'} color={it.color} r={it.r} label={it.label} />
            </group>
          ))}
        </group>
      </Content3D>
    </div>
  );
}

const PAYLOAD_MODELS = { '🛰️': 'satellite', '☄️': 'comet', '🔭': 'satellite', '🧪': 'experiment' };

function LaunchRig({ payload }) {
  const ref = useRef();
  useFrame((state) => {
    const p = (state.clock.elapsedTime % 5) / 5;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    ref.current?.position.set(0, -2.6 + e * 5.6, 0);
  });
  const pid = PAYLOAD_MODELS[payload];
  return (
    <group ref={ref}>
      <group scale={1.5}>{CONCEPTS.thrust()}</group>
      {pid && <group position={[1.15, 0.9, 0]} scale={0.8}>{CONCEPTS[pid]()}</group>}
    </group>
  );
}

export function LaunchContent3D({ payload, camera, scale = 1 }) {
  return (
    <div className="absolute inset-0">
      <Content3D camera={camera}>
        <group scale={scale}><LaunchRig payload={payload} /></group>
      </Content3D>
    </div>
  );
}

function MoonPhaseRig() {
  const ref = useRef();
  useFrame((state) => {
    const a = state.clock.elapsedTime * (Math.PI * 2 / 26);
    ref.current?.position.set(-Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1);
  });
  return (
    <group rotation-x={0.35}>
      <Sun radius={0.75} position={[-7.5, 0.6, -3]} timeScale={4000} lightIntensity={950} />
      <Planet body="earth" radius={1.15} timeScale={5200} nightLights sunPosition={[-7.5, 0.6, -3]} />
      <mesh rotation-x={-Math.PI / 2}><ringGeometry args={[3.07, 3.13, 96]} /><meshBasicMaterial color="#67e8f9" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <group ref={ref}><Planet body="moon" radius={0.4} timeScale={5200} atmosphere={false} /></group>
    </group>
  );
}

export function MoonPhaseContent3D() {
  return (
    <div className="absolute inset-0">
      <Content3D camera={{ position: [0, 2.6, 9], fov: 44 }} sunLight={false} ambient={0.25}>
        <MoonPhaseRig />
      </Content3D>
    </div>
  );
}

export function SpinContent3D({ fraction }) {
  return (
    <div className="absolute inset-0">
      <Content3D camera={{ position: [0, 1.2, 10.5], fov: 44 }} sunLight={false} ambient={0.2}>
        <group scale={0.82} position={[0, -0.2, 0]}>
          {fraction != null ? <SpinScene fraction={fraction} /> : <FractionState period={16} render={(f) => <SpinScene fraction={f} />} />}
        </group>
      </Content3D>
    </div>
  );
}

export function SeasonsContent3D({ fraction }) {
  return (
    <div className="absolute inset-0">
      <Content3D camera={{ position: [0, 7.5, 9], fov: 46 }} sunLight={false} ambient={0.2}>
        <group scale={0.52}>
          {fraction != null ? <SeasonScene fraction={fraction} /> : <FractionState period={20} render={(f) => <SeasonScene fraction={f} />} />}
        </group>
      </Content3D>
    </div>
  );
}

const FALL_BODY = { '🪐': 'jupiter', '🌍': 'earth', '🌙': 'moon' };

function FallRig({ items }) {
  const n = items.length;
  const refs = useRef([]);
  const H = 3.4; // drop height
  useFrame((state) => {
    const slowest = Math.sqrt((2 * H) / Math.min(...items.map((it) => it.g || 1)));
    const cycle = slowest + 1.2;
    const t = state.clock.elapsedTime % cycle;
    items.forEach((it, i) => {
      const tf = Math.sqrt((2 * H) / (it.g || 1));
      const p = Math.min(1, t / tf);
      refs.current[i]?.position.setY(2.2 - H * p * p);
    });
  });
  return (
    <group>
      {items.map((it, i) => {
        const x = -((n - 1) * 2.6) / 2 + i * 2.6;
        const body = FALL_BODY[it.emoji] ?? (BODIES[it.label?.toLowerCase()] ? it.label.toLowerCase() : 'earth');
        return (
          <group key={it.label} position={[x, 0, 0]}>
            <group position={[0, -2.2, 0]}>
              <Planet body={body} radius={0.85} timeScale={6000} detail={false} />
            </group>
            <mesh ref={(el) => { refs.current[i] = el; }} position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            <Html center position={[0, -3.5, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <span className="whitespace-nowrap rounded-full border border-white/12 bg-slate-950/60 px-2 py-0.5 text-[10px] font-extrabold text-slate-200">{it.label}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function FallContent3D({ items = [] }) {
  return (
    <div className="absolute inset-0">
      <Content3D camera={{ position: [0, 0.4, 10], fov: 46 }}>
        <FallRig items={items} />
      </Content3D>
    </div>
  );
}

// Triangle crossfade across the four star-life stages (like StarLife2D).
const LIFE_STAGES = ['nebula', 'newstar', 'giant', 'supernova'];
function StarLifeRig({ fraction = 0 }) {
  const x = fraction * (LIFE_STAGES.length - 1);
  return (
    <group>
      {LIFE_STAGES.map((id, i) => {
        const w = Math.max(0, 1 - Math.abs(x - i));
        if (w < 0.03) return null;
        return <group key={id} scale={0.6 + w * 1.4}>{CONCEPTS[id]()}</group>;
      })}
    </group>
  );
}

export function StarLifeContent3D({ fraction }) {
  return (
    <div className="absolute inset-0">
      <Content3D>
        {fraction != null ? <StarLifeRig fraction={fraction} /> : <FractionState period={14} render={(f) => <StarLifeRig fraction={f} />} />}
      </Content3D>
    </div>
  );
}
