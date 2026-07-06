// Lesson beats and practice steps each mount their own <Canvas>; browsers cap
// live WebGL contexts (~16) and reclaim old ones only on GC — so stepping
// through beats piles up contexts until Chrome kills the OLDEST live one
// ("THREE.WebGLRenderer: Context Lost" → blank scene). Mount this inside every
// short-lived Canvas to release its context deterministically on unmount.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function ReleaseContextOnUnmount() {
  const gl = useThree((s) => s.gl);
  useEffect(() => () => {
    // defer past r3f's own teardown so we don't yank the context mid-dispose
    setTimeout(() => { try { gl.forceContextLoss(); gl.dispose(); } catch { /* already gone */ } }, 0);
  }, [gl]);
  return null;
}
