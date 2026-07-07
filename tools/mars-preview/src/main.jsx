import { createRoot } from 'react-dom/client';
// Import the Mars route straight from packages/space source (worktree is truth).
// No StrictMode: its dev double-invoke double-inits the Rapier physics world.
import MarsRoute from '../../../packages/space/src/mars/MarsRoute.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<MarsRoute />);
