// Compare2D — side-by-side size comparison of 2+ bodies.
// items: [{ label, relSize (0..1), color? }]. Bodies are scaled circles.
// Mostly static; no animation needed.
import { roleGradient, roleGlow } from './roles.js';
import { SpaceStage } from './base.jsx';

const MAX_SIZE = 110; // px for relSize=1

export default function Compare2D({ items = [] }) {
  return (
    <SpaceStage>
      <div className="flex h-full w-full items-end justify-center gap-6 pb-6">
        {items.map((item, i) => {
          const size = Math.max(16, Math.round((item.relSize ?? 0.5) * MAX_SIZE));
          const gradient = item.gradient ?? roleGradient(item.role);
          const glow = item.glow ?? roleGlow(item.role);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: gradient,
                  boxShadow: `0 0 ${size * 0.35}px ${size * 0.15}px ${glow}`,
                  flexShrink: 0,
                }}
              />
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-xs font-bold text-slate-300 leading-tight text-center"
                  style={{ maxWidth: 80 }}
                >
                  {item.label}
                </span>
                {item.sizeLabel && (
                  <span className="text-[10px] font-bold text-cyan-400/80">{item.sizeLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SpaceStage>
  );
}
