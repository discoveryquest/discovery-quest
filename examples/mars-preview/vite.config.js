import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev shell for the Mars Surface POC. `host: true` exposes the server on the LAN
// (open the Network URL on a phone for touch testing). `fs.allow` lets us import
// the library's source straight from packages/ (it's not pre-built).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    fs: { allow: ['../..'] },
  },
});
