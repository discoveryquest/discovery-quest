// "See how Luna solves it" — Space Quest tutorial recorder.
//
//   node packages/space/scripts/record-tutorial.mjs [--station id ...] [--mux-only]
//
// Same layered approach as math (apps/math-quest/scripts/record-tutorial.mjs):
//   • Drive the demo harness (PracticeScreen in demo mode) in real Chrome and
//     page.screencast() a SILENT video (Audio muted, but play() calls still log a
//     narration timeline of clip references).
//   • ffmpeg then muxes the real Jessica mp3s over the silent capture at the logged
//     timestamps, so the published webm is a pure build artifact — swapping a line
//     is a --mux-only re-compose, never a re-record.
//
// Requires the space-preview dev server on :5173, real Chrome, and ffmpeg.
// Voice clips: examples/space-preview/public/voice/jessica/<clip>.mp3
// Output:      examples/space-preview/public/tutorials/<station>.webm  (gitignored artifact)

import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..'); // worktree root
const PREVIEW = resolve(ROOT, 'examples/space-preview');
const VOICE = resolve(PREVIEW, 'public/voice/jessica');
const OUT = resolve(PREVIEW, 'public/tutorials');
const SRC = resolve(PREVIEW, 'tutorials-src'); // captures + manifests (gitignored)

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const muxOnly = args.includes('--mux-only');
const wanted = args.filter((a, i) => args[i - 1] === '--station');
const targets = wanted.length ? wanted : ['moon-phases'];

async function capture(stationId, browser) {
  const dir = resolve(SRC, stationId);
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 900, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    window.__voice = [];
    const play = Audio.prototype.play;
    Audio.prototype.play = function (...a) {
      this.volume = 0; // silent pixels layer — timing still drives the queue
      if (String(this.src).includes('/voice/')) {
        window.__voice.push({ t: performance.now(), clip: this.src.split('/').pop().replace('.mp3', '') });
      }
      return play.apply(this, a);
    };
  });
  await page.goto(`http://localhost:5173/tutorial-harness.html?station=${stationId}&gate=1`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__tutorialReady === true, { timeout: 8000 });

  const recorder = await page.screencast({ path: resolve(dir, 'video.webm') });
  await page.evaluate(() => { window.__voice.length = 0; window.__t0 = performance.now(); });
  await sleep(500);
  await page.evaluate(() => window.__startTutorial()); // begin the solve now

  // Wait for the mission to finish (done screen), plus a beat of fanfare.
  await page.waitForFunction(
    () => /Mission complete|discoveries/.test(document.body.innerText),
    { timeout: 20000 },
  ).catch(() => {});
  await sleep(1800); // let the praise line + fanfare finish
  const timeline = await page.evaluate(() =>
    window.__voice.map((e) => ({ t: Math.max(0, (e.t - window.__t0) / 1000), clip: e.clip })),
  );
  await recorder.stop();
  writeFileSync(resolve(dir, 'manifest.json'),
    JSON.stringify({ stationId, capturedAt: new Date().toISOString(), timeline }, null, 2));
  console.log(`captured ${stationId}: ${timeline.length} narration clips → ${timeline.map((t) => t.clip).join(', ')}`);
}

function mux(stationId) {
  const dir = resolve(SRC, stationId);
  if (!existsSync(resolve(dir, 'manifest.json'))) { console.log(`skip ${stationId} (no capture)`); return false; }
  const { timeline } = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8'));
  if (!timeline.length) { console.log(`skip ${stationId} (empty timeline)`); return false; }
  mkdirSync(OUT, { recursive: true });
  const inputs = ['-i', resolve(dir, 'video.webm')];
  const filters = [];
  const labels = [];
  let n = 0;
  timeline.forEach((e) => {
    const file = resolve(VOICE, `${e.clip}.mp3`);
    if (!existsSync(file)) { console.warn(`  ⚠ ${stationId}: missing clip ${e.clip}, skipped`); return; }
    inputs.push('-i', file);
    const ms = Math.round(e.t * 1000);
    n += 1;
    filters.push(`[${n}:a]adelay=${ms}|${ms}[a${n - 1}]`);
    labels.push(`[a${n - 1}]`);
  });
  if (!n) { console.log(`skip ${stationId} (no usable clips)`); return false; }
  filters.push(`${labels.join('')}amix=inputs=${n}:normalize=0[mix]`);
  execFileSync(FFMPEG, [
    '-y', ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[mix]',
    '-c:v', 'copy', '-c:a', 'libopus', '-b:a', '64k',
    resolve(OUT, `${stationId}.webm`),
  ], { stdio: 'pipe' });
  console.log(`muxed → public/tutorials/${stationId}.webm`);
  return true;
}

for (const id of targets) {
  if (!muxOnly) {
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      const browser = await puppeteer.launch({
        executablePath: CHROME, headless: 'new',
        args: ['--autoplay-policy=no-user-gesture-required'],
      });
      try { await capture(id, browser); ok = true; }
      catch (e) { console.warn(`  ⚠ capture ${id} failed (attempt ${attempt}/2): ${e.message}`); }
      finally { await browser.close().catch(() => {}); }
    }
    if (!ok) { console.warn(`  ✗ skipping ${id} after 2 attempts`); continue; }
  }
  mux(id);
}

const have = existsSync(OUT)
  ? readdirSync(OUT).filter((f) => f.endsWith('.webm')).map((f) => f.replace('.webm', ''))
  : [];
mkdirSync(resolve(HERE, '../src'), { recursive: true });
writeFileSync(resolve(HERE, '../src/tutorials.json'), JSON.stringify(have.sort(), null, 2));
console.log(`tutorials index: ${have.length} videos`);
