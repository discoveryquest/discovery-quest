// Shown instead of the Canvas when WebGL is unavailable (old device / disabled).
// Keeps the visitor oriented and on-brand rather than staring at a blank screen.
export default function WebGLFallback() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
        background: 'radial-gradient(120% 100% at 50% 30%, #3a2413, #140a05)',
        color: '#ffe9d0', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 340, padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚀</div>
        <div style={{ color: '#ff9e5a', fontWeight: 800, fontSize: 20 }}>
          This device can't walk on Mars yet
        </div>
        <div style={{ opacity: 0.85, marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
          The 3D Mars surface needs WebGL, which isn't available in this browser.
          Try opening it in an up-to-date Chrome, Safari, or Firefox — ideally on a
          phone or computer from the last few years.
        </div>
      </div>
    </div>
  );
}
