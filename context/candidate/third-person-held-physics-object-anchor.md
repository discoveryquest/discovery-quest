---
type: Metatron Decision
scope: packages/space/src/mars/interact / third-person interaction
confidence: medium
source_refs:
  - packages/space/src/mars/interact/InteractionController.jsx
  - packages/space/src/mars/player/Player.jsx
---

## Pattern
When a throwable/held physics object is shown in **third-person**, anchor its
held position to the avatar's hand/body space, not to the camera-forward vector.
Camera-forward anchoring works in first-person, but in third-person it places the
object between the camera and character, visually swallowing the avatar and
making the action read like a UI overlay instead of Luna holding something.

For this Mars POC, use two hold anchors:
- first-person: `camera.position + cameraForward * holdDistance + downOffset`
- third-person: `playerPosition + playerForward * handForward + playerRight *
  handSide + handHeight`

Keep the throw direction educationally honest: use the same release speed/impulse
regardless of Mars/Earth gravity mode, so the different arc comes from gravity,
not a hidden assist.

## Refinement (Fugu UI pass): body-facing, not camera-yaw
Once the avatar can **orbit the camera independently of its heading** (drag-look +
GTA-style turning where Luna faces her movement direction, not the camera), the
third-person "playerForward" used for the hold anchor **must be the avatar's actual
body-facing vector, not the camera yaw**. Player now writes its eased heading to
`telemetry.facingX/facingZ` each frame, and the interaction controller reads that:
`forward = (telemetry.facingX, 0, telemetry.facingZ)`,
`right = (-forward.z, 0, forward.x)`. If you instead anchor to `input.yaw` (the
camera), orbiting the camera swings the held rock around Luna and changes the throw
aim even though she hasn't turned — the interaction is **body-space, not
camera-space**. (First-person still uses camera-forward; there the camera *is* the
body facing.)

## Rationale
Verified visually with headless screenshots during M4. The first implementation
made the held rock fill the lower half of the third-person camera view; moving it
to a body/hand-space anchor made Luna visibly "hold" the rock and improved the
shareable throw shot without changing the physics system.
