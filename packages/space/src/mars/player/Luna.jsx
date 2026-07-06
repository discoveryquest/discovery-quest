// Placeholder Luna in a spacesuit — simple primitives so the whole loop (physics,
// camera, interaction) can be validated before swapping in the rigged Meshy model
// (T22) behind this same component. Feet at group origin y=0.
export default function Luna(props) {
  return (
    <group {...props}>
      {/* legs */}
      <mesh position={[-0.13, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.5, 4, 8]} />
        <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
      </mesh>
      <mesh position={[0.13, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.5, 4, 8]} />
        <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.5, 6, 12]} />
        <meshStandardMaterial color="#f2ede4" roughness={0.7} />
      </mesh>
      {/* chest orange accent */}
      <mesh position={[0, 1.05, 0.24]}>
        <boxGeometry args={[0.24, 0.2, 0.06]} />
        <meshStandardMaterial color="#e8752e" emissive="#e8752e" emissiveIntensity={0.15} />
      </mesh>
      {/* backpack (life support) */}
      <mesh position={[0, 1.05, -0.26]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.22]} />
        <meshStandardMaterial color="#d9d3c9" roughness={0.7} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.34, 1.05, 0]} rotation={[0, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
        <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
      </mesh>
      <mesh position={[0.34, 1.05, 0]} rotation={[0, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
        <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
      </mesh>
      {/* helmet */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color="#f6f3ec" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* visor */}
      <mesh position={[0, 1.5, 0.12]}>
        <sphereGeometry args={[0.2, 24, 16, 0, Math.PI * 2, Math.PI * 0.28, Math.PI * 0.44]} />
        <meshStandardMaterial color="#16232f" metalness={0.7} roughness={0.15} />
      </mesh>
    </group>
  );
}
