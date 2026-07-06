
<!-- METATRON:START (managed by metatron context setup — safe to edit inside) -->
## Codebase conventions via Metatron (files) — consult FIRST

This repo's conventions ("decisions") live as Open Knowledge Format markdown under
`context/` — `context/decisions/` is canonical, `context/candidate/` is proposed
(unreviewed). In a monorepo each app has its own `context/`; use the one **nearest**
the files you are touching.

**Before you Read, Grep, Glob, or Edit code in an area — and before proposing an
implementation — first read the relevant files in the nearest `context/decisions/`
and follow them.** State that you consulted them; do not rediscover conventions
manually until you have.

When you find a durable convention not already captured, **author it as a candidate**:
a new OKF file in the nearest `context/candidate/` (see the `context-okf-llm-ingest` skill in
`.roo/skills/`). Candidates are uncurated proposals for human review.

**Promotion to canonical is human-gated.** Never move a file into `context/decisions/`
yourself; a human does that via `git mv` reviewed in a pull request (see the
`context-okf-promote-candidates` skill). Nothing self-promotes.
<!-- METATRON:END -->
