// Planetary rings from the alpha-strip texture (x axis = radius). Three's
// RingGeometry UV-maps like a donut label, so we rewrite uv.x to the radial
// fraction — the classic Saturn trick.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useBodyTexture } from './textures.js';

export default function Rings({ inner = 1.4, outer = 2.4, faint = false, segments = 128 }) {
  const map = useBodyTexture('saturn_ring.png');

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(inner, outer, segments, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return geo;
  }, [inner, outer, segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Unlit material: the alpha strip carries its own shading, and lit materials
  // go near-black at the grazing angles ring planes always sit at.
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2}>
      <meshBasicMaterial
        map={map}
        color={faint ? '#b8dde6' : '#e8ddc4'}
        side={THREE.DoubleSide}
        transparent
        opacity={faint ? 0.5 : 0.96}
        depthWrite={false}
      />
    </mesh>
  );
}
