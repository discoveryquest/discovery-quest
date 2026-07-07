// Walk Luna up to the rover reliably (until within range), press E, optionally
// select a part, and screenshot the close-up hero-centred view.
// Usage: node walkto.mjs [out.png] [partIndex] [settleMs]
import { resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.MARS_URL || 'http://localhost:5173/';
const out = resolve(process.argv[2] || './shots/walkto.png');
const partIndex = process.argv[3] !== undefined ? Number(process.argv[3]) : -1;
const settleMs = Number(process.argv[4] || 3600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('CRASH:', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(4500);

  const dist = () => page.evaluate(() => {
    const t = window.__marsTel;
    return Math.hypot(t.x - t.roverX, t.z - t.roverZ);
  });
  await page.keyboard.down('w'); await page.keyboard.down('d');
  for (let i = 0; i < 40; i++) { const d = await dist(); if (d < 5) break; await sleep(150); }
  await page.keyboard.up('w'); await page.keyboard.up('d');
  await sleep(500);
  console.log('distance at stop:', (await dist()).toFixed(1), 'm');

  await page.keyboard.press('e');
  if (partIndex >= 0) { await sleep(200); await page.evaluate((i) => window.__mars.setRoverPartIndex(i), partIndex); }
  await sleep(settleMs);
  console.log('tour:', await page.evaluate(() => window.__mars.getState().roverTour));
  await page.screenshot({ path: out });
  console.log('saved', out);
} finally {
  await browser.close();
}
