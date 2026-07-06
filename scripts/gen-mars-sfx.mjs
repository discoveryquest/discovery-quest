// Generate the Mars POC sound effects with ElevenLabs' text-to-sound-effects API
// (same key + auth as gen-voice.mjs: env ELEVENLABS_API_KEY, else the math-quest
// .env; header `xi-api-key`). Writes an ambient wind bed + a rock-impact thud into
// BOTH the deploy app (platform/apps/space-quest/public) and the local dev harness
// (tools/mars-preview/public) so /mars has audio in dev and prod.
//
// Run from the main checkout or the worktree:  node scripts/gen-mars-sfx.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// KEY RESOLUTION — mirror gen-voice.mjs: (1) env var, (2) math-quest .env.
let KEY = process.env.ELEVENLABS_API_KEY || null;
if (!KEY) {
  try {
    const envText = readFileSync('/Users/pavel/dev/discoveryquest/platform/apps/math-quest/.env', 'utf8');
    for (const line of envText.split('\n')) {
      const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) { KEY = m[1].replace(/^["']|["']$/g, ''); break; }
    }
  } catch { /* fall through */ }
}
if (!KEY) {
  console.error('ELEVENLABS_API_KEY not found (env or platform/apps/math-quest/.env)');
  process.exit(1);
}

const PLATFORM = '/Users/pavel/dev/discoveryquest/platform/apps/space-quest/public';
const HARNESS = '/Users/pavel/dev/discoveryquest/.worktrees/mars-surface/tools/mars-preview/public';

// duration_seconds is capped ~22s by the API; prompt_influence 0..1 (higher =
// stick closer to the prompt). loop only applies to <=~22s beds.
const SFX = [
  {
    name: 'mars-wind',
    dests: ['music'],
    prompt:
      'continuous thin cold high-altitude desert wind on Mars, steady eerie ambient howl, ' +
      'low sparse gusts, lonely and vast, no music, seamless loop',
    duration_seconds: 22,
    prompt_influence: 0.35,
    loop: true,
  },
  {
    name: 'rock-thud',
    dests: ['mars'],
    prompt: 'a single dull rock landing on dusty regolith, short dry low thud, one hit, no reverb tail',
    duration_seconds: 1.6,
    prompt_influence: 0.5,
    loop: false,
  },
];

async function genOne(sfx) {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: sfx.prompt,
      duration_seconds: sfx.duration_seconds,
      prompt_influence: sfx.prompt_influence,
      ...(sfx.loop ? { loop: true } : {}),
      output_format: 'mp3_44100_128',
    }),
  });
  if (!res.ok) {
    throw new Error(`${sfx.name}: ${res.status} ${res.statusText} — ${(await res.text()).slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  for (const root of [PLATFORM, HARNESS]) {
    for (const sub of sfx.dests) {
      const dir = `${root}/${sub}`;
      mkdirSync(dir, { recursive: true });
      const out = `${dir}/${sfx.name}.mp3`;
      writeFileSync(out, buf);
      console.log(`  wrote ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
  }
}

for (const sfx of SFX) {
  console.log(`Generating ${sfx.name}…`);
  await genOne(sfx);
}
console.log('Done.');
