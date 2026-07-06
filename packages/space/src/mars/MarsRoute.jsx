// Fullscreen entry for the standalone "walk on Mars" POC. Mounted by a pathname
// check in App.jsx — no profile gate, no router (see spec §3.1 and decision
// context/decisions/app-shell-state-routing-profile-gate.md).
export default function MarsRoute() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
                  background: '#0b0602', color: '#e8c9a0', fontFamily: 'system-ui' }}>
      <p data-testid="mars-placeholder">Mars surface — coming online…</p>
    </div>
  );
}
