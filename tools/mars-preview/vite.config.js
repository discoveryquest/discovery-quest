import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone (NON-workspace) dev shell for the Mars POC. Living outside
// packages/* and examples/* means its deps install into its OWN node_modules —
// React 18 + fiber v8 + rapier v1, matching the platform deploy target — instead
// of the workspace-hoisted React 19 / fiber 9 that crashes rapier v1 (see
// candidate space-3d-dev-verify-path). `resolve.dedupe` forces the imported mars
// source (which lives up in packages/space) onto THIS app's single copy of each
// singleton, so there's no duplicate-React / mismatched-reconciler crash.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    fs: { allow: ['../..'] },
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', 'three'],
  },
});
