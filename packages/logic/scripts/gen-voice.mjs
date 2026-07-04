// Pre-generate Logic Quest's voice clips via ElevenLabs into
// examples/logic-preview/public/voice/<voice>/*.mp3
//   node packages/logic/scripts/gen-voice.mjs [--force] [--voice Jessica]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';
import { buildVoiceJobs } from '../src/scenes/voiceJobs.js';

// forSpeech: must match course-check.mjs exactly so the manifest invariant is consistent.
const forSpeech = (t) => t.replace(/[⭐🎉]/gu, '').replace(/\s+/g, ' ').trim();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// repo root = 3 levels up from packages/logic/scripts/
const repoRoot = path.resolve(__dirname, '../../..');

const courseFile = path.join(repoRoot, 'packages/logic/logic.course.yml');
const doc = yaml.load(readFileSync(courseFile, 'utf8'));
const course = doc.course || doc;

const force = process.argv.includes('--force');
const vIdx = process.argv.indexOf('--voice');
const wantedVoice = vIdx > -1 ? process.argv[vIdx + 1] : null;

// KEY RESOLUTION: (1) env var, (2) math-quest .env in platform sibling repo
let KEY = process.env.ELEVENLABS_API_KEY || null;
if (!KEY) {
  const envFile = '/Users/pavel/dev/discoveryquest/platform/apps/math-quest/.env';
  if (existsSync(envFile)) {
    const envText = readFileSync(envFile, 'utf8');
    const parsed = Object.fromEntries(
      envText
        .split('\n')
        .filter((l) => l.includes('='))
        .map((l) => [
          l.slice(0, l.indexOf('=')).trim(),
          l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, ''),
        ]),
    );
    KEY = parsed.ELEVENLABS_API_KEY || null;
  }
}
if (!KEY) {
  console.error(
    'ELEVENLABS_API_KEY not found — set it in the environment or at platform/apps/math-quest/.env (see spec › Dubbing)',
  );
  process.exit(1);
}

const api = (apiPath, opts = {}) =>
  fetch(`https://api.elevenlabs.io${apiPath}`, {
    ...opts,
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', ...opts.headers },
  });

const PREFERRED = ['Jessica', 'Hope', 'Matilda', 'Elli', 'Bella'];
const res = await api('/v1/voices');
if (!res.ok) { console.error('voices request failed:', res.status, await res.text()); process.exit(1); }
const { voices } = await res.json();
const firstName = (v) => v.name.split(/[\s-]/)[0];
const voice = wantedVoice
  ? voices.find((v) => firstName(v).toLowerCase() === wantedVoice.toLowerCase())
  : PREFERRED.map((n) => voices.find((v) => firstName(v) === n)).find(Boolean) || voices[0];
if (!voice) { console.error('voice not found'); process.exit(1); }
const slug = firstName(voice).toLowerCase();
console.log(`voice: ${voice.name} (${voice.voice_id}) → examples/logic-preview/public/voice/${slug}/`);

const outDir = path.join(repoRoot, 'examples/logic-preview/public/voice', slug);
mkdirSync(outDir, { recursive: true });

// Build job list from narration map via buildVoiceJobs; dedupe by key.
const rawJobs = buildVoiceJobs(course);
const seen = new Set();
const jobs = rawJobs.filter((j) => (seen.has(j.key) ? false : seen.add(j.key)));

// Manifest: bake forSpeech(text) so course-check can detect stale clips.
const manifestFile = path.join(outDir, 'manifest.json');
const oldManifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const manifest = {};

let made = 0, skipped = 0;
async function generate(job) {
  const baked = forSpeech(job.text);
  manifest[job.key] = baked;
  const file = path.join(outDir, `${job.key}.mp3`);
  const stale = oldManifest[job.key] !== undefined && oldManifest[job.key] !== baked;
  if (existsSync(file) && !force && !stale) { skipped++; return; }
  for (let attempt = 0; ; attempt++) {
    const r = await api(`/v1/text-to-speech/${voice.voice_id}?output_format=mp3_44100_64`, {
      method: 'POST',
      body: JSON.stringify({
        text: job.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: job.slow
          ? { stability: 0.55, similarity_boost: 0.85, style: 0.2, speed: 0.8 }
          : { stability: 0.35, similarity_boost: 0.8, style: 0.55 },
      }),
    });
    if (r.status === 429 && attempt < 5) { await new Promise((s) => setTimeout(s, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${job.key}: ${r.status} ${await r.text()}`);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    console.log(`wrote  ${job.key}.mp3  "${job.text}"`);
    made++; return;
  }
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 2 }, async () => {
  for (;;) { const job = queue.shift(); if (!job) return; await generate(job); }
})).catch((e) => { console.error('FAIL', e.message); process.exit(1); });

writeFileSync(manifestFile, JSON.stringify(manifest, null, 0));
console.log(`done — ${made} generated, ${skipped} already present in examples/logic-preview/public/voice/${slug}/`);
