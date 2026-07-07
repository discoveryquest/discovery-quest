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
  suppressLook: false, // set while dragging a rover part so the drag doesn't also orbit the camera
};

const keys = new Set();
const LOOK = 0.0025;       // first-person pointer-locked mouse sensitivity
const DRAG_LOOK = 0.004;   // third-person click-drag orbit sensitivity
const DRAG_THRESHOLD = 6;  // px of travel before a press counts as a look-drag (not a click)

// Third-person look-drag state (module-scoped; desktop only). While the left
// button is held on the canvas we orbit the camera instead of walking; a press
// that never crosses DRAG_THRESHOLD is treated as a click (pick up / throw).
let dragActive = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;

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
    if (document.pointerLockElement) {
      // First-person: pointer-locked mouse-look.
      input.yaw -= e.movementX * LOOK;
      input.pitch = Math.max(-1.2, Math.min(1.2, input.pitch - e.movementY * LOOK));
      return;
    }
    // Third-person: orbit only while dragging the canvas (look without walking).
    if (!dragActive || input.suppressLook) return;
    input.yaw -= e.movementX * DRAG_LOOK;
    input.pitch = Math.max(-0.5, Math.min(0.9, input.pitch - e.movementY * DRAG_LOOK));
    if (Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY) > DRAG_THRESHOLD) {
      dragMoved = true;
    }
  };
  const pointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target?.tagName !== 'CANVAS') return;
    if (input.suppressLook) return; // a rover part grabbed this press for dragging
    dragActive = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  };
  const pointerUp = (e) => {
    if (e.button !== 0) return;
    if (!dragActive) return;
    dragActive = false;
    // A press that never became a drag is a click: pick up, or throw if holding
    // (actionTap is the same edge the E key uses, so aim follows the look dir).
    if (!dragMoved) input.actionTap += 1;
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
