// gen-schema — compile each app's engine capability catalog (engine.capabilities.json) into a
// JSON Schema (course.schema.json) that validates a course package's STRUCTURE: the course /
// world / station / lesson / beat shape, `station.board` ∈ the engine's board kinds,
// `beat.view.kind` ∈ the view kinds, AND each view's props against the fields the catalog
// declares (required + types). One artifact, three consumers: editors (`$schema` autocomplete),
// CI (`course:check` runs it through AJV), and LLMs (structured-output / tool schema). The
// cross-reference + audio invariants JSON Schema can't express (caption == narration, lesson
// resolves, audio fresh) stay in course-check's semantic layer.
//   node scripts/gen-schema.mjs            → write apps/<app>/course.schema.json
//   node scripts/gen-schema.mjs --check    → fail if a committed schema is stale
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = (p) => fileURLToPath(new URL(p, import.meta.url));
const APPS = ['packages/math', 'packages/english', 'packages/space'];

// catalog field type → JSON Schema fragment. Optional (non-required) fields also accept
// `null`, because the exporter serializes "no value" as an explicit null (e.g. `active: null`
// = no column highlighted), and authors do the same.
function fieldSchema(t, nullable) {
  const base = (() => {
    switch (t) {
      case 'string': return { type: 'string' };
      case 'int': return { type: 'integer' };
      case 'number': return { type: 'number' };
      case 'bool': return { type: 'boolean' };
      case 'enum': return { type: 'string' }; // allowed values live in the field `note` (free text)
      case 'string[]': return { type: 'array', items: { type: 'string' } };
      case 'int[]': return { type: 'array', items: { type: 'integer' } };
      case 'object[]': return { type: 'array', items: { type: 'object' } };
      case 'object': return { type: 'object' };
      case 'int|string': return { type: ['integer', 'string'] };
      case 'number|string': return { type: ['number', 'string'] };
      default: return {}; // unknown → unconstrained (don't reject what we can't describe)
    }
  })();
  if (nullable && base.type) base.type = [...(Array.isArray(base.type) ? base.type : [base.type]), 'null'];
  return base;
}

// one view kind → an if/then branch: when view.kind == this, constrain its props (strict:
// only declared props + kind/key allowed, so typos like `wrod` are caught).
function viewBranch(v) {
  const properties = { kind: { const: v.kind }, key: { type: ['string', 'number'] } };
  for (const f of v.fields || []) {
    properties[f.name] = { ...fieldSchema(f.type, !f.required), ...(f.note ? { description: f.note } : {}) };
  }
  const required = ['kind', ...(v.fields || []).filter((f) => f.required).map((f) => f.name)];
  return {
    if: { properties: { kind: { const: v.kind } }, required: ['kind'] },
    then: { properties, required, additionalProperties: false },
  };
}

// one content collection's metadata → a schema for its value under `content:`
function contentSchema(c) {
  const objOf = (fields) => {
    const properties = {}; const required = [];
    for (const f of fields || []) {
      properties[f.name] = { ...fieldSchema(f.type, !f.required), ...(f.note ? { description: f.note } : {}) };
      if (f.required) required.push(f.name);
    }
    return { properties, required };
  };
  if (c.collection === 'strings') return { type: 'array', items: { type: 'string' } };
  if (c.collection === 'objects') {
    const { properties, required } = objOf(c.item);
    return { type: 'array', items: { type: 'object', properties, required, additionalProperties: false } };
  }
  if (c.collection === 'wordbank') {
    const { properties, required } = objOf(c.fields);
    return { type: 'object', properties, required };
  }
  return {}; // unknown collection kind → unconstrained
}

function buildSchema(appDir, cap) {
  const boardKinds = cap.boards.map((b) => b.kind);
  const viewKinds = cap.views.map((v) => v.kind);
  // known content collections → per-key item validation; unknown keys stay permitted
  const contentProps = Object.fromEntries((cap.content || []).map((c) => [c.id, contentSchema(c)]));
  const app = path.basename(appDir);
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://discoveryquest.app/schema/${app}/course.schema.json`,
    title: `Discovery Quest course — ${app}`,
    $comment: `GENERATED from engine.capabilities.json v${cap.version} by gen-schema.mjs. Do not edit by hand.`,
    type: 'object',
    required: ['course'],
    properties: { course: { $ref: '#/$defs/course' } },
    additionalProperties: false,
    $defs: {
      course: {
        type: 'object',
        required: ['formatVersion', 'id', 'title', 'subject', 'worlds'],
        properties: {
          formatVersion: { type: 'integer' },
          id: { type: 'string' },
          title: { type: 'string' },
          subject: { type: 'string' },
          companion: { type: 'string' },
          voice: { type: 'object' },
          engine: { type: 'string' },
          lowercase: { type: 'boolean' },
          ui: { type: 'object' },
          reactions: { type: 'object' },
          worlds: { type: 'array', minItems: 1, items: { $ref: '#/$defs/world' } },
          lessons: { type: 'object', additionalProperties: { $ref: '#/$defs/lesson' } },
          narration: { type: 'object', additionalProperties: { type: 'string' } },
          // known collections are validated by item shape; unknown keys are permitted
          // (course-check warns on them) so a course can ship data we don't yet model.
          content: { type: 'object', properties: contentProps },
        },
      },
      world: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' }, title: { type: 'string' },
          emoji: { type: 'string' }, color: { type: 'string' }, blurb: { type: 'string' },
          soon: { type: 'boolean' },
          stations: { type: 'array', items: { $ref: '#/$defs/station' } },
        },
      },
      station: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' }, title: { type: 'string' },
          icon: { type: 'string' }, sub: { type: 'string' },
          board: { enum: boardKinds },
          bands: { type: 'array', items: { type: 'integer' }, minItems: 1 },
          lesson: { type: 'string' }, content: { type: 'string' }, concept: { type: 'string' },
          soon: { type: 'boolean' },
        },
        // a playable (non-soon) station must name a board + bands
        if: { properties: { soon: { const: true } }, required: ['soon'] },
        then: true,
        else: { required: ['board', 'bands'] },
      },
      lesson: {
        type: 'object',
        required: ['title', 'sections'],
        properties: {
          title: { type: 'string' },
          sections: { type: 'array', items: { $ref: '#/$defs/section' } },
        },
      },
      section: {
        type: 'object',
        required: ['id', 'beats'],
        properties: {
          id: { type: 'string' }, label: { type: 'string' },
          beats: { type: 'array', items: { $ref: '#/$defs/beat' } },
        },
      },
      beat: {
        type: 'object',
        required: ['say', 'caption', 'view'],
        properties: {
          say: { type: 'string' },
          caption: { type: 'string' },
          advance: { type: ['string', 'number'] },
          view: { $ref: '#/$defs/view' },
        },
      },
      view: {
        type: 'object',
        required: ['kind'],
        properties: { kind: { enum: viewKinds } },
        allOf: cap.views.map(viewBranch),
      },
    },
  };
}

const check = process.argv.includes('--check');
let drift = 0;

for (const appDir of APPS) {
  const capPath = root(`../${appDir}/engine.capabilities.json`);
  const cap = JSON.parse(readFileSync(capPath, 'utf8'));
  const text = JSON.stringify(buildSchema(appDir, cap), null, 2) + '\n';
  const out = root(`../${appDir}/course.schema.json`);
  const rel = path.relative(root('..'), out);
  if (check) {
    const have = existsSync(out) ? readFileSync(out, 'utf8') : null;
    if (have === text) console.log(`✓ ${rel} fresh`);
    else { drift++; console.error(`✗ ${rel} STALE — run \`npm run course:schema\` and commit the result`); }
  } else {
    writeFileSync(out, text);
    console.log(`${rel} — ${cap.boards.length} board kinds, ${cap.views.length} view kinds`);
  }
}

if (drift) process.exit(1);
