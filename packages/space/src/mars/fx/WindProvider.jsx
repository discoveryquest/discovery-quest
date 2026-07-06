import { createContext, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { gustAt } from './wind.js';
import { windState } from './windState.js';
import { marsConfig } from '../world/marsConfig.js';

// Single wind clock for the whole scene. Each frame it samples the deterministic
// gust profile (gustAt — unit-tested, seeded so the wind is reproducible) and
// updates the shared windState: dust drift, pennant sway, the HUD gauge and the
// ambient-audio gain (M6) all read from that one object. Exposed via context too
// so future consumers can `useWind()`, but the hot-path readers use windState
// directly to stay off the React re-render path (see telemetry.js).
const WindContext = createContext(windState);
export const useWind = () => useContext(WindContext);

export default function WindProvider({ children }) {
  useFrame((state) => {
    const g = gustAt(marsConfig.wind.seed, state.clock.elapsedTime);
    windState.gust = g;
    windState.speed =
      marsConfig.wind.baseSpeed +
      (marsConfig.wind.gustSpeed - marsConfig.wind.baseSpeed) * g;
  });
  return <WindContext.Provider value={windState}>{children}</WindContext.Provider>;
}
