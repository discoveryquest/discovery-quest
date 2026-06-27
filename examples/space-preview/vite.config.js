import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev shell for the 2D Space Quest. `host: true` exposes the dev server on the LAN
// (open the printed Network URL on a phone). `fs.allow` lets us import the library's
// source straight from packages/ (it's not pre-built). Tailwind v4 styles the shared
// engine-ui / english components (see styles.css @source globs).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    fs: { allow: ['../..'] },
  },
});
