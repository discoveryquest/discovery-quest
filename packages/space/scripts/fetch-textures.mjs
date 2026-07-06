#!/usr/bin/env node
// Downloads the planet texture maps used by the 3D bodies kit
// (packages/space/src/scene/bodies/) into packages/space/assets/textures/.
// The maps are NOT committed — run this once per checkout.
//
// Source: Solar System Scope textures (https://www.solarsystemscope.com/textures/)
// License: CC Attribution 4.0 — based on NASA elevation & imagery data.
// Attribution is rendered in the app's credits screen; keep it there.
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'textures');
const BASE = 'https://www.solarsystemscope.com/textures/download/';

// name on disk -> file at solarsystemscope
const MAPS = {
  'sun.jpg': '2k_sun.jpg',
  'mercury.jpg': '2k_mercury.jpg',
  'venus_surface.jpg': '2k_venus_surface.jpg',
  'venus_atmosphere.jpg': '2k_venus_atmosphere.jpg',
  'earth_day.jpg': '2k_earth_daymap.jpg',
  'earth_night.jpg': '2k_earth_nightmap.jpg',
  'earth_clouds.jpg': '2k_earth_clouds.jpg',
  'moon.jpg': '2k_moon.jpg',
  'mars.jpg': '2k_mars.jpg',
  'jupiter.jpg': '2k_jupiter.jpg',
  'saturn.jpg': '2k_saturn.jpg',
  'saturn_ring.png': '2k_saturn_ring_alpha.png',
  'uranus.jpg': '2k_uranus.jpg',
  'neptune.jpg': '2k_neptune.jpg',
  'ceres.jpg': '2k_ceres_fictional.jpg', // doubles as the asteroid rock map
  'stars_milky_way.jpg': '8k_stars_milky_way.jpg', // skybox needs the 8k
};

await mkdir(OUT, { recursive: true });
let fetched = 0, skipped = 0;
for (const [name, remote] of Object.entries(MAPS)) {
  const dest = join(OUT, name);
  if (await stat(dest).then((s) => s.size > 10_000).catch(() => false)) { skipped++; continue; }
  const res = await fetch(BASE + remote);
  if (!res.ok) throw new Error(`${remote}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`${remote}: suspiciously small (${buf.length}B)`);
  await writeFile(dest, buf);
  console.log(`  ✓ ${name} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  fetched++;
}
console.log(`textures ready in ${OUT} — ${fetched} fetched, ${skipped} already present`);
