// Walk-and-shoot: loads the Mars preview, holds movement/turn keys for a script
// of steps, then screenshots — for verifying things the spawn camera can't see
// (the rover out in the field, a rock bouncing off it, etc.).
//
// Usage: node walkshot.mjs [outPath] [steps]
//   steps = comma list of "key:ms" held sequentially, e.g. "d:1200,w:2600"
//   Movement is camera-relative (w=forward=-z, d=strafe +x). Turn with the
//   pointer via ArrowLeft/ArrowRight is not wired; instead nudge yaw with the
//   mouse is skipped — we just translate. Good enough to reach +x/-z landmarks.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = resolve(process.argv[2] || './shots/walk.png');
const steps = (process.argv[3] || 'd:1400,w:2600').split(',').map((s) => {
  const [key, ms] = s.split(':');
  return { key, ms: Number(ms) };
});
const KEY = { w: 'w', a: 'a', s: 's', d: 'd' };
mkdirSync(dirname(out), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 900, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3500)); // let the scene + glb settle
  for (const { key, ms } of steps) {
    await page.keyboard.down(KEY[key] || key);
    await new Promise((r) => setTimeout(r, ms));
    await page.keyboard.up(KEY[key] || key);
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: out });
  const readout = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log(JSON.stringify({ ok: true, out, errors: errors.slice(0, 6), readout }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
