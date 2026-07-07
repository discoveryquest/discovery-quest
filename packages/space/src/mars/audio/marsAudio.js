// Self-contained WebAudio graph for the /mars POC. Deliberately NOT the shared
// voice-kit engine: (1) the standalone mars-preview harness can't resolve the
// workspace voice-kit package, and (2) we need a caller-modulated gain to swell
// the wind with gusts, which voice-kit intentionally does not expose (see
// decision voice-kit-music-engine — it says run your own gain graph for exactly
// this). /mars is a standalone fullscreen route that never starts the space music
// engine, so there's no double-bed conflict.
//
// Assets (ElevenLabs-generated, see scripts/gen-mars-sfx.mjs):
//   /music/mars-wind.mp3  — 22 s loopable ambient bed
//   /mars/rock-thud.mp3   — one-shot impact
//
// Browsers block audio until a user gesture, so nothing is audible until
// startAmbient() runs from a real pointer/key event (wired in MarsAudio.jsx).

const WIND_URL = '/music/mars-wind.mp3';
const THUD_URL = '/mars/rock-thud.mp3';
const WIND_BASE = 0.34; // gain at dead calm (audible bed, not a whisper)
const WIND_GUST = 0.42; // extra gain at full gust

let ctx = null;
let windBuffer = null;
let thudBuffer = null;
let windGain = null;
let windSource = null;
let masterGain = null;
let enabled = true;
let started = false;

async function load(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`marsAudio: ${url} → ${res.status}`);
  return ctx.decodeAudioData(await res.arrayBuffer());
}

// Create the context + decode buffers once. Called from a user gesture.
async function ensureContext() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // no WebAudio — silently no-op
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = enabled ? 1 : 0;
  masterGain.connect(ctx.destination);
  [windBuffer, thudBuffer] = await Promise.all([
    load(WIND_URL).catch(() => null),
    load(THUD_URL).catch(() => null),
  ]);
}

// Start (or resume) the looping wind bed. Safe to call repeatedly.
export async function startAmbient() {
  try {
    await ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (started || !windBuffer) return;
    windGain = ctx.createGain();
    windGain.gain.value = WIND_BASE;
    windGain.connect(masterGain);
    windSource = ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;
    windSource.connect(windGain);
    windSource.start();
    started = true;
  } catch { /* audio is best-effort */ }
}

// Swell the wind gain with the live gust value (0..1). Called each frame.
export function setWindGain(gust) {
  if (!windGain || !ctx) return;
  const target = WIND_BASE + WIND_GUST * Math.max(0, Math.min(1, gust));
  // setTargetAtTime smooths the change so it doesn't zipper.
  windGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
}

// One-shot rock impact. volume 0..1, pan -1..1 (left..right).
export function playThud(volume = 0.8, pan = 0) {
  if (!ctx || !thudBuffer || !enabled) return;
  const src = ctx.createBufferSource();
  src.buffer = thudBuffer;
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(1, volume));
  let node = g;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    node = p;
  }
  node.connect(masterGain);
  src.connect(g);
  src.start();
}

// Footstep crunch on regolith — synthesized (no sample needed): a short burst of
// band-passed noise with a fast decay. Pitch/level jitter so repeated steps don't
// sound mechanical. Called from the Player's step cadence.
export function playStep(volume = 0.5, pan = 0) {
  if (!ctx || !enabled) return;
  const dur = 0.13;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6); // decaying crunch
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 380 + Math.random() * 240; // gritty, low-mid
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(1, volume));
  let node = g;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    node = p;
  }
  src.connect(bp);
  bp.connect(g);
  node.connect(masterGain);
  src.start();
}

export function setEnabled(on) {
  enabled = on;
  if (masterGain && ctx) masterGain.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05);
}
export function isEnabled() { return enabled; }

// Tear down on route unmount so we don't leak an AudioContext.
export function dispose() {
  try {
    windSource?.stop();
    ctx?.close();
  } catch { /* ignore */ }
  ctx = windBuffer = thudBuffer = windGain = windSource = masterGain = null;
  started = false;
}
