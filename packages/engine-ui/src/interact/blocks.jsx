// interact/blocks — the shared Numberblocks-style manipulative visuals: ones
// are cubes, tens are 10-cube rods, hundreds are 10×10 flats. The cube face
// (top highlight + bottom shadow + glow) is the SAME look math's interactive
// hints established, lifted here so every course's blocks match. DOM divs on
// purpose (matches interactiveHints; cheap to animate transform-only).

export const cubeFace = (color) => ({
  background: color,
  boxShadow: `inset 0 4px 0 #ffffff77, inset 0 -5px 0 #00000026, 0 0 10px ${color}aa`,
});

export function BlockCube({ color = '#4ADE80', size = 26, label, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md font-mono font-extrabold text-slate-900 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.44, ...cubeFace(color) }}
    >
      {label}
    </div>
  );
}

// A ten: 10 cubes fused into one horizontal rod (one draggable piece).
export function BlockRod({ color = '#FFB020', size = 26, className = '' }) {
  return (
    <div className={`flex gap-[2px] rounded-md p-[2px] ${className}`} style={{ boxShadow: `0 0 10px ${color}66` }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="rounded-[3px]" style={{ width: size * 0.62, height: size, ...cubeFace(color) }} />
      ))}
    </div>
  );
}

// A hundred: 10×10 flat (for later place-value/decimals boards).
export function BlockFlat({ color = '#A78BFA', size = 13, className = '' }) {
  return (
    <div className={`grid grid-cols-10 gap-[1px] rounded-md p-[2px] ${className}`} style={{ boxShadow: `0 0 12px ${color}66` }}>
      {Array.from({ length: 100 }, (_, i) => (
        <div key={i} className="rounded-[2px]" style={{ width: size, height: size, ...cubeFace(color) }} />
      ))}
    </div>
  );
}

// n rendered in canonical block form: rods for each ten, cubes for the ones.
export function BlockGroup({ n, color = '#4ADE80', rodColor, size = 26, className = '' }) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      {Array.from({ length: tens }, (_, i) => (
        <BlockRod key={`t${i}`} color={rodColor ?? color} size={size} />
      ))}
      {ones > 0 && (
        <div className="flex gap-1.5">
          {Array.from({ length: ones }, (_, i) => (
            <BlockCube key={`o${i}`} color={color} size={size} />
          ))}
        </div>
      )}
    </div>
  );
}
