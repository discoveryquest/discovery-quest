import { useMarsState } from '../store/marsStore.js';

// First-person embodiment: a lightweight DOM overlay that frames the view as if
// looking out through a suit helmet — a soft dark vignette + a faint cool visor
// tint at the very edges + a bright reflection glint arc. Shown ONLY in
// first-person (in third-person you see Luna's actual glass dome instead).
// Purely cosmetic and pointer-transparent, so it never eats clicks/look-drags.
export default function HelmetVisor() {
  const { view } = useMarsState();
  if (view !== 'first') return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
      {/* darkened helmet rim — tighter falloff at the corners */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(125% 115% at 50% 48%, rgba(0,0,0,0) 55%, rgba(30,12,4,0.45) 82%, rgba(10,4,1,0.85) 100%)',
        }}
      />
      {/* faint cool anti-glare visor tint, strongest at the edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(140% 130% at 50% 45%, rgba(180,215,255,0) 68%, rgba(150,200,255,0.08) 100%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* soft reflection glint sweeping the top-left of the glass */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(40% 22% at 30% 20%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
