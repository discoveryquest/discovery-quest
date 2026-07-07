// Headless verification of the rover exploded-view tour. Drives window.__mars
// (exposed by the harness main.jsx) to open the tour and optionally select a
// part, waits for the fly-in + explode to settle, then screenshots.
//
// Usage: start dev server, then:
//   node tourshot.mjs [outPath] [partIndex] [settleMs]
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = resolve(process.argv[2] || './shots/tour.png');
const partIndex = process.argv[3] !== undefined ? Number(process.argv[3]) : -1;
const settleMs = Number(process.argv[4] || 3200);
mkdirSync(dirname(out), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });
  page.on('pageerror', (e) => console.log('PAGE CRASH:', e.message));
  await page.goto(process.env.MARS_URL || 'http://localhost:5173/', { waitUntil: 'networkidle0' });
  // Let the scene + GLB load.
  await new Promise((r) => setTimeout(r, 4500));
  await page.evaluate((i) => {
    window.__mars.openRoverTour();
    if (i >= 0) window.__mars.setRoverPartIndex(i);
  }, partIndex);
  await new Promise((r) => setTimeout(r, settleMs));
  await page.screenshot({ path: out });
  console.log('saved', out);
} finally {
  await browser.close();
}
