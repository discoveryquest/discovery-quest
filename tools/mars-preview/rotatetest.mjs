// Walk up, open the gallery, then drag across the spotlight part (turntable spin)
// and scroll to zoom — screenshotting before/after to confirm inspection works.
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
  const dist = () => page.evaluate(() => { const t = window.__marsTel; return Math.hypot(t.x - t.roverX, t.z - t.roverZ); });
  await page.keyboard.down('w'); await page.keyboard.down('d');
  for (let i = 0; i < 40; i++) { if (await dist() < 5) break; await sleep(150); }
  await page.keyboard.up('w'); await page.keyboard.up('d');
  await sleep(500);
  await page.keyboard.press('e');
  await sleep(3600);
  await page.screenshot({ path: resolve('./shots/rot-before.png') });

  // Turntable drag across the centre spotlight (horizontal → spin around up).
  await page.mouse.move(640, 470);
  await page.mouse.down();
  for (const x of [700, 780, 860, 940]) { await page.mouse.move(x, 470); await sleep(70); }
  await sleep(150);
  await page.screenshot({ path: resolve('./shots/rot-spun.png') });
  await page.mouse.up();

  // Zoom in with the wheel (negative deltaY = closer).
  await page.mouse.move(640, 460);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel({ deltaY: -120 }); await sleep(60); }
  await sleep(300);
  await page.screenshot({ path: resolve('./shots/rot-zoom.png') });
  console.log('done');
} finally {
  await browser.close();
}
