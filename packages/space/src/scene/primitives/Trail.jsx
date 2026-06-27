import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// A flowing "Milky Way" star-dust trail connecting the sector's station nodes in
// order — the 3D cousin of the 2D TrailMap. One THREE.Points sampled along a
// Catmull-Rom curve through the nodes, with perpendicular scatter for a fuzzy
// stream. Segments up to the unlocked frontier glow; the rest stay dim.
export default function Trail({ nodes = [], unlockedCount = 0, density = 60, spread = 0.7 }) {
  const geometry = useMemo(() => {
    if (nodes.length < 2) return null;
    const pts = nodes.map((n) => new THREE.Vector3(n[0], n[1], n[2]));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const segments = nodes.length - 1;
    const total = segments * density;

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const lit = new THREE.Color('#67e8f9');
    const dim = new THREE.Color('#243049');
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3();
    const nrm = new THREE.Vector3();

    for (let i = 0; i < total; i++) {
      const t = i / (total - 1);
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t);
      side.crossVectors(tan, up).normalize();
      nrm.crossVectors(tan, side).normalize();
      // denser near the spine, wispy at the edges
      const a = (Math.random() - 0.5) * spread * (Math.random() + 0.3);
      const b = (Math.random() - 0.5) * spread * (Math.random() + 0.3);
      p.addScaledVector(side, a).addScaledVector(nrm, b);
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;

      const segIdx = Math.min(segments - 1, Math.floor(t * segments));
      const c = segIdx < unlockedCount ? lit : dim; // glow up to the frontier
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [nodes, unlockedCount, density, spread]);

  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.2} vertexColors sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
