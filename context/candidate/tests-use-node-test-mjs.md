---
type: Metatron Decision
scope: packages/*/src
confidence: high
source_refs:
  - packages/space/package.json
  - packages/space/src/course.test.mjs
---

## Pattern
Unit tests use **Node's built-in test runner** (`node --test`) with **`*.test.mjs`**
files colocated next to the source they cover. The package `test` script is
literally `node --test`. Do **not** introduce vitest, jest, or mocha, and do not
add a test-framework dependency. Write tests with `import { test } from 'node:test'`
and `import assert from 'node:assert/strict'`. Reserve automated tests for **pure
logic** (config validators, math, selection, deterministic generators); verify
React/R3F/visual components by running the app and looking, not by unit-testing
the render.

## Rationale
The repo deliberately avoids a test-framework dependency to keep packages
lightweight and consumable from source. `node --test` needs no install and runs
`.mjs` ESM directly. Unit-testing 3D/visual output is brittle and low-value, so the
convention is to keep the tested surface pure and functional.
