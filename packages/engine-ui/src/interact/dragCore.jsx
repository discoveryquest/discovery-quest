// interact/dragCore — the shared drag-and-drop trio every course's manipulative
// boards build on: <InteractBoard> (slot registry + selection state),
// <DragPiece> (pointer-capture dragging with spring return), <DropSlot>
// (highlightable target). Design rules (see the interactive-courses spec §1):
// pointer events only (mouse + touch unified, touch-action:none while
// draggable), and EVERY piece also supports tap-to-select → tap-to-place, so
// no interaction ever requires precision dragging. Data flow is controlled:
// the board's onDrop(pieceId, slotId, data) returns true to accept — the
// parent then re-renders (piece leaves the tray / appears in the slot); false
// springs the piece home with a shake. The kit never owns game state.
import { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';

const BoardCtx = createContext(null);

const RETURN_SPRING = { type: 'spring', stiffness: 420, damping: 30 };
const TAP_SLOP = 8; // px of movement before a press stops counting as a tap

export function InteractBoard({ onDrop, children, className = '' }) {
  const slots = useRef(new Map()); // slotId -> { el, accepts }
  const [selected, setSelected] = useState(null); // { pieceId, data } (tap-to-place)
  const [hover, setHover] = useState(null); // slotId currently under a drag
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop; // parent re-renders (e.g. Luna talking) must not stale this

  const ctx = useMemo(() => ({
    registerSlot: (id, el, accepts) => slots.current.set(id, { el, accepts }),
    unregisterSlot: (id) => slots.current.delete(id),
    // The slot under a viewport point whose accepts() passes; live rects on purpose.
    slotAt: (x, y, data) => {
      for (const [id, s] of slots.current) {
        if (!s.el?.isConnected) continue;
        const r = s.el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && (!s.accepts || s.accepts(data))) return id;
      }
      return null;
    },
    tryDrop: (pieceId, slotId, data) => !!onDropRef.current?.(pieceId, slotId, data),
    selected, setSelected,
    hover, setHover,
  }), [selected, hover]);

  return (
    <BoardCtx.Provider value={ctx}>
      <div className={`relative ${className}`}>{children}</div>
    </BoardCtx.Provider>
  );
}

export const useInteractBoard = () => useContext(BoardCtx);

export function DragPiece({ id, data, disabled = false, onRejected, className = '', children }) {
  const board = useContext(BoardCtx);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const press = useRef(null); // { px, py, moved }
  const isSelected = board?.selected?.pieceId === id;

  const springHome = useCallback((shake) => {
    if (reduce) { x.set(0); y.set(0); return; }
    if (shake) {
      animate(x, [x.get(), x.get() - 8, x.get() + 8, 0], { duration: 0.32 });
      animate(y, 0, RETURN_SPRING);
    } else {
      animate(x, 0, RETURN_SPRING);
      animate(y, 0, RETURN_SPRING);
    }
  }, [reduce, x, y]);

  const finish = (e) => {
    const p = press.current;
    press.current = null;
    setDragging(false);
    board?.setHover(null);
    if (!p) return;
    if (!p.moved) {
      // A tap: toggle selection for tap-to-place.
      board?.setSelected(isSelected ? null : { pieceId: id, data });
      x.set(0); y.set(0);
      return;
    }
    const slotId = board?.slotAt(e.clientX, e.clientY, data);
    const ok = slotId != null && board.tryDrop(id, slotId, data);
    if (ok) {
      // Parent state now owns the piece's new home; reset silently for reuse/unmount.
      x.set(0); y.set(0);
      board?.setSelected(null);
    } else {
      springHome(slotId != null || p.moved);
      onRejected?.();
    }
  };

  return (
    <motion.div
      style={{ x, y, touchAction: 'none' }}
      className={`${disabled ? '' : 'cursor-grab active:cursor-grabbing'} select-none ${dragging ? 'z-30' : ''} ${className}`}
      animate={dragging ? { scale: 1.08 } : { scale: isSelected ? 1.06 : 1 }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press.current = { px: e.clientX, py: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const p = press.current;
        if (!p) return;
        const dx = e.clientX - p.px;
        const dy = e.clientY - p.py;
        if (!p.moved && Math.hypot(dx, dy) > TAP_SLOP) { p.moved = true; setDragging(true); }
        if (p.moved) {
          x.set(dx); y.set(dy);
          board?.setHover(board.slotAt(e.clientX, e.clientY, data));
        }
      }}
      onPointerUp={finish}
      onPointerCancel={() => { press.current = null; setDragging(false); board?.setHover(null); springHome(false); }}
    >
      {/* selection ring for tap-to-place */}
      {isSelected && !dragging && (
        <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-cyan-300/80 animate-pulse" />
      )}
      {children}
    </motion.div>
  );
}

export function DropSlot({ id, accepts, onTapPlace, className = '', children }) {
  const board = useContext(BoardCtx);
  const ref = useRef(null);

  useEffect(() => {
    if (!board || !ref.current) return;
    board.registerSlot(id, ref.current, accepts);
    return () => board.unregisterSlot(id);
    // accepts is typically an inline closure; re-registering on each render is
    // harmless (Map.set) and keeps it fresh without forcing callers to memoize.
  });

  const sel = board?.selected;
  const compatible = sel && (!accepts || accepts(sel.data));
  const lit = board?.hover === id || compatible;

  const place = () => {
    if (!sel || !compatible) return;
    const ok = board.tryDrop(sel.pieceId, id, sel.data);
    if (ok) board.setSelected(null);
    onTapPlace?.(ok);
  };

  return (
    <div ref={ref} onClick={place} className={`relative ${className}`}>
      {lit && (
        <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-2xl ring-2 ring-amber-300/70 animate-pulse" />
      )}
      {children}
    </div>
  );
}
