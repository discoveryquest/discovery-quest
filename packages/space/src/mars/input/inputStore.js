// Single source of movement/look intent (R6). The Player reads `input` each frame
// via useFrame — no React re-render on key/mouse events. Touch controls (T20) will
// write into the same object. yaw/pitch accumulate from pointer-locked mouse.
export const input = { forward: 0, right: 0, jump: false, yaw: 0, pitch: 0 };

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
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('mousemove', move);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('mousemove', move);
  };
}
