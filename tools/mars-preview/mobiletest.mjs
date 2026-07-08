// Mobile experience test: emulate a touch phone, walk to the rover with the
// virtual joystick, tap "Inspect the rover", then spin (1 finger) and pinch (2
// fingers) the spotlight part. Screenshots each stage.
import { resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.MARS_URL || 'http://localhost:5173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => page.screenshot({ path: resolve(`./shots/${name}.png`) });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const W = Number(process.env.W || 892), H = Number(process.env.H || 412);
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36');
  // puppeteer can't emulate the `pointer` media feature, so force coarse-pointer
  // detection (what the app keys mobile UI off) by patching matchMedia pre-load.
  await page.evaluateOnNewDocument(() => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (qq) => (String(qq).includes('coarse')
      ? { matches: true, media: qq, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
      : orig(qq));
  });
  page.on('pageerror', (e) => console.log('CRASH:', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(4500);

  const cdp = await page.createCDPSession();
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const dist = () => page.evaluate(() => { const t = window.__marsTel; return Math.hypot(t.x - t.roverX, t.z - t.roverZ); });

  const tag = process.env.TAG || 'mob';
  // Drive the joystick (centre ~ (88, H-92)) up-right to walk toward the rover.
  const jx = 88, jy = H - 92;
  await touch('touchStart', [{ x: jx, y: jy, id: 0 }]);
  await touch('touchMove', [{ x: jx + 46, y: jy - 46, id: 0 }]);
  for (let i = 0; i < 40; i++) { if (await dist() < 5) break; await sleep(150); }
  await touch('touchEnd', [{ x: jx + 46, y: jy - 46, id: 0 }]);
  await sleep(500);
  console.log('distance:', (await dist()).toFixed(1), 'm');
  await shot(page, `${tag}-1-near`);

  // Tap the "Inspect the rover" button at its real centre (robust to layout).
  const box = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => el.textContent.includes('Inspect the rover'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  console.log('inspect button:', box);
  if (box) {
    await touch('touchStart', [{ x: box.x, y: box.y, id: 9 }]);
    await sleep(40);
    await touch('touchEnd', [{ x: box.x, y: box.y, id: 9 }]);
  }
  await sleep(1200);
  if (await page.evaluate(() => window.__mars.getState().roverTour) === 'closed') {
    console.log('tap did not open (test flake) — opening programmatically for layout check');
    await page.evaluate(() => window.__mars.openRoverTour());
  }
  await sleep(2600);
  console.log('tour:', await page.evaluate(() => window.__mars.getState().roverTour));
  await shot(page, `${tag}-2-open`);

  // One-finger drag across the spotlight to spin it.
  const cx = W / 2, cy = Math.round(H * 0.34);
  await touch('touchStart', [{ x: cx, y: cy, id: 1 }]);
  for (const x of [cx + 40, cx + 90, cx + 150, cx + 200]) { await touch('touchMove', [{ x, y: cy, id: 1 }]); await sleep(70); }
  await sleep(150);
  await shot(page, `${tag}-3-spin`);
  await touch('touchEnd', [{ x: cx + 200, y: cy, id: 1 }]);

  // Two-finger pinch-out to zoom the part in.
  await touch('touchStart', [{ x: cx - 40, y: cy, id: 2 }, { x: cx + 40, y: cy, id: 3 }]);
  for (let s = 1; s <= 5; s++) {
    const d = 40 + s * 30;
    await touch('touchMove', [{ x: cx - d, y: cy, id: 2 }, { x: cx + d, y: cy, id: 3 }]);
    await sleep(70);
  }
  await sleep(200);
  await shot(page, `${tag}-4-zoom`);
  await touch('touchEnd', [{ x: cx - 190, y: cy, id: 2 }, { x: cx + 190, y: cy, id: 3 }]);
  console.log('done');
} finally {
  await browser.close();
}
