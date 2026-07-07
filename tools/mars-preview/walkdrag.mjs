// Walk up, explode, grab a part, drag it straight DOWN into the ground — verify
// the clamp keeps it resting on the surface instead of sinking below.
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
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(4500);
  await page.keyboard.down('w'); await page.keyboard.down('d');
  await sleep(2400);
  await page.keyboard.up('w'); await page.keyboard.up('d');
  await sleep(400);
  await page.keyboard.press('e');
  await sleep(3400);

  // Find a grab point over the exploded rover (parts are spread near mid-screen).
  let hit = null;
  for (let y = 340; y <= 500 && !hit; y += 8) {
    for (let x = 480; x <= 820 && !hit; x += 8) {
      await page.evaluate(() => window.__mars.setRoverPartIndex(-1));
      await page.mouse.move(x, y); await page.mouse.down(); await sleep(16);
      const i = await page.evaluate(() => window.__mars.getState().roverPartIndex);
      await page.mouse.up();
      if (i >= 0) hit = { x, y, i };
    }
  }
  if (!hit) { console.log('no grab point found'); }
  else {
    console.log('grabbed part', hit.i, 'at', hit.x, hit.y, '— dragging down into ground');
    await page.mouse.move(hit.x, hit.y); await page.mouse.down();
    for (let k = 1; k <= 6; k++) { await page.mouse.move(hit.x, hit.y + k * 45); await sleep(70); }
    await sleep(200);
    await page.screenshot({ path: resolve('./shots/walk-drag-down.png') });
    await page.mouse.up();
  }
} finally {
  await browser.close();
}
