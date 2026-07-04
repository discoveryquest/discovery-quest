#!/usr/bin/env node
// Minimal, zero-dependency harness for talking to Fugu (Sakana) via its
// OpenAI-compatible chat/completions endpoint. Reads credentials from .env;
// NEVER prints the API key.
//
// .env keys:
//   FUGU_API_KEY=...                 (required)
//   FUGU_BASE_URL=https://.../v1     (required — copy from your Sakana dashboard)
//   FUGU_MODEL=fugu-ultra-20260615   (optional; default below)
//
// Usage:
//   node scripts/fugu.mjs --ping
//   node scripts/fugu.mjs --system @prompt.system.txt --prompt @prompt.user.txt --out out.md
//   node scripts/fugu.mjs --prompt "Write a Three.js starfield" --attach docs/specs/2026-06-23-space-quest-immersive-design.md --out scaffold.md
//
// Flags:
//   --system <text|@file>   system message
//   --prompt <text|@file>   user message (required unless --ping)
//   --attach <file>         append a file to the user message (repeatable)
//   --out <file>            write the assistant reply here (else stdout)
//   --model <id>            override FUGU_MODEL
//   --max-tokens <n>        default 8000
//   --temperature <n>       default 0.7
//   --ping                  send a tiny health-check request

import { readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_MODEL = 'fugu-ultra-20260615';

// --- tiny .env loader (does not overwrite existing process.env) ---
function loadDotEnv(path = '.env') {
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return; }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

// --- arg parsing ---
function parseArgs(argv) {
  const args = { attach: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ping') args.ping = true;
    else if (a === '--system') args.system = argv[++i];
    else if (a === '--prompt') args.prompt = argv[++i];
    else if (a === '--attach') args.attach.push(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--temperature') args.temperature = Number(argv[++i]);
    else if (a === '--no-stream') args.noStream = true;
    else if (a === '--raw') args.raw = true;
    else throw new Error(`Unknown flag: ${a}`);
  }
  return args;
}

// "@path" → file contents; otherwise the literal string.
function resolveText(val) {
  if (val == null) return val;
  if (val.startsWith('@')) return readFileSync(val.slice(1), 'utf8');
  return val;
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));

  const key = process.env.FUGU_API_KEY;
  const base = (process.env.FUGU_BASE_URL || '').replace(/\/+$/, '');
  const model = args.model || process.env.FUGU_MODEL || DEFAULT_MODEL;

  if (!key) { console.error('✗ FUGU_API_KEY missing in .env'); process.exit(1); }
  if (!base) {
    console.error('✗ FUGU_BASE_URL missing in .env — copy it from your Sakana dashboard, e.g.\n    FUGU_BASE_URL=https://api.sakana.ai/v1');
    process.exit(1);
  }

  const messages = [];
  const system = resolveText(args.system);
  if (system) messages.push({ role: 'system', content: system });

  let user = resolveText(args.prompt) || (args.ping ? 'Reply with exactly: OK' : '');
  if (!user && !args.ping) { console.error('✗ --prompt is required (or use --ping)'); process.exit(1); }
  for (const f of args.attach) {
    user += `\n\n----- ATTACHED FILE: ${f} -----\n` + readFileSync(f, 'utf8');
  }
  messages.push({ role: 'user', content: user });

  const url = `${base}/chat/completions`;
  // Stream by default: long generations on a non-streaming request hold the connection
  // open until the whole completion is ready, which routinely gets dropped ("fetch failed").
  // Streaming keeps bytes flowing so the connection stays alive and we see progress.
  const stream = !args.noStream && !args.ping;
  const body = {
    model,
    messages,
    max_tokens: args.maxTokens ?? (args.ping ? 16 : 8000),
    temperature: args.temperature ?? 0.7,
    stream,
    ...(stream ? { stream_options: { include_usage: true } } : {}),
  };

  console.error(`→ POST ${url}  (model: ${model}, ${messages.length} msgs, stream: ${stream})`);
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`✗ Network error: ${e.message}\n  (If sandboxed, this call needs network access.)`);
    process.exit(2);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`✗ HTTP ${res.status} ${res.statusText}\n${text.slice(0, 2000)}`);
    process.exit(3);
  }

  // Debug: dump the unparsed response body verbatim (to inspect the real SSE/JSON shape).
  if (args.raw) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let raw = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; raw += decoder.decode(value, { stream: true }); }
    console.error(`✓ ${Date.now() - t0}ms  raw ${raw.length} chars`);
    if (args.out) { writeFileSync(args.out, raw); console.error(`✓ wrote raw → ${args.out}`); }
    else process.stdout.write(raw);
    return;
  }

  let content = '';
  let usage;

  if (!stream) {
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { console.error('✗ Non-JSON response:\n' + text.slice(0, 2000)); process.exit(4); }
    content = data?.choices?.[0]?.message?.content ?? '';
    usage = data?.usage;
  } else {
    // Parse Server-Sent Events: lines of `data: {json}`, terminated by `data: [DONE]`.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let dots = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          let j;
          try { j = JSON.parse(payload); } catch { continue; }
          const delta = j?.choices?.[0]?.delta?.content;
          if (delta) { content += delta; if (++dots % 20 === 0) process.stderr.write('.'); }
          if (j?.usage) usage = j.usage;
        }
      }
    } catch (e) {
      // Mid-stream drop: keep whatever we got so the work isn't lost.
      console.error(`\n✗ Stream interrupted after ${content.length} chars: ${e.message}`);
      if (args.out && content) { writeFileSync(args.out, content); console.error(`  (partial output saved → ${args.out})`); }
      process.exit(2);
    }
    process.stderr.write('\n');
  }

  console.error(`✓ ${Date.now() - t0}ms` + (usage ? `  tokens: ${usage.prompt_tokens}+${usage.completion_tokens}=${usage.total_tokens}` : ''));
  if (args.out) { writeFileSync(args.out, content); console.error(`✓ wrote ${content.length} chars → ${args.out}`); }
  else process.stdout.write(content + '\n');
}

main().catch((e) => { console.error('✗ ' + (e?.stack || e?.message || e)); process.exit(1); });
