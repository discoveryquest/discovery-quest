// SeasonOrbit2D — the seasons diagram: Sun at the centre, Earth carried around its
// orbit by `fraction` (0..1, injected by a scrub base or a practice slider), with the
// one thing that actually causes seasons made visible: Earth's axis keeps the SAME
// fixed 23.5° lean all year (N label on the north end). The axis leans left, so on
// the right of the Sun the northern half faces the Sun (summer) and on the left it
// faces away (winter); top/bottom are the equinoxes (spring/autumn). Positions match
// the lesson states: spring top, summer right, autumn bottom, winter left.
// Depth: the orbit is a tilted ellipse, so on the top half Earth passes BEHIND the
// Sun (drawn first, slightly smaller); on the bottom half in front (slightly larger).
import { useEffect, useState } from 'react';
import { useReducedMotion, useSpring, useMotionValueEvent } from 'framer-motion';
import { SpaceStage, SvgEmoji } from './base.jsx';

const W = 300;
const H = 170;
const CX = 150;
const CY = 85;
const RX = 96;
const RY = 50;
const ER = 16;
const TILT = -23.5;

export function SeasonOrbit2DContent({ fraction = 0 }) {
  const reduce = useReducedMotion();
  const target = -90 + fraction * 270; // spring top → summer right → autumn bottom → winter left
  const spring = useSpring(-90, { stiffness: 70, damping: 16 });
  const [sprung, setSprung] = useState(-90);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  useMotionValueEvent(spring, 'change', (v) => setSprung(v));
  const deg = reduce ? target : sprung;
  const rad = (deg * Math.PI) / 180;
  const ex = CX + Math.cos(rad) * RX;
  const ey = CY + Math.sin(rad) * RY;
  const behind = Math.sin(rad) < 0; // top half of the ellipse = far side of the Sun
  const scale = 1 + 0.16 * Math.sin(rad); // a touch of perspective with depth

  const earth = (
    <g transform={`translate(${ex.toFixed(1)} ${ey.toFixed(1)}) scale(${scale.toFixed(3)})`}>
      <g transform={`rotate(${TILT})`}>
        <line x1="0" y1={-ER - 9} x2="0" y2={ER + 9} stroke="#e2e8f0" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
        <SvgEmoji x={0} y={0} r={ER} />
        <text x="0" y={-ER - 12} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="900">N</text>
      </g>
    </g>
  );

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block"
      role="img" aria-label="Earth on its orbit around the Sun; its tilted axis always leans the same way.">
      <defs>
        <radialGradient id="season-sun" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#fff7cf" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <filter id="season-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* far arc of the orbit, then Earth-when-behind, then the Sun, then the rest */}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#67e8f9" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 6" />
      {behind && earth}
      <circle cx={CX} cy={CY} r={19} fill="url(#season-sun)" filter="url(#season-glow)" />
      <text x={CX} y={CY + 34} textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="800">SUN</text>
      {!behind && earth}
    </svg>
  );
}

export default function SeasonOrbit2D(props) {
  return (
    <SpaceStage>
      <SeasonOrbit2DContent {...props} />
    </SpaceStage>
  );
}
