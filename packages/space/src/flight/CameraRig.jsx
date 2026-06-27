import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame, useGameActions } from '../store/useGame.js';
import { PHASES } from '../store/gameStore.js';
import { samplePath, flightPath, easeInOut } from './path.js';

// Chase-cam framing offsets from a station, and travel duration.
const CHASE_BACK = 13;
const CHASE_UP = 5;
const TRAVEL_SECONDS = 3.5;

const toObj = (v) => ({ x: v.x, y: v.y, z: v.z });

// Guided flight: when the store enters FLYING toward a locked beacon, fly the
// camera along a smooth arced Catmull-Rom path to a chase position behind the
// target, then dispatch arriveStation. No free 6-DoF piloting (spec §5.1, §7.3).
export default function CameraRig({ targets = {}, reducedMotion = false }) {
  const { camera } = useThree();
  const actions = useGameActions();
  const phase = useGame((s) => s.phase);
  const lockedBeacon = useGame((s) => s.lockedBeacon);

  const flight = useRef(null);          // { points, u, target:[x,y,z] } while traveling
  const _look = useRef(new THREE.Vector3());

  // Begin/cancel a guided flight when the phase or locked beacon changes.
  useEffect(() => {
    if (phase !== PHASES.FLYING || !lockedBeacon || !targets[lockedBeacon]) {
      flight.current = null;
      return;
    }
    const t = targets[lockedBeacon];
    const dest = new THREE.Vector3(t[0], t[1] + CHASE_UP, t[2] + CHASE_BACK);

    if (reducedMotion) {
      camera.position.copy(dest);
      actions.arriveStation(lockedBeacon);
      flight.current = null;
      return;
    }
    flight.current = { points: flightPath(toObj(camera.position), toObj(dest), { arc: 0.2 }), u: 0, target: t };
  }, [phase, lockedBeacon]); // `targets` is stable for the life of a sector

  useFrame((_, dt) => {
    const f = flight.current;
    if (f) {
      f.u = Math.min(1, f.u + dt / TRAVEL_SECONDS);
      const p = samplePath(f.points, easeInOut(f.u));
      camera.position.set(p.x, p.y, p.z);
      _look.current.set(f.target[0], f.target[1], f.target[2]);
      camera.lookAt(_look.current);
      if (f.u >= 1) {
        flight.current = null;
        actions.arriveStation(lockedBeacon);
      }
      return;
    }
    // Idle/approach: keep the current target framed (gentle, no input required).
    const t = targets[lockedBeacon];
    if (t) {
      _look.current.set(t[0], t[1], t[2]);
      camera.lookAt(_look.current);
    }
  });

  return null;
}
