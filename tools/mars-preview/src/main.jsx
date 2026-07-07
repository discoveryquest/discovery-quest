import { createRoot } from 'react-dom/client';
// Import the Mars route straight from packages/space source (worktree is truth).
// No StrictMode: its dev double-invoke double-inits the Rapier physics world.
import MarsRoute from '../../../packages/space/src/mars/MarsRoute.jsx';
import { marsStore } from '../../../packages/space/src/mars/store/marsStore.js';
import { telemetry } from '../../../packages/space/src/mars/telemetry.js';
import './styles.css';

// Dev-only hooks so headless screenshots can drive the rover tour and read live
// player/rover positions (to walk Luna up reliably). Harness-only.
window.__mars = marsStore;
window.__marsTel = telemetry;

createRoot(document.getElementById('root')).render(<MarsRoute />);
