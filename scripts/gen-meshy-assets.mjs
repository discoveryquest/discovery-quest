// Generate the Mars POC 3D assets with the Meshy REST API (no MCP needed).
// Key: MESHY_API_KEY from env or platform/.env. text-to-3d flow is preview →
// refine (adds texture/PBR) → download glb. Saves into the dev harness AND the
// deploy app's public/mars, under a `meshy/` subdir so nothing overwrites the
// working placeholders until Pavel approves the look and we wire the swap.
//
//   node scripts/gen-meshy-assets.mjs luna
//   node scripts/gen-meshy-assets.mjs rocks
//   node scripts/gen-meshy-assets.mjs all
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

let KEY = process.env.MESHY_API_KEY || null;
if (!KEY) {
  try {
    const t = readFileSync('/Users/pavel/dev/discoveryquest/platform/.env', 'utf8');
    const m = t.match(/^\s*MESHY_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) KEY = m[1].replace(/^["']|["']$/g, '');
  } catch { /* ignore */ }
}
if (!KEY) { console.error('MESHY_API_KEY not found'); process.exit(1); }

const BASE = 'https://api.meshy.ai/openapi';
const DESTS = [
  '/Users/pavel/dev/discoveryquest/.worktrees/mars-surface/tools/mars-preview/public/mars/meshy',
  '/Users/pavel/dev/discoveryquest/platform/apps/space-quest/public/mars/meshy',
];
const H = () => ({ Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  const res = await fetch(BASE + path, { method: 'POST', headers: H(), body: JSON.stringify(body) });
  const txt = await res.text();
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${txt.slice(0, 300)}`);
  return JSON.parse(txt);
}
async function get(path) {
  const res = await fetch(BASE + path, { headers: H() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
async function poll(id, label, kind = 'v2/text-to-3d') {
  for (let i = 0; i < 120; i++) {
    const t = await get(`/${kind}/${id}`);
    if (t.status === 'SUCCEEDED') return t;
    if (t.status === 'FAILED' || t.status === 'CANCELED') {
      throw new Error(`${label} ${t.status}: ${JSON.stringify(t.task_error || {})}`);
    }
    process.stdout.write(`\r  ${label}: ${t.status} ${t.progress ?? 0}%   `);
    await sleep(6000);
  }
  throw new Error(`${label} timed out`);
}

async function download(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${name} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  for (const d of DESTS) {
    mkdirSync(d, { recursive: true });
    writeFileSync(`${d}/${name}.glb`, buf);
  }
  console.log(`\n  saved ${name}.glb (${(buf.length / 1024).toFixed(0)} KB) to ${DESTS.length} dests`);
}

async function textTo3D({ name, prompt, art_style = 'realistic', polycount = 30000 }) {
  console.log(`\n${name}: preview…`);
  const prev = await post('/v2/text-to-3d', {
    mode: 'preview', prompt, art_style, ai_model: 'meshy-5',
    should_remesh: true, topology: 'triangle', target_polycount: polycount,
  });
  await poll(prev.result, `${name} preview`);
  console.log(`\n${name}: refine (texture/PBR)…`);
  const ref = await post('/v2/text-to-3d', { mode: 'refine', preview_task_id: prev.result, enable_pbr: true });
  const done = await poll(ref.result, `${name} refine`);
  const glb = done.model_urls?.glb;
  if (!glb) throw new Error(`${name}: no glb in result`);
  await download(glb, name);
}

// Image-to-3D (single stage) from a local reference PNG, base64'd into a data URI.
async function imageTo3D({ name, imagePath }) {
  console.log(`\n${name}: image-to-3d from ${imagePath}…`);
  const b64 = readFileSync(imagePath).toString('base64');
  // meshy-4 is the stable default for image-to-3d (meshy-5 hung at 49% on the PBR
  // stage). Note: enable_pbr is meshy-5 only — meshy-4 rejects it with a 400.
  const model = process.env.AI_MODEL || 'meshy-4';
  const body = {
    image_url: `data:image/png;base64,${b64}`,
    ai_model: model, should_remesh: true, should_texture: true,
    topology: 'triangle', target_polycount: 30000,
  };
  if (model !== 'meshy-4' && process.env.ENABLE_PBR !== '0') body.enable_pbr = true;
  const start = await post('/v1/image-to-3d', body);
  const done = await poll(start.result, `${name} image-to-3d`, 'v1/image-to-3d');
  const glb = done.model_urls?.glb;
  if (!glb) throw new Error(`${name}: no glb in result`);
  await download(glb, name);
}

const LUNA = {
  name: 'luna',
  prompt:
    'A friendly cute cartoon astronaut character for a kids game, full body, standing in a neutral A-pose ' +
    'with arms slightly away from the body, wearing a clean white spacesuit with orange accents and a large ' +
    'round helmet with a dark reflective visor, rounded chunky proportions, smooth stylized shapes, ' +
    'centered, front facing',
  art_style: 'realistic',
  polycount: 30000,
};
const ROCKS = [
  { name: 'rock-a', prompt: 'A single realistic Mars surface rock, reddish-brown weathered basalt with dust, irregular angular shape, game asset, single object', polycount: 8000 },
  { name: 'rock-b', prompt: 'A single realistic Mars boulder, rounded pitted volcanic rock, rusty red regolith dust, game asset, single object', polycount: 8000 },
  { name: 'rock-c', prompt: 'A single realistic Mars mineral rock, grey-blue hematite stone with reddish dust, faceted, game asset, single object', polycount: 8000 },
];

const which = process.argv[2] || 'luna';
if (which === 'luna-img') {
  // node scripts/gen-meshy-assets.mjs luna-img <ref.png>
  await imageTo3D({ name: 'luna', imagePath: process.argv[3] });
} else if (which === 'img') {
  // node scripts/gen-meshy-assets.mjs img <name> <ref.png>
  await imageTo3D({ name: process.argv[3], imagePath: process.argv[4] });
} else {
  const jobs = which === 'all' ? [LUNA, ...ROCKS] : which === 'rocks' ? ROCKS : [LUNA];
  for (const job of jobs) {
    await textTo3D(job);
  }
}
console.log('\nDone.');
