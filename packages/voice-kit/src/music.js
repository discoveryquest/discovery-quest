// Background music engine — per-context loops with automatic ducking under the
// voice. Tracks are optional static files in public/music/; a missing track
// means silence, never an error. Content-agnostic: the app picks WHICH track to
// play (e.g. by world mood) and calls playMusic(name).
//
// State machine: `desired` is the track the current screen wants; reconcile()
// makes reality match it. Because browsers block autoplay until the first
// gesture, reconcile() also runs on the first pointer/key/touch anywhere — so a
// returning player who lands straight on a screen still gets music the moment
// they touch it. `paused` (e.g. tutorial videos) suppresses playback without
// losing the desired track or its position.

import { loadSave } from '@discoveryquest/engine/save';
import { isSpeaking } from './audio.js';

const BASE_VOL = 0.22;
const DUCK_VOL = 0.07;

let musicEnabled = null;
const musicOn = () => (musicEnabled ?? (musicEnabled = loadSave().settings.music !== false));
export const isMusicOn = () => musicOn();

let current = null; // the <audio> element, if any
let currentName = null; // what `current` is playing
let desired = null; // what the current screen wants playing
let paused = false; // explicitly suppressed (e.g. tutorial video)
let ducker = null;

function startTrack(name) {
  if (current) {
    current.pause();
    current.src = '';
  }
  clearInterval(ducker);
  currentName = name;
  const a = new Audio(`/music/${name}.mp3`);
  a.loop = true;
  a.volume = 0;
  current = a;

  // Set up the fade-in + ducker REGARDLESS of whether the initial play() is allowed. If
  // autoplay is blocked, this element still ramps its volume (silently, while paused), so
  // when a later gesture's reconcile() resumes it, it's already audible. (Previously the
  // fade lived inside play().then(), so a blocked start would resume at volume 0 — silent —
  // until a *fresh* startTrack ran, e.g. on returning to a screen.) The `current === a`
  // guards make a track swap cancel these cleanly.
  let v = 0;
  const fade = setInterval(() => {
    if (current !== a) { clearInterval(fade); return; }
    v = Math.min(BASE_VOL, v + 0.02);
    a.volume = v;
    if (v >= BASE_VOL) clearInterval(fade);
  }, 60);
  ducker = setInterval(() => {
    if (current !== a) return;
    const target = isSpeaking() ? DUCK_VOL : BASE_VOL;
    a.volume += (target - a.volume) * 0.3;
  }, 150);

  a.play().catch(() => {
    /* autoplay blocked or missing file — a later gesture's reconcile() resumes this element */
  });
}

// Make playback match intent. Safe to call repeatedly (idempotent).
function reconcile() {
  if (!musicOn() || !desired || paused) return;
  if (currentName === desired && current && !current.paused) return; // already playing
  if (currentName === desired && current && current.paused) {
    current.play().catch(() => {}); // resume same track/position (e.g. after a tutorial)
    return;
  }
  startTrack(desired);
}

export function playMusic(name) {
  desired = name;
  paused = false;
  reconcile();
}

export function pauseMusic() {
  paused = true;
  if (current) current.pause();
}

export function resumeMusic() {
  paused = false;
  reconcile();
}

export function stopMusic() {
  desired = null;
  clearInterval(ducker);
  if (current) {
    current.pause();
    current.src = '';
  }
  current = null;
  currentName = null;
}

export function setMusicEnabled(v) {
  musicEnabled = v;
  if (!v) {
    if (current) current.pause(); // keep `desired` so re-enabling resumes the right track
  } else {
    reconcile();
  }
}

// First user gesture unlocks autoplay; reconcile then starts the desired track.
if (typeof window !== 'undefined') {
  const onGesture = () => reconcile();
  for (const e of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(e, onGesture, { passive: true });
  }
}
