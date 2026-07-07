// Headless screenshot of the running Mars preview — visual verification an agent
// can read back (compilation does NOT catch runtime crashes / blank canvases).
// Reuses the browser machinery record-tutorial.mjs already relies on.
//
// Usage: start the dev server (npm run dev), then:
//   node shot.mjs [url] [outPath] [waitMs]
// Defaults: http://localhost:5173/  ./shots/latest.png  4000
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import puppeteer from '/Users/pavel/dev/discoveryquest/platform/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'http://localhost:5173/';
const out = resolve(process.argv[3] || './shots/latest.png');
const waitMs = Number(process.argv[4] || 4000);
mkdirSync(dirname(out), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 900, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, waitMs)); // let R3F render a few frames
  await page.screenshot({ path: out });
  const hasCanvas = (await page.$('canvas')) !== null;
  // A black image + a PAGEERROR is the signature of a scene that mounted but crashed.
  console.log(JSON.stringify({ ok: true, out, hasCanvas, errors: errors.slice(0, 8) }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
