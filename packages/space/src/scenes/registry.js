// Scene renderer resolution (pure — no JSX, so node --test can import it). A beat's `view`
// (a semantic scene descriptor) is rendered by SCENE_RENDERERS[mode][kind] (the map lives in
// renderers.jsx). `mode` is a single constant today; swapping the whole course to 3D is
// editing SCENE_MODE, and a missing (mode,kind) falls back to 2d so a partial 3D rollout
// never breaks a lesson.
export const SCENE_MODE = '2d';

// Returns a component or null. registry shape: { mode: { kind: Component } }.
export function resolveRenderer(registry, mode, kind) {
  return registry[mode]?.[kind] ?? registry['2d']?.[kind] ?? null;
}
