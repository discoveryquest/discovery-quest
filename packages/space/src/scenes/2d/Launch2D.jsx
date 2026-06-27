// Launch2D — a rocket rising with animated thrust plume + parallax star streaks.
// payload: optional emoji to show inside rocket (e.g. 🛰️). Reduced-motion: mid-flight static.
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Emoji from '@discoveryquest/engine-ui/Emoji';
import { SpaceStage } from './base.jsx';

const STREAK_COUNT = 14;

export default function Launch2D({ payload }) {
  const reduce = useReducedMotion();

  const streaks = useMemo(
    () =>
      Array.from({ length: STREAK_COUNT }, () => ({
        left: 5 + Math.random() * 90,
        top: 5 + Math.random() * 80,
        len: 14 + Math.random() * 28,
        opacity: 0.15 + Math.random() * 0.35,
        dur: 0.4 + Math.random() * 0.5,
        delay: Math.random() * 0.8,
      })),
    [],
  );

  return (
    <SpaceStage>
      <div className="relative h-full w-full overflow-hidden">
        {/* Parallax star streaks (speed lines) */}
        {!reduce &&
          streaks.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: 1.5,
                height: s.len,
                opacity: s.opacity,
              }}
              animate={{ y: [0, 60], opacity: [s.opacity, 0] }}
              transition={{ repeat: Infinity, duration: s.dur, delay: s.delay, ease: 'linear' }}
            />
          ))}

        {/* Static streaks for reduced motion */}
        {reduce &&
          streaks.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: 1,
                height: s.len * 0.5,
                opacity: s.opacity * 0.5,
              }}
            />
          ))}

        {/* Rocket */}
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 4,
          }}
          // Reduced motion: static mid-flight frame (initial === animate, zero-duration).
          initial={{ y: reduce ? '-30%' : '110%' }}
          animate={reduce ? { y: '-30%' } : { y: ['110%', '-30%'] }}
          transition={
            reduce
              ? { duration: 0 }
              : { repeat: Infinity, duration: 2.8, ease: 'easeIn', repeatDelay: 0.4 }
          }
        >
          {/* Thrust plume */}
          {!reduce && (
            <motion.div
              style={{
                width: 18,
                height: 38,
                borderRadius: '0 0 50% 50%',
                background:
                  'radial-gradient(ellipse at 50% 0%, #ffec80 0%, #ff8c00 40%, #ff3000 70%, transparent 100%)',
                marginTop: -4,
                order: 1,
              }}
              animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], scaleX: [1, 0.85, 1.1, 0.9, 1] }}
              transition={{ repeat: Infinity, duration: 0.18, ease: 'linear' }}
            />
          )}

          {/* Rocket body */}
          <div
            style={{
              fontSize: 48,
              lineHeight: 1,
              order: 0,
              filter: 'drop-shadow(0 0 12px rgba(255,160,30,0.6))',
            }}
          >
            <Emoji char="🚀" />
          </div>

          {/* Payload indicator */}
          {payload && (
            <div style={{ fontSize: 20, lineHeight: 1, order: -1, marginBottom: 2 }}>
              <Emoji char={payload} />
            </div>
          )}
        </motion.div>
      </div>
    </SpaceStage>
  );
}
