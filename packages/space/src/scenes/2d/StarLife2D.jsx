// StarLife2D — the life of a massive star as one morphing scene. `fraction` (0..1,
// injected by a scrub base) sweeps four stages: nebula → new star → red giant →
// supernova. Each stage is its own drawing; stages crossfade as the learner drags
// (triangle-window opacity around each stage index), so the star visibly gathers,
// ignites, swells, and finally explodes — instead of a static sun with a shadow.
import { SpaceStage } from './base.jsx';

const W = 300;
const H = 160;
const CX = 150;
const CY = 78;

// Opacity window: full at the stage's own index, gone by the neighbouring stage.
const win = (s, i) => Math.max(0, 1 - Math.abs(s - i));

const FADE = { transition: 'opacity 0.45s ease' };

export function StarLife2DContent({ fraction = 0 }) {
  const s = fraction * 3;
  const o = [win(s, 0), win(s, 1), win(s, 2), win(s, 3)];
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block"
      role="img" aria-label="A star's life: nebula, new star, red giant, supernova.">
      <defs>
        {/* generous filter regions — the default 10% margin crops the blur to a square */}
        <filter id="sl-blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="sl-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="sl-newstar" cx="42%" cy="40%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="sl-giant" cx="42%" cy="38%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {/* 0 — nebula: soft overlapping gas clouds with baby-star sparkles */}
      <g opacity={o[0]} style={FADE}>
        <circle cx={CX - 26} cy={CY - 8} r={30} fill="#a855f7" opacity="0.5" filter="url(#sl-blur)" />
        <circle cx={CX + 20} cy={CY + 6} r={34} fill="#6366f1" opacity="0.45" filter="url(#sl-blur)" />
        <circle cx={CX + 2} cy={CY - 18} r={24} fill="#ec4899" opacity="0.4" filter="url(#sl-blur)" />
        {[[-38, 10], [-10, -26], [26, -14], [40, 18], [6, 24]].map(([dx, dy], i) => (
          <circle key={i} cx={CX + dx} cy={CY + dy} r={1.6} fill="#fff" opacity="0.9" />
        ))}
      </g>

      {/* 1 — new star: small, fierce and bright */}
      <g opacity={o[1]} style={FADE}>
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={CX - 30} y1={CY} x2={CX + 30} y2={CY}
            stroke="#fde68a" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${a} ${CX} ${CY})`} />
        ))}
        <circle cx={CX} cy={CY} r={15} fill="url(#sl-newstar)" filter="url(#sl-glow)" />
      </g>

      {/* 2 — red giant: swollen and cooler */}
      <g opacity={o[2]} style={FADE}>
        <circle cx={CX} cy={CY} r={52} fill="url(#sl-giant)" filter="url(#sl-glow)" />
        <circle cx={CX} cy={CY} r={52} fill="none" stroke="#fca5a5" strokeOpacity="0.35" strokeWidth="2" />
      </g>

      {/* 3 — supernova: the blast */}
      <g opacity={o[3]} style={FADE}>
        <circle cx={CX} cy={CY} r={60} fill="none" stroke="#fde68a" strokeOpacity="0.6" strokeWidth="2.5" strokeDasharray="6 8" />
        <circle cx={CX} cy={CY} r={42} fill="none" stroke="#fb923c" strokeOpacity="0.5" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
          <line key={a}
            x1={CX + 16 * Math.cos((a * Math.PI) / 180)} y1={CY + 16 * Math.sin((a * Math.PI) / 180)}
            x2={CX + 54 * Math.cos((a * Math.PI) / 180)} y2={CY + 54 * Math.sin((a * Math.PI) / 180)}
            stroke={a % 60 === 0 ? '#fde68a' : '#fb7185'} strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
        ))}
        <circle cx={CX} cy={CY} r={11} fill="#ffffff" filter="url(#sl-glow)" />
      </g>
    </svg>
  );
}

export default function StarLife2D(props) {
  return (
    <SpaceStage>
      <StarLife2DContent {...props} />
    </SpaceStage>
  );
}
