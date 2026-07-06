---
type: Metatron Decision
scope: deployment / public assets
confidence: high
source_refs:
  - platform/apps/space-quest/public
---

## Pattern
Before relying on any new static asset in a deploy (screenshots, course art,
3D models, textures, audio), **verify it survives the `.dockerignore` /
`.gitignore` patterns**. Broad patterns like `**/shots` have silently dropped
real course assets from builds. Put deploy assets under the app's `public/<area>/`,
run `git check-ignore -v <path>` (expect no output), and after deploy confirm each
asset serves with `curl` (200 + correct `content-type`) plus a real click — not a
hit-test. Add an ignore-negation if a pattern catches a needed asset.

## Rationale
The ignore rules were written for throwaway artifacts but are broad enough to catch
intended assets, and the failure is invisible locally (assets exist in the working
tree) — it only shows as a broken live site. An explicit pre-deploy check is the
only reliable guard.
