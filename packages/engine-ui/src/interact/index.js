// @discoveryquest/engine-ui/interact — the shared manipulative kit: drag core
// (InteractBoard / DragPiece / DropSlot), feedback (SnapGlow / ConfettiBurst /
// useShake), block visuals (BlockCube / BlockRod / BlockFlat / BlockGroup).
// Spec: docs/superpowers/specs/2026-07-04-interactive-courses-design.md §1.
export { InteractBoard, DragPiece, DropSlot, useInteractBoard } from './dragCore.jsx';
export { SnapGlow, ConfettiBurst, useShake } from './feedback.jsx';
export { cubeFace, BlockCube, BlockRod, BlockFlat, BlockGroup } from './blocks.jsx';
