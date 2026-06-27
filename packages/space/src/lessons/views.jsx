// Space Quest lesson visuals now delegate to the renderer-agnostic Scene kit (src/scenes).
// A beat's `view` is a semantic scene descriptor; <Scene> resolves it to a 2D (or future 3D)
// renderer via SCENE_RENDERERS[mode][kind]. Kept as renderLessonView so CourseLesson's
// renderView contract stays stable.
import Scene from '../scenes/Scene.jsx';
import { SCENE_MODE } from '../scenes/registry.js';

export function renderLessonView(view) {
  return <Scene descriptor={view} mode={SCENE_MODE} />;
}
