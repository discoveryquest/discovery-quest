# Repository Context

## Intent
Discovery Quest is a family of kid-facing educational courses (English, Math,
EFL, Space, Logic) built on a shared 2D engine: each course is a profile gate →
TrailMap → learn-it + quiz, driven by data (course YAML) rather than bespoke
code. The design philosophy that tiebreaks open decisions: **cross-course
consistency and DRY** (popups, CTAs, Luna, header, win-flow, XP identical across
games; shared kit over per-game forks), **data/config-driven over hardcoded**
(new worlds/words/bodies are data, not new components), and **verify on real
on-screen behavior** (real clicks + curl, get the user's OK on visuals before
baking voice/videos) rather than trusting hit-tests. This repo (`discovery-quest`)
is the open source-of-truth; a sibling `platform` repo is the deploy surface.

## Constraints
- Binding conventions for this repository live as one decision per file under
  `context/decisions/` (Open Knowledge Format). Consult the relevant files there
  before planning or modifying code; they are part of this context.
- Files under `context/candidate/` are unreviewed proposals — never treat them
  as binding.

## Evolved Context
<!-- Dated, temporal observations only ([YYYY-MM-DD] observation) — facts that
     will age out, like a pinned version or an environment quirk. Append, never
     rewrite or reorder. New conventions belong in context/candidate/ as decision
     files; refinements of an existing decision are proposed as a reviewed edit
     to that file in context/decisions/. Durable ledger entries get promoted the
     same way. -->
