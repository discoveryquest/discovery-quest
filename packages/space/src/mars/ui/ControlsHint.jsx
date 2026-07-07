import { useEffect, useState } from 'react';

// First-touch onboarding for phones (spec N3): a one-time overlay explaining the
// touch controls that fades after the first touch, plus a rotate-to-landscape
// nudge while the device is in portrait. Coarse-pointer only.
const coarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export default function ControlsHint() {
  const [show] = useState(coarsePointer);
  const [touched, setTouched] = useState(false);
  const [portrait, setPortrait] = useState(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  );

  useEffect(() => {
    if (!show) return undefined;
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    const onTouch = () => setTouched(true);
    window.addEventListener('resize', onResize);
    window.addEventListener('touchstart', onTouch, { once: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('touchstart', onTouch);
    };
  }, [show]);

  if (!show) return null;
  if (touched && !portrait) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8, pointerEvents: 'none',
        display: 'grid', placeItems: 'center', textAlign: 'center',
        background: portrait ? 'rgba(10,5,2,0.72)' : 'rgba(10,5,2,0.35)',
        color: '#ffe9d0', fontFamily: 'system-ui, sans-serif',
        transition: 'opacity 300ms', opacity: touched && !portrait ? 0 : 1,
      }}
    >
      <div style={{ maxWidth: 340, padding: 24 }}>
        {portrait ? (
          <>
            <div style={{ fontSize: 40 }}>🔄</div>
            <div style={{ color: '#ff9e5a', fontWeight: 800, fontSize: 20, marginTop: 6 }}>
              Rotate to landscape
            </div>
            <div style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>
              Mars is best explored with your phone turned sideways.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36 }}>👋</div>
            <div style={{ color: '#ff9e5a', fontWeight: 800, fontSize: 20, marginTop: 6 }}>
              Walk on Mars
            </div>
            <div style={{ opacity: 0.9, marginTop: 8, fontSize: 15, lineHeight: 1.6 }}>
              <strong>Left stick</strong> to walk · <strong>drag the right</strong> to look<br />
              <strong>GRAB</strong> a glowing rock, tap again to throw · <strong>JUMP</strong> to bound
            </div>
            <div style={{ opacity: 0.6, marginTop: 12, fontSize: 12 }}>touch anywhere to begin</div>
          </>
        )}
      </div>
    </div>
  );
}
