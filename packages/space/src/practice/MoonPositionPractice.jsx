import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { angularError, phaseForAngle, targetAngle } from '../gates/phaseLock.js';

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 92;

function clampAngle(n) {
  return ((n % 360) + 360) % 360;
}

function pointForPhaseAngle(phaseAngle) {
  // phaseLock angles: 0=new (Moon between Sun and Earth), 180=full.
  // Screen angles: 0=right. Sun is drawn on the left, so new moon is left.
  const screenDeg = phaseAngle - 180;
  const rad = (screenDeg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * R, y: CY + Math.sin(rad) * R };
}

function phaseAngleFromPoint(clientX, clientY, svg) {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * SIZE;
  const y = ((clientY - rect.top) / rect.height) * SIZE;
  const screenDeg = (Math.atan2(y - CY, x - CX) * 180) / Math.PI;
  return clampAngle(screenDeg + 180);
}

export default function MoonPositionPractice({ step, onCorrect }) {
  const reduce = useReducedMotion();
  const svgRef = useRef(null);
  const doneRef = useRef(false);
  const [angle, setAngle] = useState(35);
  const targetPhase = step?.target?.phase ?? 'full';
  const tolerance = step?.target?.toleranceDeg ?? 16;
  const target = targetAngle(targetPhase);
  const err = angularError(angle, target);
  const current = phaseForAngle(angle);
  const moon = pointForPhaseAngle(angle);
  const targetPoint = pointForPhaseAngle(target);
  const close = err <= tolerance;

  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    const t = setTimeout(() => onCorrect?.(), 450);
    return () => clearTimeout(t);
  }, [close, onCorrect]);

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
          aria-label={`Moon phase practice. Current phase: ${current.label}.`}
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
            <radialGradient id="practice-moon" cx="36%" cy="30%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="42%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>
            <filter id="practice-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Sun and light */}
          <circle cx="34" cy={CY} r="22" fill="#facc15" filter="url(#practice-glow)" />
          <text x="34" y={CY + 43} textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="800">SUN</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="58" x2="112" y1={CY - 30 + i * 20} y2={CY - 30 + i * 20} stroke="#fde68a" strokeOpacity="0.42" strokeWidth="3" strokeLinecap="round" />
          ))}

          {/* Orbit + target ghost */}
          <ellipse cx={CX} cy={CY} rx={R} ry={R * 0.72} fill="none" stroke="#67e8f9" strokeOpacity="0.24" strokeWidth="2" strokeDasharray="5 7" />
          <circle cx={targetPoint.x} cy={CY + (targetPoint.y - CY) * 0.72} r="22" fill="none" stroke="#22d3ee" strokeOpacity="0.52" strokeWidth="3" strokeDasharray="4 4" />
          <text x={targetPoint.x} y={CY + (targetPoint.y - CY) * 0.72 - 30} textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="900">TARGET</text>

          {/* Earth */}
          <circle cx={CX} cy={CY} r="31" fill="url(#practice-earth)" filter="url(#practice-glow)" />
          <text x={CX} y={CY + 51} textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="800">EARTH</text>

          {/* Draggable Moon */}
          <motion.g
            animate={reduce ? false : { scale: close ? [1, 1.16, 1] : 1 }}
            transition={{ repeat: close ? Infinity : 0, duration: 0.7 }}
            style={{ cursor: doneRef.current ? 'default' : 'grab' }}
          >
            <circle cx={moon.x} cy={CY + (moon.y - CY) * 0.72} r="20" fill="url(#practice-moon)" stroke={close ? '#34d399' : '#e2e8f0'} strokeWidth="3" filter="url(#practice-glow)" />
          </motion.g>
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-extrabold text-cyan-200">Current: {current.label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          Drag the Moon around Earth. Keyboard: arrow keys nudge the Moon.
        </p>
      </div>
    </div>
  );
}
