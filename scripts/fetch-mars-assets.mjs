// Reproducible fetch of the Mars POC's NASA assets (public domain). NASA moves
// URLs over time, so re-run this if a link 404s and update the URLs below.
// Writes into every dest dir passed (default: the harness + the deploy app).
//   node scripts/fetch-mars-assets.mjs [destDir ...]
import { mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';

// source -> filename. All NASA public domain.
const ASSETS = {
  // Official NASA Science 3D model — Mars 2020 Perseverance rover (glTF-binary).
  'perseverance.glb':
    'https://mars.nasa.gov/system/resources/gltf_files/25042_Perseverance.glb',
  // Mastcam-Z Sol 3 first 360-degree panorama (cylindrical), web size ~1610x507.
  'panorama.jpg':
    'https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/detail_files/2/5/25640_PIA24264-Perseverance_Sol3_Mastcam-Z_panorama-web.jpg',
};

const REPO = resolve(import.meta.dirname, '..');
const dests = (process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      resolve(REPO, 'tools/mars-preview/public/mars'), // harness (gitignored, re-fetchable)
      '/Users/pavel/dev/discoveryquest/platform/apps/space-quest/public/mars', // deploy (committed in platform repo)
    ]
).map((d) => resolve(d));

async function download(url, out) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  await new Promise((ok, err) => {
    const ws = createWriteStream(out);
    Readable.fromWeb(res.body).pipe(ws).on('finish', ok).on('error', err);
  });
}

for (const dest of dests) {
  mkdirSync(dest, { recursive: true });
  for (const [name, url] of Object.entries(ASSETS)) {
    const out = resolve(dest, name);
    process.stdout.write(`↓ ${name} -> ${out}\n`);
    await download(url, out);
  }
}
console.log('done.');
