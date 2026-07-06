// Single source of movement/look/interaction intent (R6). The Player and
// InteractionController read `input` each frame via useFrame — no React re-render
// on key/mouse events. Touch controls (T20) will write into this same object.
// yaw/pitch accumulate from pointer-locked mouse.
export const input = {
  forward: 0,
  right: 0,
  jump: false,
  yaw: 0,
  pitch: 0,
  actionTap: 0,       // keyboard "use" edge (E): pick up, or throw if holding
  primaryPress: 0,    // pointer button down edge: pick up
  primaryRelease: 0,  // pointer button up edge: throw if holding
  primaryDown: false,
};

const keys = new Set();
const LOOK = 0.0025;

function recompute() {
  input.forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
                - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  input.right = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
              - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.jump = keys.has('Space');
}

// Install global listeners. onToggleView fires on V. Returns a cleanup fn.
export function installInput(onToggleView) {
  const down = (e) => {
    if (e.code === 'KeyV') { onToggleView?.(); return; }
    if (e.code === 'KeyE' && !e.repeat) { input.actionTap += 1; return; }
    if (e.code === 'Space') e.preventDefault(); // don't scroll the page
    keys.add(e.code);
    recompute();
  };
  const up = (e) => { keys.delete(e.code); recompute(); };
  const move = (e) => {
    if (!document.pointerLockElement) return;
    input.yaw -= e.movementX * LOOK;
    input.pitch = Math.max(-1.2, Math.min(1.2, input.pitch - e.movementY * LOOK));
  };
  const pointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target?.tagName !== 'CANVAS') return;
    input.primaryDown = true;
    input.primaryPress += 1;
  };
  const pointerUp = (e) => {
    if (e.button !== 0) return;
    if (!input.primaryDown) return;
    input.primaryDown = false;
    input.primaryRelease += 1;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('mousemove', move);
  window.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointerup', pointerUp);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('mousemove', move);
    window.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('pointerup', pointerUp);
  };
}
