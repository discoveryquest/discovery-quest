import { createRoot } from 'react-dom/client';
// Import the Mars route straight from packages/space source (worktree is truth).
// No StrictMode: its dev double-invoke double-inits the Rapier physics world.
import MarsRoute from '../../../packages/space/src/mars/MarsRoute.jsx';
import { marsStore } from '../../../packages/space/src/mars/store/marsStore.js';
import './styles.css';

// Dev-only hook so headless screenshots can drive the rover tour (open/select)
// without walking Luna across the terrain to the rover first. Harness-only.
window.__mars = marsStore;

createRoot(document.getElementById('root')).render(<MarsRoute />);
