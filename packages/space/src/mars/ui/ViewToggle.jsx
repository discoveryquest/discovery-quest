import { marsStore, useMarsState } from '../store/marsStore.js';

// First/third-person toggle, sat in the top-right icon row next to 📸/🔊 (rather
// than buried in the HUD text buttons). Shows the view you'll switch TO so it
// reads as an action. Mirrors the V keyboard shortcut.
export default function ViewToggle() {
  const { view } = useMarsState();
  const next = view === 'first' ? '3rd' : '1st';
  return (
    <button
      type="button"
      onClick={marsStore.toggleView}
      aria-label={view === 'first' ? 'Switch to third-person view' : 'Switch to first-person view'}
      style={{
        position: 'fixed', top: 12, right: 112, zIndex: 5,
        appearance: 'none', width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
        border: '1px solid rgba(255,180,120,0.35)', background: 'rgba(20,8,4,0.5)',
        color: '#ffe9d0', font: '700 13px system-ui, sans-serif', backdropFilter: 'blur(2px)',
      }}
    >
      {next}
    </button>
  );
}
