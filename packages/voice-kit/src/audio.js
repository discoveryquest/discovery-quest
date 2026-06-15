// Narration playback queue — shared by every quest app (quest, map, onboarding
// screens all speak through it). Pre-generated MP3s live in
// public/voice/<voice>/ (each app generates its own with its gen-voice script).
//
// Content-agnostic: the active voice folder is set by the app via
// setActiveVoice(); the actual lines/fragments live in the app, not here.
//
// Lines have two priorities:
//   important — milestones (greetings, solved, rank-up, station intros).
//               They never cut each other off; the newest waits in a FIFO.
//   reactive  — quick feedback (praise, oops, chat). They may replace each
//               other, but politely skip while anything important speaks
//               (the chime SFX already gave instant feedback).

import { loadSave } from '@discoveryquest/engine/save';

// Which /voice/<folder>/ to pull clips from. Apps call setActiveVoice() at
// startup; defaults keep a single-voice app working with no setup.
let activeVoice = 'jessica';
export function setActiveVoice(v) {
  if (v) activeVoice = v;
}

const audioCache = {};
function getAudio(key) {
  let a = audioCache[key];
  if (!a) {
    a = new Audio(`/voice/${activeVoice}/${key}.mp3`);
    a.preload = 'auto';
    audioCache[key] = a;
  }
  return a;
}

// master switch, persisted in the save; lazily read on first use
let soundEnabled = null;
const soundOn = () => (soundEnabled ?? (soundEnabled = loadSave().settings.sound));
export function setSoundEnabled(v) {
  soundEnabled = v;
  if (!v) hushAll();
}
export const isSoundOn = () => soundOn();

// An "utterance" is a sequence of clips played back to back — a single
// pre-recorded sentence, or stitched fragments like
// [w-whatis, n-8, w-plus, n-3] → "What is 8 plus 3".
let utterance = null; // { token, important }
let queuedSeqs = []; // FIFO of important utterances awaiting their turn
const MAX_QUEUED = 2; // cap the backlog so stale milestones never pile up
let pendingSeq = null; // utterance blocked by the autoplay policy
let utteranceToken = 0;
let playingAudio = null; // the clip currently playing, for duration-aware callers
const voiceBusy = () => utterance !== null;
export const isSpeaking = voiceBusy;
// Duration (seconds) of the clip playing right now, once its metadata has loaded;
// null when silent or not yet known. Lets the lesson engine advance a beat off the
// clip's real length (with `ended` as the precise early-out) instead of a flat cap.
export const currentClipDuration = () =>
  playingAudio && !Number.isNaN(playingAudio.duration) && playingAudio.duration > 0
    ? playingAudio.duration
    : null;

const clipDone = (a) =>
  new Promise((resolve) => {
    const done = () => {
      a.removeEventListener('ended', done);
      a.removeEventListener('pause', done);
      a.removeEventListener('error', done);
      resolve();
    };
    a.addEventListener('ended', done);
    a.addEventListener('pause', done); // an interrupt pauses us — unblock
    a.addEventListener('error', done);
  });

function stopUtterance() {
  utterance = null;
  playingAudio = null;
  for (const a of Object.values(audioCache)) {
    if (!a.paused) a.pause();
    a.currentTime = 0;
  }
}

async function playSeq(keys, important) {
  const token = ++utteranceToken;
  utterance = { token, important };
  for (let i = 0; i < keys.length; i++) {
    if (utterance?.token !== token) return; // interrupted
    const a = getAudio(keys[i]);
    a.currentTime = 0;
    playingAudio = a;
    try {
      await a.play();
    } catch {
      // autoplay blocked — keep the rest for the first user gesture
      if (utterance?.token === token) { utterance = null; playingAudio = null; }
      pendingSeq = { keys: keys.slice(i), important };
      return;
    }
    await clipDone(a);
    // If we were interrupted while the clip played (e.g. hushAll paused it,
    // which resolves clipDone via the 'pause' event), this utterance is stale:
    // bail out WITHOUT draining the queue. Otherwise a hushed line would
    // resume here and launch the next queued line on top of the new one.
    if (utterance?.token !== token) return;
  }
  utterance = null;
  playingAudio = null;
  if (queuedSeqs.length) {
    const q = queuedSeqs.shift();
    playSeq(q.keys, q.important);
  }
}

export function hushAll() {
  queuedSeqs = [];
  pendingSeq = null;
  stopUtterance();
}

// Read-along (karaoke): play word clips one at a time, calling onWord(i) as each clip
// STARTS so the caller can highlight that word, then onDone() at the end. Returns a
// controller { pause, resume, stop, isPaused }. Self-contained (its own state) and hushes
// the narration queue first so the two never overlap. Used by Story Harbor's reader.
export function playWords(keys, { onWord, onDone } = {}) {
  hushAll();
  let i = 0, paused = false, stopped = false, cur = null;
  function playOne() {
    if (stopped || paused) return;
    if (i >= keys.length) { onDone?.(); return; }
    onWord?.(i);
    const a = getAudio(keys[i]);
    cur = a;
    a.currentTime = 0;
    const onEnd = () => {
      a.removeEventListener('ended', onEnd);
      if (stopped || paused) return;
      i += 1;
      playOne();
    };
    a.addEventListener('ended', onEnd);
    a.play().catch(() => {}); // autoplay may be blocked until a gesture
  }
  if (soundOn()) playOne(); else onDone?.();
  return {
    pause() { if (stopped || paused) return; paused = true; cur?.pause(); },
    resume() { if (stopped || !paused) return; paused = false; if (cur && !cur.ended) cur.play().catch(() => {}); else playOne(); },
    stop() { stopped = true; cur?.pause(); if (cur) cur.currentTime = 0; },
    isPaused: () => paused,
  };
}

// speak: accepts one clip key or a sequence of fragment keys.
// Important lines never interrupt anything — they wait in a FIFO queue.
// Reactive lines replace other reactive lines (fresh feedback beats stale)
// and skip while anything important is speaking or queued.
export function speak(keys, { important = false } = {}) {
  if (!soundOn()) return;
  const seq = Array.isArray(keys) ? keys : [keys];
  if (voiceBusy()) {
    if (important) {
      queuedSeqs.push({ keys: seq, important });
      // Moving fast can queue many milestones at once (e.g. passing several
      // leaderboard rivals after a quick solve). Keep only the most recent so
      // old lines don't lag behind and play over the current action.
      while (queuedSeqs.length > MAX_QUEUED) queuedSeqs.shift();
      return;
    }
    if (utterance.important || queuedSeqs.length) return; // milestones first
    stopUtterance(); // a reactive line may replace a reactive one
  }
  playSeq(seq, important);
}

// Browsers block audio before the first interaction — replay the pending
// line (usually a greeting) on the first tap or keypress.
if (typeof window !== 'undefined') {
  const replay = () => {
    if (pendingSeq && soundOn()) {
      const { keys, important } = pendingSeq;
      pendingSeq = null;
      playSeq(keys, important);
    }
  };
  window.addEventListener('pointerdown', replay);
  window.addEventListener('keydown', replay);
}

// Tiny cute synth chimes (WebAudio, no assets) layered under the voice.
let actx;
export function sfx(kind, { pitch = 1 } = {}) {
  if (!soundOn()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    const tone = (freq, start, dur, type = 'sine', gain = 0.1) => {
      const o = actx.createOscillator();
      const gn = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + start);
      gn.gain.setValueAtTime(0, t + start);
      gn.gain.linearRampToValueAtTime(gain, t + start + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(gn).connect(actx.destination);
      o.start(t + start);
      o.stop(t + start + dur + 0.05);
    };
    if (kind === 'correct') {
      tone(880 * pitch, 0, 0.14); // A5 → E6: a little sparkle
      tone(1318.5 * pitch, 0.09, 0.22);
    } else if (kind === 'wrong') {
      tone(330, 0, 0.16, 'triangle', 0.07); // soft, friendly boop-boop
      tone(262, 0.13, 0.22, 'triangle', 0.07);
    } else if (kind === 'fanfare') {
      tone(523.25 * pitch, 0, 0.1); // C5–G5–C6 rising pop, transposed per world
      tone(783.99 * pitch, 0.08, 0.12);
      tone(1046.5 * pitch, 0.16, 0.26);
    }
  } catch {
    /* audio unavailable — stay silent */
  }
}
