---
type: Metatron Decision
scope: 3D / sky + environment art
confidence: medium
source_refs:
  - packages/space/src/mars/scene/SkyDome.jsx
---

## Pattern
Do not use a NASA rover surface panorama (e.g. Perseverance Mastcam-Z Sol 3) as a
wrap-around skybox texture. These panoramas are **foreground/rover-deck heavy** —
most of the image is nearby ground and the rover's own body, with only a thin sky
strip — so mapped equirectangular onto a sphere they fill the view with stretched
ground, not sky. For a believable planetary sky, drive it from **color** (a
vertical gradient between a zenith and a hazy-horizon color, the actual realism
cue) and blend the near terrain into it with scene fog set to the horizon color.
If real distant hills are wanted, add them as a separate horizon *cylinder* band
sized to the panorama's vertical FOV, not as a full-sphere skybox — and pick a
sky-heavy source image, not a deck-heavy one.

## Rationale
Verified visually (headless screenshot): the equirect sphere put the rover deck
and foreground rocks across the top of the view. Rover panoramas are shot to
document terrain, so their vertical framing is wrong for a skybox. A procedural
gradient is reliable, cheap, reads as Mars immediately, and avoids the seam/stretch
artifacts — while the genuinely useful NASA asset (the rover 3D model) is still
used as a findable landmark.
