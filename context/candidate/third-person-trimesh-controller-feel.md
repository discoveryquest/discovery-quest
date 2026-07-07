---
type: Metatron Decision
scope: packages/space/src/mars/player / third-person Rapier controller feel
confidence: high
source_refs:
  - packages/space/src/mars/player/Player.jsx
  - packages/space/src/mars/player/Luna.jsx
  - packages/space/src/mars/scene/Terrain.jsx
---

## Pattern
A dynamic Rapier capsule walking on a **trimesh** floor jitters, floats, and
strobes the walk cycle unless you decouple the *visual* read from the raw physics
contact. Fugu's UI pass fixed all three at once — reuse these together:

1. **Grounded by terrain probe, not vertical velocity.** The old
   `Math.abs(linvel.y) < ε` check went *true* at the apex of a jump and *false*
   on gentle slopes, so the gait strobed and Luna looked airborne while walking.
   Instead sample the shared height function and check the foot gap:
   `footGap = bodyY - (halfHeight + radius) - terrainHeight(x,z)`, then
   `grounded = footGap > -0.20 && footGap < 0.18 && linvel.y <= 0.65`. This needs
   `terrainHeight()` exported from the terrain module and imported by the player
   (DRY: same function builds the mesh, the collider, and the grounded test).
2. **Snap the capsule to the sampled ground** while grounded: lerp `bodyY` toward
   `terrainHeight + footOffset` (`MathUtils.lerp(y, targetY, min(1, dt*18))`). Glues
   feet to exactly the surface you see — no floating/sliding over the trimesh.
3. **Clamp contact chatter**: when grounded, feed `vy = (cur.y < 0.2 ? 0 : cur.y)`
   back into `setLinvel`. Tiny negative Rapier contact velocities on a trimesh are
   a top source of character/camera jitter; zeroing them is invisible but calming.
   (Also help it settle: `linearDamping≈0.15`, collider `friction≈1.6`,
   `restitution:0`.)
4. **Smooth a separate visual anchor for the camera.** Don't orbit the camera off
   the raw physics translation. Keep a `visualPos` Vector3 and each frame
   `visualPos.lerp(physicsTranslation, 1 - Math.exp(-dt*22))`, then place/aim the
   third-person camera around `visualPos`. The body can micro-chatter; the camera
   won't.

## Cross-cutting: frame-rate-independent smoothing
Everywhere you ease toward a target, use a **dt-based** rate, not a fixed
per-frame factor. `x += (target - x) * 0.25` over-animates at 120fps and
sticks/pops at 30fps. Use `x += (target - x) * (1 - Math.exp(-dt*k))` or
`THREE.MathUtils.damp(x, target, k, dt)`. Fugu applied this to the camera follow
(k≈22), the gait fade-in (k≈10), and Luna's waddle roll/lean (`damp(..., 14, dt)`).

## Rationale
Verified with headless screenshots + live walk captures. Before: camera/character
jitter on the undulating trimesh, feet floating, walk cycle strobing on slopes.
After: stable follow-cam, planted feet, smooth gait at any frame rate. The key
insight is that the *height function is the source of truth* — collider, mesh, and
grounded/snap logic all sample it, and the camera reads a smoothed copy of the
body rather than the body itself.
