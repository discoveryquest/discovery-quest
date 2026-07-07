// Reproduce the real player flow: walk Luna to the rover, then press E, and
// screenshot — to see the close-up first-person explosion the user sees.
import { resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.MARS_URL || 'http://localhost:5173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('CRASH:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon/.test(m.text())) console.log('CONSOLE ERR:', m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(4500);

  // Walk toward the rover (spawn faces -z; rover is +x,-z → hold W+D).
  await page.keyboard.down('w');
  await page.keyboard.down('d');
  for (let i = 0; i < 12; i++) {
    await sleep(200);
    const d = await page.evaluate(() => {
      const t = window.__mars.getState();
      return null; // distance not in store; read telemetry via dev if present
    });
  }
  await page.keyboard.up('w');
  await page.keyboard.up('d');
  await sleep(400);

  const before = await page.evaluate(() => window.__mars.getState().roverTour);
  await page.keyboard.press('e');
  await sleep(3400);
  const after = await page.evaluate(() => window.__mars.getState().roverTour);
  console.log('tour before E:', before, ' after E:', after);
  await page.screenshot({ path: resolve('./shots/walk-explode.png') });
} finally {
  await browser.close();
}
