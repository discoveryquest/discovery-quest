import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { angularError, phaseForAngle, targetAngle } from '../gates/phaseLock.js';
import { litFraction, litPath } from '../scenes/geometry.js';
import { SvgEmoji } from '../scenes/2d/base.jsx';

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

/** From-Earth phase disc (dark globe + lit region) centred at (cx,cy). Used for
 * the small "YOU SEE" / "GOAL" insets — the phase an observer on Earth sees. */
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

const SUN = { x: 34, y: CY };

/**
 * The draggable Moon on its orbit. It morphs through the phases as it moves
 * (illuminated fraction grows new→full) AND its bright limb points at the Sun:
 *   • fraction f = (1−cos θ)/2 — thin sliver near the Sun, full disc opposite it.
 *   • drawn as litPath's "waxing" (lit-right) form for that fraction, then rotated
 *     so the lit limb aims at the Sun direction. So it both changes shape and
 *     stays physically lit from the Sun. (The from-Earth view is the YOU SEE inset.)
 */
function PhasedMoon({ angle, cx, cy, r, close }) {
  const waxForm = angle <= 180 ? angle : 360 - angle; // lit-right form, same fraction
  const d = litPath(waxForm, r, cx, cy);
  const phiDeg = (Math.atan2(SUN.y - cy, SUN.x - cx) * 180) / Math.PI; // Moon → Sun
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0b0d16" />
      {d && (
        <g transform={`rotate(${phiDeg.toFixed(2)} ${cx} ${cy})`}>
          <path d={d} fill="url(#practice-moonlit)" />
        </g>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={close ? '#34d399' : '#e2e8f0'} strokeOpacity={0.9} strokeWidth={close ? 3 : 2} />
    </g>
  );
}

export default function MoonPositionPractice({ step, onCorrect, demo = false }) {
  const reduce = useReducedMotion();
  const svgRef = useRef(null);
  const doneRef = useRef(false);
  const draggingRef = useRef(false);
  const [angle, setAngle] = useState(START_ANGLE);
  const targetPhase = step?.target?.phase ?? 'full';
  const tolerance = step?.target?.toleranceDeg ?? 16;
  const target = targetAngle(targetPhase);
  const err = angularError(angle, target);
  const current = phaseForAngle(angle);
  const moon = moonPoint(angle);
  const targetPoint = moonPoint(target);
  const close = err <= tolerance;

  // Latest onCorrect without making it an effect dep: the parent recreates it on
  // every render (Luna's talking flips re-render PracticeScreen), and as a dep the
  // effect cleanup could cancel the pending timer mid-window.
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;
  useEffect(() => {
    if (!close || doneRef.current) return;
    doneRef.current = true;
    // Snap the Moon exactly onto the target so it visibly lands inside the ring,
    // instead of completing while still a tolerance-width away.
    setAngle(target);
    const t = setTimeout(() => onCorrectRef.current?.(), 550);
    return () => clearTimeout(t);
  }, [close, target]);

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
    setAngle(phaseAngleFromPoint(e.clientX, e.clientY, svgRef.current));
  };
  // Track the drag with an explicit ref rather than `e.buttons` — touch pointers
  // report buttons=0 on move, which would freeze the Moon on phones.
  const startDrag = (e) => {
    if (doneRef.current) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateFromPointer(e);
  };
  const endDrag = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
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
          onPointerDown={startDrag}
          onPointerMove={(e) => { if (draggingRef.current) updateFromPointer(e); }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
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
            <radialGradient id="practice-moonlit" cx="42%" cy="38%">
              <stop offset="0%" stopColor="#fbfaf4" />
              <stop offset="60%" stopColor="#dcd7c6" />
              <stop offset="100%" stopColor="#b7b19c" />
            </radialGradient>
          </defs>

          {/* Sun and light */}
          <circle cx="34" cy={CY} r="22" fill="#facc15" filter="url(#practice-glow)" />
          <text x="34" y={CY + 43} textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="800">SUN</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="58" x2="112" y1={CY - 30 + i * 20} y2={CY - 30 + i * 20} stroke="#fde68a" strokeOpacity="0.42" strokeWidth="3" strokeLinecap="round" />
          ))}

          {/* Orbit path */}
          <ellipse cx={CX} cy={CY} rx={R} ry={R * SQUISH} fill="none" stroke="#67e8f9" strokeOpacity="0.24" strokeWidth="2" strokeDasharray="5 7" />

          {/* Target: where on the orbit to drag the Moon */}
          <circle cx={targetPoint.x} cy={targetPoint.y} r={MOON_R + 6} fill="none" stroke="#22d3ee" strokeOpacity={close ? 0.95 : 0.55} strokeWidth="3" strokeDasharray="4 4" />
          <text x={targetPoint.x} y={targetPoint.y - MOON_R - 12} textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="900">TARGET</text>

          {/* Earth */}
          <g filter="url(#practice-glow)"><SvgEmoji x={CX} y={CY} r={31} /></g>
          <text x={CX} y={CY + 51} textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="800">EARTH</text>

          {/* Draggable Moon — morphs through phases; its lit limb faces the Sun */}
          <motion.g
            animate={reduce ? false : { scale: close ? [1, 1.16, 1] : 1 }}
            transition={{ repeat: close ? Infinity : 0, duration: 0.7 }}
            style={{ cursor: doneRef.current ? 'default' : 'grab' }}
            filter="url(#moon-soft-glow)"
          >
            <PhasedMoon angle={angle} cx={moon.x} cy={moon.y} r={MOON_R} close={close} />
          </motion.g>

          {/* From-Earth insets: what YOU SEE now vs the GOAL phase to match */}
          <text x={54} y={18} textAnchor="middle" fill="rgba(148,163,184,0.75)" fontSize="8" fontWeight="800" letterSpacing="0.06em">YOU SEE</text>
          <PhaseGlobe angle={angle} cx={54} cy={46} r={20} stroke="rgba(226,232,240,0.5)" strokeWidth={1} />
          <text x={246} y={18} textAnchor="middle" fill="rgba(103,232,249,0.85)" fontSize="8" fontWeight="800" letterSpacing="0.06em">GOAL</text>
          <PhaseGlobe angle={target} cx={246} cy={46} r={20} lit="#67e8f9" litOpacity={0.9} stroke={close ? '#34d399' : 'rgba(103,232,249,0.6)'} strokeWidth={close ? 2.5 : 1} />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-extrabold text-cyan-200">From Earth you see: {current.label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          Drag the Moon around Earth — its lit half always faces the Sun. Match the GOAL. Keyboard: arrow keys.
        </p>
      </div>
    </div>
  );
}
