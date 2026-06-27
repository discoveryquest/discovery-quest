// Scene lighting from data. 'sun' = a directional light (drives planet day-sides
// and Moon phases) plus a visible glowing disc. Keep dynamic lights few (spec §7.2).
export default function Light({ kind = 'ambient', position = [0, 0, 0], intensity = 1, color = '#ffffff' }) {
  if (kind === 'ambient') return <ambientLight intensity={intensity} color={color} />;

  if (kind === 'sun' || kind === 'directional') {
    return (
      <>
        <directionalLight position={position} intensity={intensity} color={color} />
        {kind === 'sun' && (
          // The visible Sun. `bloom` in the data is a hint for a post-processing
          // pass (@react-three/postprocessing) the app shell can add — spec §7.2.
          <mesh position={position}>
            <sphereGeometry args={[3, 24, 24]} />
            <meshBasicMaterial color="#fff3c4" />
          </mesh>
        )}
      </>
    );
  }

  if (kind === 'point') return <pointLight position={position} intensity={intensity} color={color} />;

  console.warn(`[Light] unknown kind "${kind}", skipping`);
  return null;
}
