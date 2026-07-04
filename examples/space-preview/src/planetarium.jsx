// Planetarium — full-screen preview of the 3D bodies kit. Two views:
//   System — the whole solar system orbiting (compressed scales), belt included
//   Tour   — one body filling the screen, drag to orbit, pinch/scroll to zoom
// This is the visual QA surface for the kit before the course adopts it.
import React, { Suspense, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  BODIES, PLANET_ORDER, displayRadius, displayOrbitRadius, orbitRadPerSec,
  Planet, Sun, MilkyWay, Asteroid, AsteroidBelt,
} from '../../../packages/space/src/scene/bodies/index.js';

const TOUR = ['sun', ...PLANET_ORDER, 'moon', 'asteroid'];

function Orbiter({ body, timeScale, children }) {
  const ref = useRef();
  const a = displayOrbitRadius(body);
  const omega = orbitRadPerSec(body, timeScale);
  const phase = useMemo(() => (Object.keys(BODIES).indexOf(body) * 2.39) % (Math.PI * 2), [body]);
  useFrame((state) => {
    const ang = phase + omega * state.clock.elapsedTime * 40; // orbits sped up 40× vs spins so motion is visible
    ref.current?.position.set(Math.cos(ang) * a, 0, Math.sin(ang) * a);
  });
  return <group ref={ref}>{children}</group>;
}

function OrbitRing({ body }) {
  const a = displayOrbitRadius(body);
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[a - 0.02, a + 0.02, 128]} />
      <meshBasicMaterial color="#3a4a66" transparent opacity={0.35} side={2} depthWrite={false} />
    </mesh>
  );
}

function SystemView({ timeScale }) {
  const beltInner = (displayOrbitRadius('mars') + displayOrbitRadius('jupiter')) / 2 - 1.6;
  return (
    <>
      <Sun timeScale={timeScale} />
      {PLANET_ORDER.map((b) => (
        <React.Fragment key={b}>
          <OrbitRing body={b} />
          <Orbiter body={b} timeScale={timeScale}>
            <Planet body={b} timeScale={timeScale} nightLights={b === 'earth'} />
            {b === 'earth' && (
              <Orbiter body="moon" timeScale={timeScale}>
                <Planet body="moon" radius={displayRadius('moon') * 0.9} timeScale={timeScale} position={[displayRadius('earth') * 2.6, 0, 0]} />
              </Orbiter>
            )}
          </Orbiter>
        </React.Fragment>
      ))}
      <AsteroidBelt inner={beltInner} outer={beltInner + 3.2} count={550} timeScale={timeScale} />
    </>
  );
}

function TourView({ body, timeScale }) {
  if (body === 'sun') return <Sun timeScale={timeScale} radius={2.4} lightIntensity={60} />;
  if (body === 'asteroid') return (
    <>
      <Asteroid seed={11} radius={2.2} spin={0.18} />
      <Asteroid seed={23} radius={0.8} position={[4.2, 1.2, -2]} spin={0.4} />
      <Asteroid seed={5} radius={0.5} position={[-3.6, -1.4, -1]} spin={0.6} />
      <directionalLight position={[8, 4, 6]} intensity={2.6} color="#fff4de" />
    </>
  );
  const r = BODIES[body]?.ring ? 1.9 : 3; // leave room for rings in frame
  return (
    <>
      <Planet body={body} radius={r} timeScale={timeScale * 8} nightLights={body === 'earth'} sunPosition={[20, 2, 8]} />
      {/* sun is off to the right, far away, so night lights + terminator read */}
      <directionalLight position={[20, 2, 8]} intensity={2.8} color="#fff4de" />
      {body === 'earth' && <Planet body="moon" radius={0.82} timeScale={timeScale * 8} position={[7.5, 1.4, -4]} />}
    </>
  );
}

function App() {
  const [view, setView] = useState('system');
  const [speed, setSpeed] = useState(1);
  const timeScale = 4000 * speed;
  const tour = view !== 'system';

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={[1, 2]}
        camera={tour ? { position: [0, 1.6, 8.5], fov: 45 } : { position: [0, 34, 46], fov: 50 }}
        gl={{ antialias: true }}
        key={view === 'system' ? 'sys' : 'tour'}
      >
        <color attach="background" args={['#01020a']} />
        <ambientLight intensity={tour ? 0.16 : 0.12} />
        <Suspense fallback={null}>
          <MilkyWay />
          {view === 'system' ? <SystemView timeScale={timeScale} /> : <TourView body={view} timeScale={timeScale} />}
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={tour ? 4.2 : 8} maxDistance={tour ? 40 : 160} />
      </Canvas>

      {/* overlay UI */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '0 12px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {['system', ...TOUR].map((b) => (
          <button key={b} data-view={b} onClick={() => setView(b)} style={{
            padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)',
            background: view === b ? 'rgba(252,211,77,0.25)' : 'rgba(10,14,26,0.72)',
            color: view === b ? '#fcd34d' : '#cbd5e1', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            backdropFilter: 'blur(6px)', textTransform: 'capitalize',
          }}>
            {b}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
          speed
          <input type="range" min="0.1" max="20" step="0.1" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
          {speed.toFixed(1)}×
        </label>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
