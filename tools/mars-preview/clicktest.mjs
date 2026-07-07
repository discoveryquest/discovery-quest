// Verifies (a) real 3D click-picking selects a part, and (b) closing the tour
// reassembles the rover (factor → 0, phase → closed). Prints state transitions.
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
  page.on('pageerror', (e) => console.log('PAGE CRASH:', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(4500);

  await page.evaluate(() => window.__mars.openRoverTour());
  await sleep(3400); // let it explode
  console.log('after open:', await page.evaluate(() => window.__mars.getState().roverPartIndex), '(expect -1)');

  // Click near the center mass (the chassis/body cluster) — should pick a part.
  await page.mouse.click(700, 400);
  await sleep(400);
  const picked = await page.evaluate(() => window.__mars.getState().roverPartIndex);
  console.log('after click @700,400:', picked, picked >= 0 ? 'PICK OK' : 'no hit — trying body');
  if (picked < 0) { await page.mouse.click(720, 380); await sleep(400); }
  const picked2 = await page.evaluate(() => window.__mars.getState().roverPartIndex);
  console.log('final picked index:', picked2);

  // Close and confirm reassembly completes (phase back to closed).
  await page.evaluate(() => window.__mars.closeRoverTour());
  await sleep(3000);
  const phase = await page.evaluate(() => window.__mars.getState().roverTour);
  console.log('after close:', phase, phase === 'closed' ? 'REASSEMBLED OK' : 'still animating');
} finally {
  await browser.close();
}
