// The companion character — an animated owl (Luna) shared across the quest,
// map, and onboarding screens. Presentational + content-agnostic: `mood` drives
// her pose/antics, `talking` chatters her beak in time with the voice.
//
//   <LunaOwl mood={useLivelyMood('idle')} talking={useSpeaking()} />

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { isSpeaking } from '@discoveryquest/voice-kit/audio';

// Sprinkles random idle micro-behaviors over a base mood so she never sits
// frozen: little hops, wing flutters, a nose scratch, peeking around.
const IDLE_ANTICS = ['tilt', 'hop', 'flutter', 'peek', 'scratch'];

export function useLivelyMood(baseMood) {
  const [antic, setAntic] = useState(null);
  useEffect(() => {
    let timeout;
    const interval = setInterval(() => {
      setAntic(IDLE_ANTICS[Math.floor(Math.random() * IDLE_ANTICS.length)]);
      timeout = setTimeout(() => setAntic(null), 1500);
    }, 5500 + Math.random() * 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  return baseMood === 'idle' && antic ? antic : baseMood;
}

// True while the voice is actually speaking — drives the beak so her mouth moves
// in time with it. Polled (the audio queue has no event surface).
export function useSpeaking() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setSpeaking(isSpeaking()), 120);
    return () => clearInterval(id);
  }, []);
  return speaking;
}

export function LunaOwl({ mood, talking = false }) {
  const cheering = mood === 'cheer';
  const hinting = mood === 'hint';
  const bodyAnim = cheering
    ? { y: [0, -18, 0, -10, 0], rotate: [0, -6, 6, -4, 0] }
    : mood === 'hop'
      ? { y: [0, -12, 0, -7, 0], rotate: 0 }
      : mood === 'flutter'
        ? { y: [0, -10, -10, 0], rotate: 0 }
        : mood === 'tilt'
          ? { rotate: [0, 9, 9, -4, 0], y: 0 }
          : { rotate: hinting ? -6 : 0, y: 0 };
  const leftWingAnim = cheering
    ? { rotate: [10, -55, 25, -55, 10] }
    : mood === 'flutter'
      ? { rotate: [10, -35, 10, -35, 10] }
      : mood === 'scratch'
        ? { rotate: [10, -75, -65, -75, 10] } // wing up to the beak
        : { rotate: hinting ? -40 : 10 };
  return (
    <motion.svg
      width="112"
      height="122"
      viewBox="0 0 120 130"
      animate={bodyAnim}
      transition={cheering ? { duration: 0.9 } : { duration: mood === 'idle' ? 0.4 : 1.2 }}
      style={{ filter: 'drop-shadow(0 8px 22px rgba(34,211,238,0.22))' }}
    >
      <defs>
        <radialGradient id="lunaBody" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#3b4370" />
          <stop offset="100%" stopColor="#222741" />
        </radialGradient>
        <radialGradient id="lunaBelly" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#4a527f" />
          <stop offset="100%" stopColor="#343c63" />
        </radialGradient>
      </defs>
      {/* ear tufts */}
      <path d="M30 26 L37 6 L48 24 Z" fill="#2c3254" stroke="#4a5380" strokeWidth="2" />
      <path d="M90 26 L83 6 L72 24 Z" fill="#2c3254" stroke="#4a5380" strokeWidth="2" />
      {/* wings */}
      <motion.g
        style={{ originX: '20px', originY: '62px' }}
        animate={leftWingAnim}
        transition={cheering || mood === 'flutter' || mood === 'scratch' ? { duration: 1.1 } : { duration: 0.4 }}
      >
        <ellipse cx="19" cy="80" rx="13" ry="26" fill="#2c3254" stroke="#4a5380" strokeWidth="2" />
      </motion.g>
      <motion.g
        style={{ originX: '100px', originY: '62px' }}
        animate={cheering ? { rotate: [-10, 55, -25, 55, -10] } : { rotate: -10 }}
        transition={cheering ? { duration: 0.9 } : { duration: 0.4 }}
      >
        <ellipse cx="101" cy="80" rx="13" ry="26" fill="#2c3254" stroke="#4a5380" strokeWidth="2" />
      </motion.g>
      {/* body */}
      <ellipse cx="60" cy="74" rx="40" ry="48" fill="url(#lunaBody)" stroke="#4a5380" strokeWidth="2.5" />
      {/* belly with feather marks */}
      <ellipse cx="60" cy="90" rx="24" ry="27" fill="url(#lunaBelly)" />
      <path d="M48 84 q6 6 12 0 M60 84 q6 6 12 0 M54 96 q6 6 12 0" stroke="#5b6494" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <motion.g
        style={{ originX: '60px', originY: '54px' }}
        animate={{ scaleY: [1, 1, 0.06, 1] }}
        transition={{ repeat: Infinity, duration: 4.6, times: [0, 0.92, 0.96, 1] }}
      >
        {cheering ? (
          <>
            <path d="M34 56 Q44 44 54 56" stroke="#F7F9FF" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M66 56 Q76 44 86 56" stroke="#F7F9FF" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="44" cy="54" r="15" fill="#F7F9FF" />
            <circle cx="76" cy="54" r="15" fill="#F7F9FF" />
            <motion.g animate={mood === 'peek' ? { x: [0, 4.5, 4.5, -4.5, 0] } : { x: 0 }} transition={{ duration: 1.4 }}>
              <circle cx="46" cy="56" r="7.5" fill="#1b1f33" />
              <circle cx="74" cy="56" r="7.5" fill="#1b1f33" />
              {/* starry sparkles */}
              <path d="M46 52.4 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1-2.2 -2.2-1 2.2-1 Z" fill="#FFE066" />
              <path d="M74 52.4 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1-2.2 -2.2-1 2.2-1 Z" fill="#FFE066" />
              <circle cx="43" cy="52" r="2" fill="#fff" opacity="0.9" />
              <circle cx="71" cy="52" r="2" fill="#fff" opacity="0.9" />
            </motion.g>
          </>
        )}
      </motion.g>
      {/* beak — chatters open/closed while she is speaking */}
      <motion.path
        d="M60 64 L51 72 Q60 81 69 72 Z"
        fill="#FFB953"
        stroke="#d98f2b"
        strokeWidth="1.5"
        style={{ originX: '60px', originY: '64px' }}
        animate={talking ? { scaleY: [1, 1.75, 1.1, 1.6, 1] } : { scaleY: 1 }}
        transition={talking ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      />
      {/* blush */}
      <circle cx="32" cy="68" r="5" fill="#F472B6" opacity="0.28" />
      <circle cx="88" cy="68" r="5" fill="#F472B6" opacity="0.28" />
      {/* feet */}
      <ellipse cx="48" cy="121" rx="8" ry="5" fill="#FFB953" />
      <ellipse cx="72" cy="121" rx="8" ry="5" fill="#FFB953" />
    </motion.svg>
  );
}
