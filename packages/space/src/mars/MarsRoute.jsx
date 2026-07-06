import { Suspense, lazy } from 'react';

// Fullscreen entry for the standalone "walk on Mars" POC. Mounted by a pathname
// check in App.jsx — no profile gate, no router (see spec §3.1 and decision
// context/decisions/app-shell-state-routing-profile-gate.md). The 3D scene is a
// second lazy boundary so it splits from the (later) loading UI; touchAction:none
// stops mobile Safari page-scroll from fighting the look-drag.
import Hud from './ui/Hud.jsx';
import FactCard from './ui/FactCard.jsx';
const MarsSurface = lazy(() => import('./MarsSurface.jsx'));

export default function MarsRoute() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0602', touchAction: 'none' }}>
      <Suspense
        fallback={
          <div data-testid="mars-loading"
               style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
                        color: '#e8c9a0', fontFamily: 'system-ui' }}>
            Loading Mars…
          </div>
        }
      >
        <MarsSurface />
      </Suspense>
      <Hud />
      <FactCard />
    </div>
  );
}
