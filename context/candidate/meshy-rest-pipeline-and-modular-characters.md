---
type: Metatron Decision
scope: 3D assets / Meshy generation
confidence: medium
source_refs:
  - scripts/gen-meshy-assets.mjs
  - scripts/meshy-fetch.mjs
  - packages/space/src/mars/player/Luna.jsx
  - packages/engine-ui/assets/luna
---

## Pattern
Generating game-ready 3D characters with **Meshy** (REST API directly — no MCP
needed; `MESHY_API_KEY` from `platform/.env`, `Authorization: Bearer`):

- **Endpoints:** text-to-3d is `POST /openapi/v2/text-to-3d` (preview → refine, two
  billed stages); image-to-3d is `POST /openapi/v1/image-to-3d` (single stage) and
  gives far more on-brand results for an existing character. Feed a **local
  reference as a base64 `data:image/png;base64,…` URI** (no hosting). Poll
  `GET .../{taskId}` for `SUCCEEDED` + `model_urls.glb`; downloads outlive a single
  poll, so keep a resumable fetch-by-id (`meshy-fetch.mjs`).
- **Model gotchas:** use `ai_model: "meshy-6"` (newest). **meshy-4 is deprecated**
  (400) and **`enable_pbr` is meshy-5 only** (meshy-4/6 400 on it). **meshy-5 image-
  to-3d can hang at 49%** (the geometry→texture checkpoint); 49% is also just slow
  for detailed meshes, so wait ~10–12 min before declaring a hang — a fresh resubmit
  clears a true stall.
- **Meshy cannot make transparent glass** — image-to-3d reconstructs a clear helmet
  as an opaque cap. For glass, generate the character helmet-less and add a real
  three.js dome (`meshPhysicalMaterial`, low opacity + clearcoat) in-scene.
- **Reference art:** plain flat-grey background + front A-pose (wings/arms slightly
  out) segments cleanly; keep the set in `packages/engine-ui/assets/luna` (shared).
- **Modular characters:** build from parts (base body glb + wearable-suit glb +
  in-scene dome) so the base mascot is reusable. Fit each glb by bounding box (scale
  to a target height, seat feet at y=0, centre x/z). **The head is NOT at the bbox
  centre** for an asymmetric body/tail, so seating a head in a suit collar or a
  helmet on a head needs **hand-tuned x/y/z offsets per glb** (constants at the top
  of `Luna.jsx`). An opaque suit hides the base body tucked inside it, so only the
  head needs to line up.

## Rationale
image-to-3d from the real character art keeps Luna on-brand where a text prompt
drifts to a generic astronaut. Recording the endpoint/model/param matrix and the
49%-hang behavior avoids re-discovering them (and wasting credits) on the next
character or planet. The bbox-fit + hand-tuned-head-offset recipe is the reliable
way to compose independently-generated glbs, and the three.js dome is the only way
to get glass. All verified via the headless model-preview + in-scene screenshots.
