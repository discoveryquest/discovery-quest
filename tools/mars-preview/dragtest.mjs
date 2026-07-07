// Verifies part-dragging: opens the tour, presses on the rover, drags the cursor,
// and screenshots mid-drag (button still down) so a grabbed part visibly follows.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.MARS_URL || 'http://localhost:5173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(resolve('./shots'), { recursive: true });

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
  await page.evaluate(() => window.__mars.openRoverTour());
  await sleep(3200);
  await page.screenshot({ path: resolve('./shots/drag-before.png') });

  // Rover is tiny at 16 m — scan a grid to find a pixel that grabs a part.
  let hit = null;
  for (let y = 385; y <= 440 && !hit; y += 6) {
    for (let x = 650; x <= 745 && !hit; x += 6) {
      await page.evaluate(() => window.__mars.setRoverPartIndex(-1));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await sleep(20);
      const i = await page.evaluate(() => window.__mars.getState().roverPartIndex);
      await page.mouse.up();
      if (i >= 0) hit = { x, y, i };
    }
  }
  if (!hit) { console.log('no grab point found on the rover'); }
  else {
    console.log('grab point', hit.x, hit.y, '→ part', hit.i);
    await page.mouse.move(hit.x, hit.y);
    await page.mouse.down();
    for (const [dx, dy] of [[-30, -30], [-90, -80], [-170, -140], [-230, -180]]) {
      await page.mouse.move(hit.x + dx, hit.y + dy);
      await sleep(60);
    }
    await sleep(200);
  }
  await page.screenshot({ path: resolve('./shots/drag-during.png') });
  await page.mouse.up();
} finally {
  await browser.close();
}
