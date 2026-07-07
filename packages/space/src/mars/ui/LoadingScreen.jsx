import { useProgress } from '@react-three/drei';

// Branded Suspense fallback shown while the scene + the ~12 MB rover glb load.
// Reads real load progress from drei's useProgress (the default THREE loading
// manager) so the bar reflects the actual download, with a Luna line + a fact so
// the wait teaches something. Same butterscotch palette as the HUD.
export default function LoadingScreen() {
  const { progress } = useProgress();
  const pct = Math.round(progress);
  return (
    <div
      data-testid="mars-loading"
      style={{
        position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
        background: 'radial-gradient(120% 100% at 50% 30%, #3a2413, #140a05)',
        color: '#ffe9d0', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 360, padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🪐</div>
        <div style={{ color: '#ff9e5a', fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
          Landing on Mars…
        </div>
        <div style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>
          Luna is suiting up — gravity here is only 38% of Earth's, so get ready to bound.
        </div>
        <div
          style={{
            marginTop: 18, height: 8, borderRadius: 999,
            background: 'rgba(255,255,255,0.12)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, #ff9e5a, #ffd18a)',
              transition: 'width 200ms ease',
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{pct}%</div>
      </div>
    </div>
  );
}
