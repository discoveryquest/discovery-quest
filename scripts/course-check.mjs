// course:check — validate a course package (YAML/JSON) against the engine vocabulary +
// the format invariants (see docs/specs/2026-06-13-course-format-design.md). This is the
// gate a contributor runs before opening a PR; CI runs it too.
//
//   node scripts/course-check.mjs <course.yml> --app apps/english-quest
//
// Two layers:
//  • STRUCTURAL (JSON Schema via AJV, from the generated course.schema.json): shape, types,
//    `board`/`view.kind` enums, required + well-typed view props, no typo'd props.
//  • SEMANTIC (here): the cross-reference + filesystem invariants a schema can't express —
//    every beat.say ∈ narration and caption == narration[say]; lesson/content references
//    resolve; every narration line has a generated clip whose baked text still matches.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const appIdx = args.indexOf('--app');
const appDir = appIdx > -1 ? args[appIdx + 1] : null;
// catalog/schema live with the open course library (--app); generated AUDIO lives in the
// private app shell, so it may be elsewhere — `--voice <dir>` points at it (defaults to --app).
const voiceIdx = args.indexOf('--voice');
const voiceBase = voiceIdx > -1 ? args[voiceIdx + 1] : appDir;
if (!file) { console.error('usage: course-check <course.yml> [--app <dir>] [--voice <dir>]'); process.exit(2); }

// supported course-schema versions: this checker understands [MIN..CURRENT] and would
// migrate older ones; a newer file is rejected so it's never silently mis-parsed.
const FORMAT = { current: 1, min: 1 };

const doc = yaml.load(readFileSync(file, 'utf8'));
const course = doc.course || doc;
const errors = [];
const warns = [];
const E = (m) => errors.push(m);
const W = (m) => warns.push(m);

// ── format version (backward-compat gate) ──
const fv = course.formatVersion;
if (fv === undefined) E('course.formatVersion is required');
else if (typeof fv !== 'number') E('course.formatVersion must be an integer');
else if (fv > FORMAT.current) E(`course.formatVersion ${fv} is newer than this tooling supports (${FORMAT.current}) — update the checker`);
else if (fv < FORMAT.min) W(`course.formatVersion ${fv} is old; loader would migrate it to ${FORMAT.current}`);

// ── derive the engine vocabulary from the app (capability source) ──
// Prefer the generated capability manifest (engine.capabilities.json — the source of truth
// for board + view kinds, from `gen-capabilities`). Fall back to parsing the source if it's
// absent, so the checker still works on an older app checkout.
let viewKinds = null, boardKinds = null, contentIds = null, engineVersion = null, voiceDir = null, manifest = null, schema = null;
if (appDir) {
  const read = (p) => { try { return readFileSync(path.join(appDir, p), 'utf8'); } catch { return null; } };
  const sch = read('course.schema.json');
  if (sch) schema = JSON.parse(sch);
  const cap = read('engine.capabilities.json');
  if (cap) {
    const c = JSON.parse(cap);
    // entries are objects ({kind, description, fields, …}); older manifests were bare strings
    const kinds = (a) => new Set((a || []).map((x) => (typeof x === 'string' ? x : x.kind)));
    viewKinds = kinds(c.views);
    boardKinds = kinds(c.boards);
    contentIds = new Set((c.content || []).map((x) => x.id));
    engineVersion = c.version;
  } else {
    const views = read('src/lessons/views.jsx');
    if (views) viewKinds = new Set([...views.matchAll(/case '([a-z0-9-]+)':/g)].map((m) => m[1]));
    const registry = read('src/boardRegistry.js');
    if (registry) {
      const body = registry.match(/export const BOARD_REGISTRY = \{([\s\S]*?)\n\};/);
      // board kinds = the keys of BOARD_REGISTRY (board kind → generator + board)
      if (body) boardKinds = new Set([...body[1].matchAll(/^\s*([a-zA-Z0-9]+):/gm)].map((m) => m[1]));
    }
    W('no engine.capabilities.json — fell back to parsing source (run gen-capabilities)');
  }
  const voiceId = course.voice?.id || 'jessica';
  const vd = voiceBase ? path.join(voiceBase, 'public/voice', voiceId) : null;
  // only check audio if the voice dir actually exists (it lives in the app shell, not the
  // open course library) — otherwise audio is verified app-side and we just note it here.
  if (vd && existsSync(vd)) {
    voiceDir = vd;
    const mf = path.join(voiceDir, 'manifest.json');
    if (existsSync(mf)) manifest = JSON.parse(readFileSync(mf, 'utf8'));
  }
}
const forSpeech = (t) => t.replace(/[⭐🎉]/gu, '').replace(/\s+/g, ' ').trim();

// ── STRUCTURAL: JSON Schema (shape, types, board/view enums, view props) ──
if (schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(doc)) {
    const seen = new Set();
    for (const e of validate.errors) {
      if (e.keyword === 'if') continue; // umbrella for the per-view-kind branches — noise
      const at = e.instancePath || '/course';
      const extra = e.params?.additionalProperty ? `: "${e.params.additionalProperty}"`
        : e.params?.allowedValues ? ` (${e.params.allowedValues.slice(0, 8).join(', ')}${e.params.allowedValues.length > 8 ? '…' : ''})` : '';
      const msg = `schema: ${at} ${e.message}${extra}`;
      if (!seen.has(msg)) { seen.add(msg); E(msg); }
    }
  }
} else if (appDir) {
  W('no course.schema.json — structural checks limited (run course:schema)');
}

// ── structure (kept minimal; the schema owns most of this when present) ──
for (const k of ['id', 'title', 'subject']) if (!course[k]) E(`course.${k} is required`);
if (!Array.isArray(course.worlds) || !course.worlds.length) E('course.worlds must be a non-empty list');
const lessons = course.lessons || {};
const narration = course.narration || {};

// authored content collections: known ones are shape-validated by the schema above; flag any
// the engine doesn't model so a maintainer notices it went unvalidated.
if (contentIds && contentIds.size) {
  for (const k of Object.keys(course.content || {}))
    if (!contentIds.has(k)) W(`content collection "${k}" has no engine schema — not shape-validated`);
}

// ── worlds + stations ──
const stationById = new Map();
for (const w of course.worlds || []) {
  if (!w.id || !w.title) E(`world ${w.id || '?'}: id + title required`);
  for (const st of w.stations || []) {
    if (!st.id || !st.title) { E(`station ${st.id || '?'}: id + title required`); continue; }
    stationById.set(st.id, st);
    if (st.soon) continue;
    if (!schema) { // when no schema, fall back to enum/presence checks here
      if (!st.board) E(`station ${st.id}: playable station needs a board`);
      else if (boardKinds && !boardKinds.has(st.board)) E(`station ${st.id}: board "${st.board}" is not an engine board kind`);
      else if (!boardKinds) W(`station ${st.id}: board "${st.board}" not verified (no engine board registry found)`);
      if (!Array.isArray(st.bands) || !st.bands.length) E(`station ${st.id}: needs bands`);
    }
    if (st.lesson && !lessons[st.lesson]) E(`station ${st.id}: lesson "${st.lesson}" not defined`);
    if (st.content && !(course.content || {})[st.content]) E(`station ${st.id}: content "${st.content}" not defined`);
  }
}

const usedLines = new Set();
let beatCount = 0;

// ── practice content → narration/audio ──
// Space's interactive practice is authored as course data. Like lessons, every shown prompt
// must exactly equal what Luna speaks, and feedback narration keys must resolve/freshen.
const practiceItems = Array.isArray(course.content?.practice) ? course.content.practice : [];
for (const item of practiceItems) {
  const where = `practice/${item.station || '?'}/${item.say || '?'}`;
  const st = item.station ? stationById.get(item.station) : null;
  if (!item.station) E(`${where}: station is required`);
  else if (!st) E(`${where}: station "${item.station}" not found`);
  else if (Array.isArray(st.bands) && !st.bands.includes(item.band)) E(`${where}: band ${item.band} is not assigned to station "${item.station}"`);
  if (!(item.say in narration)) E(`${where}: say "${item.say}" not in narration`);
  else {
    usedLines.add(item.say);
    if (item.prompt !== narration[item.say]) E(`${where}: prompt ≠ narration (shown must equal spoken)`);
  }
  for (const [k, v] of Object.entries(item.feedback || {})) {
    if (!k.endsWith('Say')) continue;
    if (!(v in narration)) E(`${where}: feedback.${k} "${v}" not in narration`);
    else usedLines.add(v);
  }
}

// ── lessons → beats ──
for (const [id, lesson] of Object.entries(lessons)) {
  if (!lesson.title || !Array.isArray(lesson.sections)) { E(`lesson ${id}: title + sections required`); continue; }
  for (const sec of lesson.sections) {
    for (const beat of sec.beats || []) {
      beatCount++;
      const where = `${id}/${sec.id}/${beat.say}`;
      if (!(beat.say in narration)) { E(`${where}: say "${beat.say}" not in narration`); continue; }
      usedLines.add(beat.say);
      if (beat.caption !== narration[beat.say]) E(`${where}: caption ≠ narration (shown must equal spoken)`);
      if (!schema) { // schema owns view.kind validity when present
        if (!beat.view?.kind) E(`${where}: beat has no view.kind`);
        else if (viewKinds && !viewKinds.has(beat.view.kind)) E(`${where}: view.kind "${beat.view.kind}" is not an engine view`);
        else if (!viewKinds) W(`${where}: view.kind "${beat.view?.kind}" not verified (no views source)`);
      }
    }
  }
}

// ── narration → audio (present + fresh) ──
if (voiceDir) {
  for (const key of usedLines) {
    if (!existsSync(path.join(voiceDir, `${key}.mp3`))) E(`audio: ${key}.mp3 missing (run gen-voice)`);
    else if (manifest && manifest[key] !== undefined && manifest[key] !== forSpeech(narration[key])) E(`audio: ${key} is STALE — narration edited but not re-voiced`);
  }
} else W('audio not checked (no voice dir found; pass --voice <app dir with public/voice>)');

// ── report ──
const stations = (course.worlds || []).flatMap((w) => w.stations || []).filter((s) => !s.soon).length;
for (const w of warns) console.warn('  ⚠ ' + w);
if (errors.length) {
  console.error(`\n✗ ${path.basename(file)}: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  • ' + e);
  process.exit(1);
}
const engineTag = engineVersion ? `, engine v${engineVersion}` : '';
const layerTag = schema ? ' [schema+semantic]' : ' [semantic only]';
console.log(`✓ ${path.basename(file)} valid (formatVersion ${fv}${engineTag})${layerTag} — ${course.worlds.length} worlds, ${stations} playable stations, ${Object.keys(lessons).length} lessons, ${beatCount} beats, ${Object.keys(narration).length} narration lines${warns.length ? ` (${warns.length} unverified)` : ''}.`);
