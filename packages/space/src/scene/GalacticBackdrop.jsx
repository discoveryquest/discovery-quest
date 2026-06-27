import Skybox from './primitives/Skybox.jsx';
import StarField from './primitives/StarField.jsx';

// Minimal scene shown behind the Star Chart when no sector is loaded (the
// "warped out" state, spec §5.2). Just stars — the chart is the focus.
export default function GalacticBackdrop() {
  return (
    <>
      <Skybox preset="deep-indigo" />
      <StarField count={6000} depth="far" />
      <ambientLight intensity={0.5} />
    </>
  );
}
