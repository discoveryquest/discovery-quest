---
type: Metatron Decision
scope: packages/space/src/mars/scene / ground rendering quality
confidence: high
source_refs:
  - packages/space/src/mars/scene/Terrain.jsx
---

## Pattern
For a large, walkable ground plane, a **procedurally generated tileable texture
beats a small photo crop**. The Mars floor started as a 512px Mastcam-Z panorama
crop tiled ~22× — up close it read like a "blurry printed carpet," and the tile
repeat + mip transition drew a hard seam line across the mid-field. The fix
(Fugu's UI pass) was to generate the regolith at runtime:

- **`makeRegolithTexture(1024)`** — layered tileable value-noise fbm (broad dune
  patches → mid → fine grit → grain) plus sparse deterministic mineral flecks, so
  the surface has real detail at every distance without shipping a big asset.
  Because it's built from the same `hash2`/`valueNoiseTiled` primitives as
  `terrainHeight()`, the displacement and texture stay coherent and deterministic.
- **Use `CanvasTexture`, not `DataTexture`.** A `document.createElement('canvas')`
  + `putImageData` path proved more reliable across Chrome/SwiftShader than an RGB
  `DataTexture` — and the whole verify path runs WebGL in **headless Chrome**, so
  pick the texture type that renders there. Fall back to `DataTexture` only when
  `document` is undefined (SSR/worker).
- **Max anisotropy** (`gl.capabilities.getMaxAnisotropy()`) is what actually kills
  the grazing-angle mip/seam line — set it, don't leave it at 8.
- **Multi-scale de-tile blend** in `onBeforeCompile`: mix the base `map` sample
  with two lower-frequency samples of the *same* texture (`* 0.161` and `* 0.047`,
  each offset) so the eye stops seeing the grid. Also mipmaps on
  (`LinearMipmapLinearFilter` + `generateMipmaps`), `RepeatWrapping`.
- **Dispose generated textures on unmount** (`useEffect(() => () => tex.dispose())`) —
  a runtime-built texture is not GC'd by three automatically.

## `onBeforeCompile` gotchas (cost real debugging time)
1. `onBeforeCompile` is called by three with the **shader** object. In R3F you
   pass the *function* as a prop: `<meshStandardMaterial onBeforeCompile={deTile}>`,
   and `deTile(shader)` mutates `shader.fragmentShader`. A first attempt wrote
   `deTile(material){ material.onBeforeCompile = (shader)=>… }` **and** passed it as
   the prop — so it wrapped itself, `fragmentShader` was never touched, and de-tiling
   silently never ran (looked like it "didn't help"). The callback signature is
   `(shader) => {}`, full stop.
2. Set **`customProgramCacheKey={() => 'some-stable-id'}`** on the material.
   Without a distinct cache key three can hand back a cached program compiled
   without your injection (or share one across materials), so the shader edit
   appears to do nothing intermittently.

## Rationale
Verified with the headless-screenshot path: the generated 1024px texture removed
the "printed carpet" look and the de-tile blend + max anisotropy erased the hard
mid-field seam the user reported. Generating the texture also drops a shipped
binary asset and keeps the ground visually consistent with the deterministic
terrain height function. See candidate `visual-verification-via-headless-screenshot`.
