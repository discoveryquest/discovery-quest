// "What will we learn?" course trailer — a full-screen cinematic tour of Space
// Quest (Pavel 2026-07-05). Auto-plays a beat per world on the real 3D bodies
// kit: Luna hovers and (once baked) narrates what the course teaches. Opened via
// ?trailer=1 (the landing-site course card deep-links here); Skip / Start exit
// into the normal app. Captions are the script; Jessica narration is baked to
// the same `say` keys in a later pass.
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LunaOwl, useLivelyMood } from '@discoveryquest/engine-ui/LunaOwl';
import { speak, hushAll, isSpeaking, currentClipDuration } from '@discoveryquest/voice-kit/audio';
import { OrbitContent3D, FieldContent3D, LaunchContent3D } from './scenes/3d/content3d.jsx';

const SUN = { id: 'sun', role: 'star' };
const BEATS = [
  {
    id: 'tr-intro', world: 'Space Quest',
    caption: "Welcome to Space Quest! Let's peek at everything we're going to explore.",
    scene: () => <FieldContent3D tint="deep-space" density="high" />,
  },
  {
    id: 'tr-w1', world: 'The Backyard Sky',
    caption: "First, right in our backyard sky — the Moon's phases, day and night, the seasons, and gravity.",
    scene: () => <OrbitContent3D camera={{ position: [0, 3.6, 13], fov: 44 }} bodies={[SUN,
      { id: 'earth', role: 'planet', color: 'earth', orbits: 'sun', radius: 118, period: 10 },
      { id: 'moon', role: 'moon', color: 'moon', orbits: 'earth', radius: 30, period: 3 }]} />,
  },
  {
    id: 'tr-w2', world: 'Cosmic Neighborhood',
    caption: 'Next door, our Cosmic Neighborhood — the planets, their moons and rings, and asteroids and comets.',
    scene: () => <OrbitContent3D camera={{ position: [0, 5.5, 18], fov: 46 }} bodies={[SUN,
      { id: 'mercury', role: 'moon', color: 'mercury', orbits: 'sun', radius: 48, period: 4 },
      { id: 'venus', role: 'planet', color: 'venus', orbits: 'sun', radius: 66, period: 5 },
      { id: 'earth', role: 'planet', color: 'earth', orbits: 'sun', radius: 84, period: 6 },
      { id: 'mars', role: 'moon', color: 'mars', orbits: 'sun', radius: 102, period: 7 },
      { id: 'jupiter', role: 'planet', color: 'jupiter', orbits: 'sun', radius: 128, period: 9 },
      { id: 'saturn', role: 'planet', color: 'saturn', rings: true, orbits: 'sun', radius: 154, period: 12 }]} />,
  },
  {
    id: 'tr-w3', world: 'Deep Space',
    caption: 'Way out in Deep Space — constellations, how stars are born and die, glowing nebulae, giant galaxies, and black holes.',
    scene: () => <FieldContent3D tint="nebula" density="high" />,
  },
  {
    id: 'tr-w4', world: 'The Human Element',
    caption: 'And us! Rockets, satellites, spacewalks, the space station, and one day — living on Mars.',
    scene: () => <LaunchContent3D payload="🛰️" camera={{ position: [0, 0.5, 15], fov: 42 }} scale={0.85} />,
  },
  {
    id: 'tr-cta', world: 'Ready?',
    caption: "Ready to become a Space Hero? Let's blast off!",
    scene: () => <OrbitContent3D bodies={[
      { id: 'earth', role: 'planet', color: 'earth' },
      { id: 'moon', role: 'moon', color: 'moon', orbits: 'earth', radius: 58, period: 6 }]} />,
    cta: true,
  },
];

export default function Trailer({ onClose }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const mood = useLivelyMood('cheer');
  // Trailers need a tap to begin: browsers block audio until a gesture happens
  // in THIS page, and visitors arrive via the landing-card link (no gesture
  // here). The Play button's tap unlocks audio for the rest of the session, so
  // Luna's narration actually plays — then the beats auto-advance.
  const [started, setStarted] = useState(false);
  const beat = BEATS[i];
  const last = i === BEATS.length - 1;

  // narrate each beat (Jessica clips baked to these say-keys) once we've started
  useEffect(() => { if (started) speak(beat.id, { important: true }); }, [i, beat.id, started]);
  useEffect(() => () => hushAll(), []);

  // Advance when the narration ENDS (or, if silent, after a comfortable reading
  // beat). Mirrors LessonScreen so long clips are never cut off. The CTA (last)
  // waits for the Start button; nothing advances before the tour begins.
  useEffect(() => {
    if (!started || paused || last) return undefined;
    const startedAt = Date.now();
    const MIN = 5000;      // min on-screen time so silent beats still read
    const HARD_MAX = 16000; // safety net if a clip never resolves
    let advanceT;
    const poll = setInterval(() => {
      const el = Date.now() - startedAt;
      const durMs = (currentClipDuration() || 0) * 1000;
      const byDuration = durMs > 0 && el >= durMs + 600;
      const ready = el > MIN && (!isSpeaking() || byDuration);
      if (ready || el > HARD_MAX) {
        clearInterval(poll);
        advanceT = setTimeout(() => setI((n) => Math.min(n + 1, BEATS.length - 1)), 300);
      }
    }, 150);
    return () => { clearInterval(poll); clearTimeout(advanceT); };
  }, [i, paused, last]);

  const exit = () => { hushAll(); onClose?.(); };
  // The Play tap gives the page sticky activation (audio unlocked for its
  // lifetime); the narrate effect then plays beat 0 — no double-speak.
  const begin = () => setStarted(true);

  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-hidden font-display text-white"
      style={{ background: 'radial-gradient(120% 90% at 50% -10%, #1b2550 0%, rgba(27,37,80,0) 55%), linear-gradient(180deg, #0b1026 0%, #05060f 100%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* the 3D scene for this beat, full-bleed */}
      <AnimatePresence mode="wait">
        <motion.div key={beat.id} className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}>
          {beat.scene()}
        </motion.div>
      </AnimatePresence>

      {/* start gate — a tap here unlocks audio so Luna's voice plays */}
      <AnimatePresence>
        {!started && (
          <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/45 px-6 text-center backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-amber-300">Space Quest</p>
            <h2 className="max-w-md text-3xl font-extrabold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">What will we learn?</h2>
            <button type="button" onClick={begin}
              className="flex items-center gap-3 rounded-2xl bg-cyan-400 px-8 py-4 text-lg font-extrabold text-slate-900 shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-transform hover:scale-105">
              <span className="text-xl leading-none">▶</span> Play the tour
            </button>
            <p className="text-xs font-bold text-slate-300/80">A quick tour with Luna · sound on 🔊</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* skip (stays above the start gate) */}
      <button type="button" onClick={exit}
        className="absolute right-4 top-4 z-40 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-bold text-slate-200 backdrop-blur-sm transition-colors hover:bg-black/60">
        Skip ✕
      </button>

      {/* world title */}
      <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.p key={beat.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-amber-300">What we'll explore</motion.p>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.h2 key={beat.world} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1 text-2xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-3xl">{beat.world}</motion.h2>
        </AnimatePresence>
      </div>

      {/* Luna, drifting across the sky per beat */}
      <motion.div className="pointer-events-none absolute z-10 scale-90"
        animate={{ left: `${12 + (i % 3) * 30}%`, top: `${58 + (i % 2) * 8}%` }}
        transition={{ type: 'spring', stiffness: 40, damping: 14 }}>
        <LunaOwl mood={mood} talking={!paused} />
      </motion.div>

      {/* caption + controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 pb-7 pt-16">
        <AnimatePresence mode="wait">
          <motion.p key={beat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-xl text-center text-base font-bold leading-snug text-slate-100 sm:text-lg">{beat.caption}</motion.p>
        </AnimatePresence>

        {/* progress dots — one per beat, filled up to the current one */}
        <div className="flex w-full max-w-xs gap-1.5">
          {BEATS.map((b, k) => (
            <span key={b.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span className="block h-full rounded-full bg-cyan-300"
                initial={false} animate={{ width: k <= i ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
            </span>
          ))}
        </div>

        {last ? (
          <button type="button" onClick={exit}
            className="mt-1 rounded-2xl bg-cyan-400 px-8 py-3 text-lg font-extrabold text-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-colors hover:bg-cyan-300">
            Start exploring 🚀
          </button>
        ) : (
          <button type="button" onClick={() => setPaused((p) => !p)}
            className="text-xs font-bold text-slate-400 hover:text-slate-200">{paused ? '▶ Play' : '⏸ Pause'}</button>
        )}
      </div>
    </motion.div>
  );
}
