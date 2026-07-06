// Full 3D lesson renderers: the bare transparent-canvas scene wrapped in the
// same SpaceStage the 2D lessons use (gradient + starfield behind the glass).
// Interactive kinds (scrub/reveal) stay the 2D components — their SceneContent
// base resolves to these 3D bares automatically in '3d' mode.
import { SpaceStage } from '../2d/base.jsx';
import {
  BodyContent3D, OrbitContent3D, FieldContent3D, CompareContent3D,
  LaunchContent3D, MoonPhaseContent3D, SpinContent3D, SeasonsContent3D,
  FallContent3D, StarLifeContent3D,
} from './content3d.jsx';

const stage = (Bare) => function Staged3D(props) {
  return (
    <SpaceStage tint={props.tint}>
      <Bare {...props} />
    </SpaceStage>
  );
};

export const RENDERERS_3D = {
  body: stage(BodyContent3D),
  orbit: stage(OrbitContent3D),
  field: stage(FieldContent3D),
  compare: stage(CompareContent3D),
  launch: stage(LaunchContent3D),
  moonPhase: stage(MoonPhaseContent3D),
  spin: stage(SpinContent3D),
  seasons: stage(SeasonsContent3D),
  fall: stage(FallContent3D),
  starLife: stage(StarLifeContent3D),
  // fact / scrub / reveal intentionally absent → resolveRenderer falls back to
  // the 2D components (scrub/reveal then mount 3D bases via SceneContent).
};

export const BARE_RENDERERS_3D = {
  body: BodyContent3D,
  orbit: OrbitContent3D,
  field: FieldContent3D,
  moonPhase: MoonPhaseContent3D,
  spin: SpinContent3D,
  seasons: SeasonsContent3D,
  fall: FallContent3D,
  starLife: StarLifeContent3D,
};
