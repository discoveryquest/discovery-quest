// gen-emoji-assets — bundle ONLY the OpenMoji SVGs a course actually uses. Scans course YAML(s)
// for emoji graphemes, maps each to its OpenMoji filename, and copies the matching SVG into the
// app's public/openmoji/ (served at /openmoji/<codepoint>.svg by the <Emoji> component). Run
// once after editing course emoji and commit the output (like voice clips). Unmatched emoji warn
// (not fail) — <Emoji> falls back to the native glyph at runtime.
//
//   node scripts/gen-emoji-assets.mjs <course.yml> [<course2.yml> …] --out apps/<app>/public/openmoji \
//        [--src node_modules/openmoji/color/svg]
//
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emojiToCodepoints } from '../packages/engine-ui/src/emojiCodepoints.js';

const args = process.argv.slice(2);
const courses = args.filter((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const opt = (name, def) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : def; };
const outDir = opt('--out');
const srcDir = opt('--src', 'node_modules/openmoji/color/svg');
if (!courses.length || !outDir) {
  console.error('usage: gen-emoji-assets <course.yml> [...] --out <dir> [--src <openmoji color/svg dir>]');
  process.exit(1);
}
if (!existsSync(srcDir)) {
  console.error(`OpenMoji source not found at ${srcDir} — add the "openmoji" devDependency or pass --src.`);
  process.exit(1);
}

// collect emoji graphemes from the raw YAML text (covers world emoji, station icons, lesson views).
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
const isEmoji = (g) => [...g].some((c) => /\p{Extended_Pictographic}/u.test(c) || /\p{Regional_Indicator}/u.test(c));
const used = new Map(); // grapheme → codepoint stem
for (const file of courses) {
  const text = readFileSync(file, 'utf8');
  for (const { segment } of seg.segment(text)) {
    if (isEmoji(segment)) { const cp = emojiToCodepoints(segment); if (cp) used.set(segment, cp); }
  }
}

mkdirSync(outDir, { recursive: true });
let copied = 0; const unmatched = [];
for (const [glyph, cp] of used) {
  const src = path.join(srcDir, `${cp}.svg`);
  if (!existsSync(src)) { unmatched.push(`${glyph} (${cp})`); continue; }
  writeFileSync(path.join(outDir, `${cp}.svg`), readFileSync(src));
  copied++;
}

console.log(`gen-emoji-assets: ${used.size} emoji used → ${copied} SVGs copied to ${outDir}`);
if (unmatched.length) console.warn(`  ⚠ ${unmatched.length} unmatched (native fallback): ${unmatched.join(', ')}`);
// prune stale files no longer used, so the bundle stays minimal
const keep = new Set([...used.values()].map((cp) => `${cp}.svg`));
for (const f of readdirSync(outDir)) if (f.endsWith('.svg') && !keep.has(f)) console.log(`  (stale, consider removing: ${f})`);
