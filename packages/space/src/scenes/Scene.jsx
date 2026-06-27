// Scene dispatcher — resolves a beat's semantic view descriptor to a 2D renderer.
// descriptor: { kind, key?, ...props }. mode defaults to SCENE_MODE ('2d').
// Returns null for unknown kinds so the caller gracefully renders nothing.
import { SCENE_MODE, resolveRenderer } from './registry.js';
import { SCENE_RENDERERS } from './renderers.jsx';

export default function Scene({ descriptor, mode = SCENE_MODE }) {
  if (!descriptor) return null;
  const Renderer = resolveRenderer(SCENE_RENDERERS, mode, descriptor.kind);
  return Renderer ? <Renderer {...descriptor} /> : null;
}
