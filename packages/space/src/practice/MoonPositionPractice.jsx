import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { angularError, phaseForAngle, targetAngle } from '../gates/phaseLock.js';
import { litPath } from '../scenes/geometry.js';

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 92;
// The orbit is drawn as an ellipse tilted away from us; y is compressed by this
// factor. The inverse (pointer → angle) mapping un-compresses y by the same factor
// so a drag lands exactly where the Moon is drawn — otherwise the top/bottom
// (the quarters) become impossible to hit precisely.
const SQUISH = 0.72;
const MOON_R = 19;
const START_ANGLE = 35;

function clampAngle(n) {
  return ((n % 360) + 360) % 360;
}

// easeInOutQuad — smooth start/stop for the auto-solve demo glide.
function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

// Screen position of the Moon for a phase angle (phaseLock convention: 0=new,
// 180=full). Sun is drawn on the left, so new moon (0) sits left of Earth.
function moonPoint(phaseAngle) {
  const rad = ((phaseAngle - 180) * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * R, y: CY + Math.sin(rad) * R * SQUISH };
}

function phaseAngleFromPoint(clientX, clientY, svg) {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * SIZE;
  const y = ((clientY - rect.top) / rect.height) * SIZE;
  // Un-squish y before atan2 so the ellipse maps back to true orbital angle.
  const screenDeg = (Math.atan2((y - CY) / SQUISH, x - CX) * 180) / Math.PI;
  return clampAngle(screenDeg + 180);
}

/** From-Earth phase disc (dark globe + lit region) centred at (cx,cy). */
function PhaseGlobe({ angle, cx, cy, r, lit = '#ece7d6', dark = '#0a0c15', litOpacity = 1, stroke, strokeOpacity = 1, strokeWidth = 2 }) {
  const d = litPath(angle, r, cx, cy);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={dark} />
      {d && <path d={d} fill={lit} fillOpacity={litOpacity} />}
      {stroke && <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={strokeWidth} />}
    </g>
  );
}

export default function MoonPositionPractice({ step, onCorrect, demo = false }) {
  const reduce = useReducedMotion();
  const svgRef = useRef(null);
  const doneRef = useRef(false);
  const [angle, setAngle] = useState(START_ANGLE);
  const targetPhase = step?.target?.phase ?? 'full';
  const tolerance = step?.target?.toleranceDeg ?? 16;
  const target = targetAngle(targetPhase);
  const err = angularError(angle, target);
  const current = phaseForAngle(angle);
  const moon = moonPoint(angle);
  const targetPoint = moonPoint(target);
  const close = err <= tolerance;

  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    // Snap the Moon exactly onto the target so it visibly lands inside the ring,
    // instead of completing while still a tolerance-width away.
    setAngle(target);
    const t = setTimeout(() => onCorrect?.(), 550);
    return () => clearTimeout(t);
  }, [close, onCorrect, target]);

  // Demo mode ("Watch Luna solve it"): glide the Moon from its start to the
  // target so the recorder can capture Luna solving. The `close` effect above
  // then snaps it into the ring and fires onCorrect, exactly as a real drag.
  useEffect(() => {
    if (!demo || doneRef.current) return;
    let delta = ((target - START_ANGLE + 540) % 360) - 180; // shortest way round
    const DURATION = 3400;
    const startAt = performance.now() + 900; // let Luna read the prompt first
    let raf;
    const tick = (now) => {
      if (doneRef.current) return;
      const p = Math.min(1, Math.max(0, (now - startAt) / DURATION));
      setAngle(clampAngle(START_ANGLE + delta * easeInOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [demo, target]);

  const updateFromPointer = (e) => {
    if (doneRef.current || !svgRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setAngle(phaseAngleFromPoint(e.clientX, e.clientY, svgRef.current));
  };

  const nudge = (delta) => {
    if (doneRef.current) return;
    setAngle((a) => clampAngle(a + delta));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[340px] rounded-[28px] border border-cyan-300/15 bg-slate-950/40 p-3 shadow-2xl shadow-cyan-950/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block w-full touch-none select-none"
          role="img"
          aria-label={`Moon phase practice. Current phase: ${current.label}. Target: ${targetPhase}.`}
          onPointerDown={updateFromPointer}
          onPointerMove={(e) => { if (e.buttons) updateFromPointer(e); }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-5); }
            if (e.key === 'ArrowRight') { e.preventDefault(); nudge(5); }
            if (e.key === 'ArrowUp') { e.preventDefault(); nudge(-15); }
            if (e.key === 'ArrowDown') { e.preventDefault(); nudge(15); }
          }}
        >
          <defs>
            <radialGradient id="practice-earth" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#d8fff1" />
              <stop offset="35%" stopColor="#37b8e8" />
              <stop offset="62%" stopColor="#168358" />
              <stop offset="100%" stopColor="#051932" />
            </radialGradient>
            <filter id="practice-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="moon-soft-glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Sun and light */}
          <circle cx="34" cy={CY} r="22" fill="#facc15" filter="url(#practice-glow)" />
          <text x="34" y={CY + 43} textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="800">SUN</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="58" x2="112" y1={CY - 30 + i * 20} y2={CY - 30 + i * 20} stroke="#fde68a" strokeOpacity="0.42" strokeWidth="3" strokeLinecap="round" />
          ))}

          {/* Orbit path */}
          <ellipse cx={CX} cy={CY} rx={R} ry={R * SQUISH} fill="none" stroke="#67e8f9" strokeOpacity="0.24" strokeWidth="2" strokeDasharray="5 7" />

          {/* Target ghost: dashed ring + the phase shape the child is aiming for */}
          <circle cx={targetPoint.x} cy={targetPoint.y} r={MOON_R + 5} fill="none" stroke="#22d3ee" strokeOpacity={close ? 0.9 : 0.5} strokeWidth="3" strokeDasharray="4 4" />
          <PhaseGlobe angle={target} cx={targetPoint.x} cy={targetPoint.y} r={MOON_R} lit="#67e8f9" dark="rgba(8,14,26,0.55)" litOpacity={0.28} />
          <text x={targetPoint.x} y={targetPoint.y - MOON_R - 12} textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="900">TARGET</text>

          {/* Earth */}
          <circle cx={CX} cy={CY} r="31" fill="url(#practice-earth)" filter="url(#practice-glow)" />
          <text x={CX} y={CY + 51} textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="800">EARTH</text>

          {/* Draggable Moon — shows the phase as seen from Earth, updating as it moves */}
          <motion.g
            animate={reduce ? false : { scale: close ? [1, 1.16, 1] : 1 }}
            transition={{ repeat: close ? Infinity : 0, duration: 0.7 }}
            style={{ cursor: doneRef.current ? 'default' : 'grab' }}
            filter="url(#moon-soft-glow)"
          >
            <PhaseGlobe angle={angle} cx={moon.x} cy={moon.y} r={MOON_R} stroke={close ? '#34d399' : '#e2e8f0'} strokeOpacity={0.9} strokeWidth={3} />
          </motion.g>
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-extrabold text-cyan-200">Current: {current.label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          Drag the Moon around Earth — watch its lit face change. Keyboard: arrow keys nudge it.
        </p>
      </div>
    </div>
  );
}
