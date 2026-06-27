// SceneContent — renders a descriptor's BARE inner content (no SpaceStage wrapper).
// Used when a scene is nested inside another scene's stage (Scrub2D/Reveal2D `base`),
// so there is only ONE backdrop + one starfield instead of doubled, overflowing stages.
// Kinds without a bare variant fall back to the full Scene (rare for a base).
import Scene from './Scene.jsx';
import { Body2DContent } from './2d/Body2D.jsx';
import { Orbit2DContent } from './2d/Orbit2D.jsx';
import { FieldContent } from './2d/Field2D.jsx';

const BARE_RENDERERS = {
  body: Body2DContent,
  orbit: Orbit2DContent,
  field: FieldContent,
};

export default function SceneContent({ descriptor }) {
  if (!descriptor) return null;
  const Bare = BARE_RENDERERS[descriptor.kind];
  return Bare ? <Bare {...descriptor} /> : <Scene descriptor={descriptor} />;
}
