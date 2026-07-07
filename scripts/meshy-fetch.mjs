// Resume a Meshy task by id: poll until SUCCEEDED, then download the glb into the
// harness + deploy meshy/ staging dirs. For when a generation outlives the
// original poll (meshy-5 image-to-3d can take >12 min).
//   node scripts/meshy-fetch.mjs <taskId> <name> [kind]
// kind defaults to v1/image-to-3d; use v2/text-to-3d for text jobs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

let KEY = process.env.MESHY_API_KEY || null;
if (!KEY) {
  const t = readFileSync('/Users/pavel/dev/discoveryquest/platform/.env', 'utf8');
  const m = t.match(/^\s*MESHY_API_KEY\s*=\s*(.+?)\s*$/m);
  if (m) KEY = m[1].replace(/^["']|["']$/g, '');
}
const [id, name, kind = 'v1/image-to-3d'] = process.argv.slice(2);
const DESTS = [
  '/Users/pavel/dev/discoveryquest/.worktrees/mars-surface/tools/mars-preview/public/mars/meshy',
  '/Users/pavel/dev/discoveryquest/platform/apps/space-quest/public/mars/meshy',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < 300; i++) {
  const res = await fetch(`https://api.meshy.ai/openapi/${kind}/${id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const t = await res.json();
  process.stdout.write(`\r${name}: ${t.status} ${t.progress ?? 0}%   `);
  if (t.status === 'SUCCEEDED') {
    const glb = t.model_urls?.glb;
    if (!glb) throw new Error('no glb');
    const buf = Buffer.from(await (await fetch(glb)).arrayBuffer());
    for (const d of DESTS) { mkdirSync(d, { recursive: true }); writeFileSync(`${d}/${name}.glb`, buf); }
    console.log(`\nsaved ${name}.glb (${(buf.length / 1024).toFixed(0)} KB)`);
    process.exit(0);
  }
  if (t.status === 'FAILED' || t.status === 'CANCELED') {
    throw new Error(`${name} ${t.status}: ${JSON.stringify(t.task_error || {})}`);
  }
  await sleep(8000);
}
throw new Error(`${name} still not done after long poll`);
