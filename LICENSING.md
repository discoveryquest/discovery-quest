# Licensing & contributor terms

> ⚠️ **Draft — pending legal review before the first public release.** This describes the intended
> model; the binding terms are the `LICENSE` file + the accepted CLA.

Discovery Quest is **open source with an open-core business**, in the WordPress / GitLab mould: the
engine is genuinely free and open, and the company is built on hosting, AI generation, premium
content, and enterprise features — not on restricting the code.

## The layers

| Layer | License | What it means |
|---|---|---|
| **Engine code** — `packages/*`, `scripts/*` | **AGPL-3.0** (+ CLA, below) | Free to use, study, modify, and self-host — including by schools and businesses. AGPL's network clause means anyone who runs a **modified** version as a service must publish their changes under AGPL too. See `LICENSE`. |
| **Community course content** — `*.course.yml`, lessons, narration text, word banks | **CC BY-SA 4.0** | Free to use and adapt (incl. by schools/companies) with attribution + share-alike. *(Note: not NC — community content is meant to be freely usable; the business is hosting/AI/premium, not gating the commons.)* |
| **Official / premium content** | Proprietary | Discovery Quest's own polished + premium worlds, sold via the platform. Not in this repo. |
| **Hosted platform, AI generation, dashboards, enterprise** | Commercial SaaS | The business. |
| **Commercial engine license** | Paid exception to AGPL | For organizations that want to build on the engine **without** AGPL obligations (e.g. embed it in a closed product). Contact **hello@discoveryquest.app**. *(This option exists precisely because the engine is copyleft.)* |

Canonical texts: AGPL-3.0 → https://www.gnu.org/licenses/agpl-3.0.txt (included in `LICENSE`) ·
CC BY-SA 4.0 → https://creativecommons.org/licenses/by-sa/4.0/.

## Why AGPL + CLA (not noncommercial)

The goal is an **ecosystem** — schools, homeschoolers, and third-party course creators all using and
contributing freely — plus a business. A noncommercial license would chill exactly the for-profit
educational adopters and contributors that grow an ecosystem, and would lock the project out of ever
becoming a real platform. AGPL keeps the engine genuinely open (adoption + contributor trust) while
its network-copyleft stops a competitor from running a **closed** hosted fork; the **CLA** then lets
Discovery Quest dual-license commercially, keep premium features proprietary, and host community
content — without being bound by AGPL itself.

## Contributor License Agreement (CLA) — what rights you grant

When you contribute (a course, lesson, world, word list, or engine code):

- **You keep your copyright** and your authorship credit.
- **You grant Discovery Quest a license** that is **perpetual, worldwide, irrevocable, royalty-free,
  sublicensable, and transferable** to use, reproduce, modify, adapt, translate, publish, host,
  perform, and distribute your contribution **and derivative works — including for commercial
  purposes** (the paid hosted apps, premium bundles) and to **relicense** it as part of the product.
- **Your contribution is also published** to the public repo under its layer's open license (engine
  code under AGPL-3.0; course content under CC BY-SA 4.0), so the community gets it under open terms
  while the company can also use it commercially. This asymmetry — open outbound, broad inbound — is
  the whole point of a CLA in an open-core project, and it's what lets the project **change its open
  license later** if the ecosystem needs it.
- **You warrant** the work is yours (or you have the rights), is original, contains no third-party
  material you don't have rights to, collects no personal data, includes no external links, and is
  age-appropriate for young children.

**In plain terms — what the owner gets:** the right to ship, edit, translate, and monetize a
contributed course or code in the hosted product, indefinitely, even after the contributor leaves —
while the contributor keeps copyright + credit and the community keeps it under the open license.

### How it's collected
- Start lightweight: a **DCO sign-off** (`git commit -s` → `Signed-off-by:`) plus one-line acceptance
  of these terms in the PR template; or
- A proper **CLA** (individual + entity) gated by a CLA-assistant bot before merge.

Recommendation: PR-template acceptance + DCO now; CLA bot once external submissions flow. **Have a
lawyer review the AGPL + CLA + commercial-exception structure before the first public release** —
copyleft, broad CLAs, and dual-licensing all have real edge cases.
