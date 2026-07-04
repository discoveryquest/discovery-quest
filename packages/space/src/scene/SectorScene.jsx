import { useMemo } from 'react';
import { useGame, useGameActions } from '../store/useGame.js';
import Skybox from './primitives/Skybox.jsx';
import StarField from './primitives/StarField.jsx';
import Light from './primitives/Light.jsx';
import Body from './primitives/Body.jsx';
import Orbit from './primitives/Orbit.jsx';
import Beacon from './primitives/Beacon.jsx';
import Trail from './primitives/Trail.jsx';
import Ship from '../flight/Ship.jsx';
import CameraRig from '../flight/CameraRig.jsx';

const addV = (a, b = [0, 0, 0]) => [a[0] + (b[0] || 0), a[1] + (b[1] || 0), a[2] + (b[2] || 0)];

// Representative world position per body (orbiting bodies use their orbit's
// resting point at +r on x). Anchors beacons + guided-flight targets.
function resolveBodyPositions(bodies = []) {
  const pos = {};
  for (const b of bodies) {
    if (b.position) pos[b.id] = b.position;
    else if (b.orbit) {
      const center = pos[b.orbit.around] ?? [0, 0, 0];
      pos[b.id] = [center[0] + (b.orbit.r ?? 0), center[1], center[2]];
    } else pos[b.id] = [0, 0, 0];
  }
  return pos;
}

// Renders a sector purely from its `scene` data via the primitive library
// (spec §B.1). Mounting it enters the sector (warpTo) and begins guided flight.
export default function SectorScene({ sector, reducedMotion = false }) {
  const actions = useGameActions();
  const scene = sector?.scene ?? {};
  const lockedBeacon = useGame((s) => s.lockedBeacon);
  const unlocked = useGame((s) => s.unlocked);

  // Note: entering the sector (warpTo) is driven by the Star Chart, not here —
  // SpaceQuest only mounts this scene once the store is already in that sector.

  const bodyPos = useMemo(() => resolveBodyPositions(scene.bodies), [scene.bodies]);

  // Beacon world positions = guided-flight targets, keyed by station id.
  const targets = useMemo(() => {
    const t = {};
    for (const bcn of scene.beacons ?? []) {
      const anchor = bodyPos[bcn.at] ?? [0, 0, 0];
      t[bcn.station] = addV(anchor, addV(bcn.offset ?? [0, 0, 0], [0, 1.5, 0]));
    }
    return t;
  }, [scene.beacons, bodyPos]);

  // Ordered node positions for the star-dust trail + how far it should glow.
  const stationsList = sector?.stations ?? [];
  const trailNodes = useMemo(() => stationsList.map((s) => targets[s.id]).filter(Boolean), [stationsList, targets]);
  const unlockedCount = stationsList.filter((s) => unlocked[s.id]).length;

  return (
    <>
      <Skybox preset={scene.skybox} />
      <StarField {...(scene.starfield ?? {})} />
      {(scene.lights ?? []).map((l, i) => <Light key={i} {...l} />)}

      {/* the star-dust trail connecting stations (drawn before bodies/beacons) */}
      <Trail nodes={trailNodes} unlockedCount={unlockedCount} />

      {(scene.bodies ?? []).map((b) => {
        const mesh = <Body model={b.model} radius={b.radius} spin={b.spin} />;
        if (b.orbit) {
          const center = bodyPos[b.orbit.around] ?? [0, 0, 0];
          return (
            <Orbit key={b.id} center={center} r={b.orbit.r} period={b.orbit.period} phase={b.orbit.phase ?? 0}>
              {mesh}
            </Orbit>
          );
        }
        return <group key={b.id} position={b.position ?? [0, 0, 0]}>{mesh}</group>;
      })}

      {(scene.beacons ?? []).map((bcn) => (
        <Beacon
          key={bcn.station}
          position={targets[bcn.station]}
          label={bcn.label}
          locked={!unlocked[bcn.station]}
          active={lockedBeacon === bcn.station}
          onSelect={() => actions.lockBeacon(bcn.station)}
        />
      ))}

      <Ship />
      <CameraRig targets={targets} reducedMotion={reducedMotion} />
    </>
  );
}
