// Registry map: mode → kind → Component.
// This file IS JSX (imports React components) and must NEVER be imported by .test.mjs files.
// The pure resolution logic lives in registry.js (JSX-free).
import Fact2D from './2d/Fact2D.jsx';
import Body2D from './2d/Body2D.jsx';
import Orbit2D from './2d/Orbit2D.jsx';
import Field2D from './2d/Field2D.jsx';
import Launch2D from './2d/Launch2D.jsx';
import Compare2D from './2d/Compare2D.jsx';
import Scrub2D from './2d/Scrub2D.jsx';
import Reveal2D from './2d/Reveal2D.jsx';

export const SCENE_RENDERERS = {
  '2d': {
    fact: Fact2D,
    body: Body2D,
    orbit: Orbit2D,
    field: Field2D,
    launch: Launch2D,
    compare: Compare2D,
    scrub: Scrub2D,
    reveal: Reveal2D,
  },
};
