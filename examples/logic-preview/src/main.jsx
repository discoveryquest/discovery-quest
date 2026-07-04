import React from 'react';
import { createRoot } from 'react-dom/client';
// The 2D Logic Quest app (profile gate → TrailMap → Learn-it + quiz). Imported straight
// from source; @discoveryquest/* resolve via the workspace symlinks.
import App from '../../../packages/logic/src/App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
