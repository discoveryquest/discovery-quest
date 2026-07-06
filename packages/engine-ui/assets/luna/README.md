# Luna character reference art

Reference images of **Luna**, the discovery-quest owl mascot (the programmatic
version lives in `../../src/LunaOwl.jsx`). Generated with nano-banana, kept as the
source of truth for Meshy image-to-3D and any future re-draws. Plain grey
background + A-pose so they cut out cleanly for 3D.

| file | what |
|------|------|
| `luna-owl-front.png` | base Luna owl, front, A-pose |
| `luna-owl-3q.png`    | base Luna owl, 3/4 view |
| `luna-astronaut-front.png` | Luna in the Mars spacesuit (white + orange trim, bubble helmet), front A-pose |
| `luna-astronaut-3q.png`    | Luna in the Mars spacesuit, 3/4 view |

**Palette** (matches `LunaOwl.jsx`): feathers `#2c3254`/`#4a5380`, cream belly
`#F7F9FF`, orange beak `#FFB953`, yellow eyes `#FFE066`, pink accent `#F472B6`.

Used by: Mars POC (`packages/space/src/mars` — astronaut Luna via Meshy image-to-3D,
`scripts/gen-meshy-assets.mjs`). Candidate source for replacing the programmatic
`LunaOwl` with a glb in the regular courses too.
