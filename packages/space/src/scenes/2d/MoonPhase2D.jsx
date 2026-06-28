// MoonPhase2D — top-down moon phase teaching diagram.
//
// Layout: Sun (left, warm glow) → parallel light rays → Earth (centre) with Moon
// orbiting on a circle. The Moon's LEFT hemisphere is ALWAYS lit (sun-facing),
// showing the key insight: the Sun always lights half the Moon — only our viewing
// angle from Earth changes. An inset disc (bottom-right) renders what Earth sees.
//
// Modes:
//   interactive=false (default) — Moon auto-orbits ~12 s/cycle via requestAnimationFrame.
//     useReducedMotion → static first-quarter frame (θ=90°).
//   interactive=true — slider drives θ continuously; cardinal phases are spoken via
//     says = { new, first, full, last } narration keys.
//
// Phase-disc geometry (SVG arcs):
//   Waxing (0<θ<180): right-semicircle CW + terminator ellipse back to top.
//     Terminator x-radius = R·|cos θ|, sweep=0 (crescent, θ≤90) or 1 (gibbous, θ>90).
//   Waning (180<θ<360): left-semicircle CCW + terminator.
//     Sweep=1 (gibbous, θ≤270) or 0 (crescent, θ>270).
//   f = (1-cos θ)/2 guards the all-dark and full-disc special cases.
import { useState, useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { speak } from '@discoveryquest/voice-kit/audio';
import { SpaceStage } from './base.jsx';

// ── Stage / layout constants ──────────────────────────────────────────────────
const W = 430;

// Sun: anchored at left, partially off-screen for a natural bleed
const SUN_CX = 22;
const SUN_CY = 110;
const SUN_R = 32;

// Earth: slightly left of centre to leave room for the phase inset on the right
const EARTH_CX = 205;
const EARTH_CY = 110;
const EARTH_R = 17;

// Moon orbit
const ORBIT_R = 62;
const MOON_R = 9;

// Phase inset disc ("From Earth you see:")
const INSET_R = 21;
const INSET_CX = 386;

// SVG height varies by mode so the slider fits without overflow
// interactive: SVG 192 px + 38 px slider div = 230 px (stage height)
// auto-orbit:  SVG 228 px fills the stage
const SVGH_AUTO = 228;
const SVGH_INTERACTIVE = 192;
const INSET_CY_AUTO = 178;
const INSET_CY_INTERACTIVE = 148;

// Subtle parallel light-ray y offsets from sun centre
const RAY_DYS = [-64, -44, -26, -12, 0, 12, 26, 44, 64];

// ── Math helpers ──────────────────────────────────────────────────────────────

/** Moon position on the orbit circle.
 * θ=0   → New Moon  (between Earth and Sun, LEFT of Earth)
 * θ=90  → First Quarter (TOP, counterclockwise on screen)
 * θ=180 → Full Moon (right of Earth)
 * θ=270 → Last Quarter (bottom)
 */
function moonPos(thetaDeg) {
  const r = (thetaDeg * Math.PI) / 180;
  return {
    x: EARTH_CX - ORBIT_R * Math.cos(r),
    y: EARTH_CY - ORBIT_R * Math.sin(r),
  };
}

/** Fraction of the Moon's disc lit as seen from Earth: f = (1 − cos θ) / 2 */
function litFraction(thetaDeg) {
  return (1 - Math.cos((thetaDeg * Math.PI) / 180)) / 2;
}

/** Human-readable phase name from orbital angle (8 phases). */
function getPhaseName(thetaDeg) {
  const t = ((thetaDeg % 360) + 360) % 360;
  if (t < 22.5 || t >= 337.5) return 'New Moon';
  if (t < 67.5) return 'Waxing Crescent';
  if (t < 112.5) return 'First Quarter';
  if (t < 157.5) return 'Waxing Gibbous';
  if (t < 202.5) return 'Full Moon';
  if (t < 247.5) return 'Waning Gibbous';
  if (t < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

/** Which cardinal quadrant the angle is in, for speech triggers. */
function getCardinal(thetaDeg) {
  const t = ((thetaDeg % 360) + 360) % 360;
  if (t < 45 || t >= 315) return 'new';
  if (t < 135) return 'first';
  if (t < 225) return 'full';
  return 'last';
}

/**
 * SVG `d` string for the lit area of the from-Earth phase disc.
 *
 * Waxing (0 < t < 180): lit on RIGHT
 *   1. Right semicircle top→bot, CW (sweep=1).
 *   2. Terminator ellipse bot→top, x-rad = r·|cos θ|:
 *      sweep=0 (CCW) for crescent (t≤90), sweep=1 (CW) for gibbous (t>90).
 *
 * Waning (180 < t < 360): lit on LEFT
 *   1. Left semicircle top→bot, CCW (sweep=0).
 *   2. Terminator bot→top:
 *      sweep=1 (CW) for gibbous (t≤270), sweep=0 (CCW) for crescent (t>270).
 */
function litPath(thetaDeg, r, cx, cy) {
  const f = litFraction(thetaDeg);
  if (f < 0.001) return null; // new moon — all dark
  if (f > 0.999) {
    // Full moon — two semicircular arcs form a complete disc
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }

  const t = ((thetaDeg % 360) + 360) % 360;
  const termR = r * Math.abs(Math.cos((thetaDeg * Math.PI) / 180));
  const top = cy - r;
  const bot = cy + r;

  if (t < 180) {
    // Waxing: lit on right
    const tSweep = t <= 90 ? 0 : 1;
    return `M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bot} A ${termR} ${r} 0 0 ${tSweep} ${cx} ${top} Z`;
  } else {
    // Waning: lit on left
    const tSweep = t <= 270 ? 1 : 0;
    return `M ${cx} ${top} A ${r} ${r} 0 0 0 ${cx} ${bot} A ${termR} ${r} 0 0 ${tSweep} ${cx} ${top} Z`;
  }
}

// ── Slider CSS (matches Scrub2D style) ───────────────────────────────────────
const SLIDER_CSS = `
  .moon-range { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; background: transparent; cursor: pointer; }
  .moon-range:focus { outline: none; }
  .moon-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: linear-gradient(90deg, rgba(34,211,238,0.55), rgba(34,211,238,0.18)); border: 1px solid rgba(34,211,238,0.4); }
  .moon-range::-moz-range-track { height: 8px; border-radius: 9999px; background: rgba(34,211,238,0.25); border: 1px solid rgba(34,211,238,0.4); }
  .moon-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -8px; width: 24px; height: 24px; border-radius: 9999px; background: #22d3ee; border: 3px solid #0e1014; box-shadow: 0 0 10px 2px rgba(34,211,238,0.7); }
  .moon-range::-moz-range-thumb { width: 24px; height: 24px; border-radius: 9999px; background: #22d3ee; border: 3px solid #0e1014; box-shadow: 0 0 10px 2px rgba(34,211,238,0.7); }
  .moon-range:focus-visible::-webkit-slider-thumb { outline: 2px solid #a5f3fc; outline-offset: 2px; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export function MoonPhase2DContent({ interactive = false, says = {} }) {
  const reduce = useReducedMotion();
  // Reduced motion → static first-quarter frame (θ=90°, clear half-moon)
  const [theta, setTheta] = useState(reduce ? 90 : 0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const prevCardinal = useRef(null);

  // Auto-orbit: ~12 s per full cycle
  useEffect(() => {
    if (interactive || reduce) return;
    const animate = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      setTheta(((ts - startRef.current) / 12000) * 360 % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [interactive, reduce]);

  // Slider: continuous θ update + cardinal-phase speech on quadrant crossing
  const handleSlider = useCallback((e) => {
    const newTheta = parseFloat(e.target.value) * 360;
    setTheta(newTheta);
    const card = getCardinal(newTheta);
    if (card !== prevCardinal.current) {
      prevCardinal.current = card;
      const key = says?.[card];
      if (key) speak(key, { important: true });
    }
  }, [says]);

  // Derived geometry
  const { x: moonX, y: moonY } = moonPos(theta);
  const phase = getPhaseName(theta);
  const SVGH = interactive ? SVGH_INTERACTIVE : SVGH_AUTO;
  const INSET_CY = interactive ? INSET_CY_INTERACTIVE : INSET_CY_AUTO;
  const INSET_LABEL_Y = INSET_CY - INSET_R - 7;
  const PHASE_LABEL_Y = INSET_CY + INSET_R + 14;
  const litD = litPath(theta, INSET_R, INSET_CX, INSET_CY);

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* ── Diagram SVG ───────────────────────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${W} ${SVGH}`}
        style={{ display: 'block', width: '100%', flex: '1 1 auto', minHeight: 0 }}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Moon phase diagram showing ${phase}`}
        role="img"
      >
        <defs>
          {/* Sun bloom */}
          <radialGradient id="mp-sunglow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255,215,60,0.42)" />
            <stop offset="45%" stopColor="rgba(255,185,30,0.1)" />
            <stop offset="100%" stopColor="rgba(255,160,0,0)" />
          </radialGradient>

          {/* Sun body */}
          <radialGradient id="mp-sun" cx="38%" cy="35%">
            <stop offset="0%" stopColor="#fff9e8" />
            <stop offset="15%" stopColor="#ffe566" />
            <stop offset="45%" stopColor="#ffaa18" />
            <stop offset="78%" stopColor="#c45500" />
            <stop offset="100%" stopColor="#5a1800" />
          </radialGradient>

          {/* Earth glow */}
          <radialGradient id="mp-earthglow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(60,150,255,0.5)" />
            <stop offset="100%" stopColor="rgba(60,150,255,0)" />
          </radialGradient>

          {/* Earth body — matches roles.js planet */}
          <radialGradient id="mp-earth" cx="36%" cy="32%">
            <stop offset="0%" stopColor="#c8e8ff" />
            <stop offset="22%" stopColor="#4fa8e8" />
            <stop offset="55%" stopColor="#1460b8" />
            <stop offset="85%" stopColor="#052050" />
            <stop offset="100%" stopColor="#020d1f" />
          </radialGradient>

          {/* Moon body in orbital view — left=lit (sun-facing), right=dark.
              gradientUnits=objectBoundingBox means x1/x2 are relative to each
              rendered circle's own bounding box, so the split is always local. */}
          <linearGradient id="mp-moon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0ddd0" />
            <stop offset="36%" stopColor="#b8b4a4" />
            <stop offset="50%" stopColor="#787060" />
            <stop offset="64%" stopColor="#201e16" />
            <stop offset="100%" stopColor="#0c0b08" />
          </linearGradient>

          {/* Phase inset: lit region — warm silvery moonlight */}
          <radialGradient id="mp-phase-lit" cx="40%" cy="38%">
            <stop offset="0%" stopColor="#eee6d0" />
            <stop offset="100%" stopColor="#b0a888" />
          </radialGradient>

          {/* Ambient sunlight wash (left warm → right transparent) */}
          <linearGradient id="mp-lightwash" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,200,60,0.08)" />
            <stop offset="18%" stopColor="rgba(255,185,40,0.03)" />
            <stop offset="45%" stopColor="rgba(255,185,40,0)" />
          </linearGradient>

          {/* Phase inset outer glow */}
          <radialGradient id="mp-inset-glow" cx="50%" cy="50%">
            <stop offset="68%" stopColor="rgba(103,232,249,0)" />
            <stop offset="100%" stopColor="rgba(103,232,249,0.28)" />
          </radialGradient>
        </defs>

        {/* Ambient sun-light wash */}
        <rect x={0} y={0} width={W} height={SVGH} fill="url(#mp-lightwash)" />

        {/* Parallel light rays from Sun (teaching: sunlight travels in parallel lines) */}
        {RAY_DYS.map((dy, i) => (
          <line
            key={i}
            x1={56} y1={SUN_CY + dy}
            x2={W - 10} y2={SUN_CY + dy}
            stroke={`rgba(255,205,60,${dy === 0 ? 0.13 : 0.055})`}
            strokeWidth={dy === 0 ? 1.5 : 0.8}
            strokeDasharray="9 11"
          />
        ))}

        {/* Sun bloom */}
        <circle cx={SUN_CX} cy={SUN_CY} r={100} fill="url(#mp-sunglow)" />
        {/* Sun body */}
        <circle cx={SUN_CX} cy={SUN_CY} r={SUN_R} fill="url(#mp-sun)" />
        {/* Sun label */}
        <text
          x={SUN_CX + SUN_R + 5}
          y={SUN_CY - SUN_R - 4}
          fill="rgba(255,215,80,0.65)"
          fontSize={7.5}
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing=".12em"
        >SUN</text>

        {/* "SUNLIGHT →" direction hint (between sun and orbit) */}
        <text
          x={92}
          y={SUN_CY - 4}
          fill="rgba(255,205,60,0.28)"
          fontSize={7}
          fontFamily="sans-serif"
          letterSpacing=".08em"
        >SUNLIGHT →</text>

        {/* Orbit ring — dashed circle around Earth */}
        <circle
          cx={EARTH_CX} cy={EARTH_CY} r={ORBIT_R}
          fill="none"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth={1}
          strokeDasharray="3 5"
        />

        {/* Line of sight: Earth → Moon (dotted cyan) */}
        <line
          x1={EARTH_CX} y1={EARTH_CY}
          x2={moonX} y2={moonY}
          stroke="rgba(103,232,249,0.28)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />

        {/* Earth glow */}
        <circle cx={EARTH_CX} cy={EARTH_CY} r={EARTH_R + 9} fill="url(#mp-earthglow)" />
        {/* Earth body */}
        <circle cx={EARTH_CX} cy={EARTH_CY} r={EARTH_R} fill="url(#mp-earth)" />
        {/* Earth label */}
        <text
          x={EARTH_CX}
          y={EARTH_CY + EARTH_R + 10}
          textAnchor="middle"
          fill="rgba(148,210,255,0.6)"
          fontSize={7.5}
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing=".09em"
        >EARTH</text>

        {/* Moon orbital disc — left half always lit (facing Sun), right half dark */}
        <circle cx={moonX} cy={moonY} r={MOON_R + 4} fill="rgba(200,196,170,0.09)" />
        <circle cx={moonX} cy={moonY} r={MOON_R} fill="url(#mp-moon)" />

        {/* ── Phase inset ───────────────────────────────────────────────── */}
        <text
          x={INSET_CX}
          y={INSET_LABEL_Y}
          textAnchor="middle"
          fill="rgba(148,163,184,0.6)"
          fontSize={7}
          fontFamily="sans-serif"
          letterSpacing=".09em"
        >FROM EARTH:</text>

        {/* Outer glow ring */}
        <circle cx={INSET_CX} cy={INSET_CY} r={INSET_R + 5} fill="url(#mp-inset-glow)" />
        {/* Dark background */}
        <circle cx={INSET_CX} cy={INSET_CY} r={INSET_R} fill="#060810" />
        {/* Lit area — SVG path geometry described at top of file */}
        {litD && <path d={litD} fill="url(#mp-phase-lit)" />}
        {/* Border ring */}
        <circle
          cx={INSET_CX} cy={INSET_CY} r={INSET_R}
          fill="none"
          stroke="rgba(103,232,249,0.22)"
          strokeWidth={1}
        />

        {/* Phase name label — positioned below the inset disc */}
        <text
          x={INSET_CX}
          y={PHASE_LABEL_Y}
          textAnchor="middle"
          fill="rgba(255,215,100,0.88)"
          fontSize={10}
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing=".06em"
        >{phase}</text>
      </svg>

      {/* ── Interactive slider ─────────────────────────────────────────────── */}
      {interactive && (
        <div className="shrink-0 px-4" style={{ height: 38 }}>
          <style>{SLIDER_CSS}</style>
          <input
            type="range"
            min={0}
            max={1}
            step="any"
            value={theta / 360}
            onChange={handleSlider}
            className="moon-range"
            aria-label="Moon orbital position — drag to explore phases"
          />
        </div>
      )}
    </div>
  );
}

export default function MoonPhase2D(props) {
  return (
    <SpaceStage>
      <MoonPhase2DContent {...props} />
    </SpaceStage>
  );
}
