import { Suspense, lazy, useState } from 'react';

// Fullscreen entry for the standalone "walk on Mars" POC. Mounted by a pathname
// check in App.jsx — no profile gate, no router (see spec §3.1 and decision
// context/decisions/app-shell-state-routing-profile-gate.md). The 3D scene is a
// second lazy boundary so it splits from the branded loading UI; touchAction:none
// stops mobile Safari page-scroll from fighting the look-drag. If WebGL is
// unavailable we show a graceful fallback instead of a blank Canvas (spec R3).
import Hud from './ui/Hud.jsx';
import FactCard from './ui/FactCard.jsx';
import MarsAudio from './audio/MarsAudio.jsx';
import Snapshot from './ui/Snapshot.jsx';
import Controls from './ui/Controls.jsx';
import ControlsHint from './ui/ControlsHint.jsx';
import HelmetVisor from './ui/HelmetVisor.jsx';
import LoadingScreen from './ui/LoadingScreen.jsx';
import WebGLFallback from './ui/WebGLFallback.jsx';
import { hasWebGL } from './ui/webgl.js';
const MarsSurface = lazy(() => import('./MarsSurface.jsx'));

export default function MarsRoute() {
  // Probe once on mount (client only); document is available in the lazy route.
  const [webgl] = useState(hasWebGL);

  if (!webgl) return <WebGLFallback />;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0602', touchAction: 'none' }}>
      <Suspense fallback={<LoadingScreen />}>
        <MarsSurface />
      </Suspense>
      <Hud />
      <FactCard />
      <MarsAudio />
      <Snapshot />
      <Controls />
      <ControlsHint />
      <HelmetVisor />
    </div>
  );
}
