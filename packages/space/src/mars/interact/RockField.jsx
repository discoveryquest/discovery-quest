import { useMemo, useRef, useState } from 'react';
import Rock from './Rock.jsx';
import InteractionController from './InteractionController.jsx';
import { terrainHeight } from '../scene/Terrain.jsx';

const SPAWNS = [
  { id: 'basalt', x: -1.45, z: -2.15, radius: 0.34, shade: '#4c241a' },
  { id: 'hematite', x: 1.15, z: -2.75, radius: 0.28, shade: '#6b2d1f' },
  { id: 'mineral', x: 2.25, z: -1.0, radius: 0.25, shade: '#6f7f87', interesting: true },
  { id: 'chunk', x: -2.4, z: -3.25, radius: 0.42, shade: '#5a2a1c' },
];

function spawnToPos(spawn) {
  return [spawn.x, terrainHeight(spawn.x, spawn.z) + spawn.radius + 0.12, spawn.z];
}

// Owns the throwable rocks and their refs. InteractionController does the per-
// frame selection/hold/throw/recall work so the rock component stays focused.
export default function RockField() {
  const rocks = useMemo(() => SPAWNS, []);
  const rockRefs = useRef(new Map());
  const [heldId, setHeldId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const respawnRock = (id, pos) => {
    const rb = rockRefs.current.get(id);
    if (!rb) return;
    rb.setGravityScale?.(1, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    rb.setTranslation(pos, true);
  };

  return (
    <>
      {rocks.map((rock) => (
        <Rock
          key={rock.id}
          ref={(rb) => {
            if (rb) rockRefs.current.set(rock.id, rb);
            else rockRefs.current.delete(rock.id);
          }}
          id={rock.id}
          position={spawnToPos(rock)}
          radius={rock.radius}
          selected={selectedId === rock.id}
          held={heldId === rock.id}
          interesting={rock.interesting}
        />
      ))}
      <InteractionController
        rocks={rocks}
        rockRefs={rockRefs}
        heldId={heldId}
        setHeldId={setHeldId}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        respawnRock={respawnRock}
      />
    </>
  );
}
