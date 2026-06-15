# EFL content expansion — word-worlds + first sentence module (design + plan)

**Date:** 2026-06-15 · **Status:** designed + spec-reviewed (owner AFK — decisions made
autonomously per "expand the spec + implement all EFL"; flagged where a choice was mine).
Extends the shipped, YAML-driven EFL course (`english-ru.course.yml`).

## Goal
Grow «Учим английский» from 3 vocab worlds to a fuller course: **3 more word-worlds**
(Family, Numbers, Body) on the existing `pictureMatch`/`vocabListen` boards, plus the course's
**first sentence module** — a new EFL "build the sentence" interaction (Russian-scaffolded,
audio-first) and **2 sentence-worlds**. Words = YAML + voice; sentences = a small,
backward-compatible engine addition + YAML + voice. Then voice-gen, verify, **document the new
capability** (public repo + website), deploy.

## Current state
3 worlds (Animals b0 / Food b1 / Colours b2), 32 band-tagged `vocab` words, boards
`pictureMatch` + `vocabListen`. `course:check` green. The shared loader/registry already carries
all English Quest boards (incl. `sentence`/SentenceBuilder); EFL reuses board components. The
loader routes a station to its board via `registry[station.board].board` (NOT `problem.kind`), and
`sliceByBand` filters any collection whose items carry `band`.

---

## Part A — three new word-worlds (content only)

Same template as existing worlds: world → 2 stations (pictureMatch + vocabListen, `bands:[N]`,
shared `lesson`), band-tagged `vocab`, a Russian Learn-it lesson + narration. Distinct colors.
(`pictureMatch` shows the `ru` gloss under the word, which disambiguates same-category emoji —
relevant for Family/Body where distractors are all humans/body-parts.)

### A1. Family — `family`, band 3, 👪 Семья, color `#F472B6`
mom 👩 мама · dad 👨 папа · sister 👧 сестра · brother 👦 брат · baby 👶 малыш ·
grandma 👵 бабушка · grandpa 👴 дедушка · family 👪 семья

### A2. Numbers — `numbers`, band 4, 🔢 Числа, color `#60A5FA`
one 1️⃣ один · two 2️⃣ два · three 3️⃣ три · four 4️⃣ четыре · five 5️⃣ пять · six 6️⃣ шесть ·
seven 7️⃣ семь · eight 8️⃣ восемь · nine 9️⃣ девять · ten 🔟 десять

### A3. Body — `body`, band 5, 🧍 Тело, color `#2DD4BF`
hand ✋ рука · eye 👁️ глаз · nose 👃 нос · ear 👂 ухо · mouth 👄 рот · foot 🦶 нога ·
tooth 🦷 зуб · face 🙂 лицо

Each world gets: a `<world>` lesson (mirror the Food lesson: intro → 2 example beats → "your
turn"), its 4 `la-<world>-N` narration lines, and the 2 stations referencing it.

---

## Part B — first sentence module (engine + content)

### B0. The interaction (my design decision — owner AFK; reversible)
**"Собери предложение" — translation-scaffolded, audio-first sentence building.** The kid sees the
Russian meaning, then taps scrambled **English** word-tiles into order to build the English
sentence; **each tile speaks its English word on tap** (audio-first, EFL-appropriate). Reuses the
existing `SentenceBuilder` board (+ a small opt-in audio enhancement) and is unmistakably "a
sentence." *Alternative considered:* a new "hear-sentence → pick-picture" comprehension board —
better receptive pedagogy but a whole new component; deferred. **Owner review flag:** build-a-
sentence for absolute beginners is the one pedagogical call made AFK — quick to soften (shorter
sentences) or swap.

### B1. Engine changes (open-core, backward-compatible — English Quest's `sentence` board must stay identical)
Edit **all four catalog/files before regenerating** (gen-capabilities checks boardMeta↔registry in
lockstep, so an intermediate state would error):
1. **`packages/english/src/boards/SentenceBuilder.jsx`** — two backward-compatible changes:
   (a) the two hard-coded English literals become defaults: `{step.placeholder ?? 'tap the words…'}`
   and `It reads:` → `{step.readsLabel ?? 'It reads:'}`.
   (b) **opt-in tap audio:** on a tile tap, if `step.tokenAudio` is truthy, call
   `speak('word-' + clean(token))` (import `speak` from `@discoveryquest/voice-kit/audio`;
   `clean(w)=w.toLowerCase().replace(/[^a-z]/g,'')` so `cat.`→`word-cat`, `I`→`word-i`). English
   Quest's `genBuildSentence` does NOT set `tokenAudio`/`placeholder`/`readsLabel`, so it is
   unchanged.
2. **`contentMeta.js`** — add `sentencesRu` collection: `objects`, item fields
   `[{name:'en',type:'string',required:true},{name:'ru',type:'string',required:true},{name:'band',type:'number',required:false}]`.
3. **`boardMeta.js`** — add board kind `sentenceRu` with a clear `description` (it flows into the
   public capability catalog): e.g. *"Build an English sentence from scrambled word tiles, prompted
   by its native-language meaning; each tile speaks its word. Foreign-language sentence
   construction."* `content: 'sentencesRu'`. (Renders via SentenceBuilder.)
4. **`packages/content-english/src/sentencesRu.js`** (new) — `genSentenceRu(items, ctx)`: `pick`
   a `{en, ru}`; `tokens = shuffle(en.split(' '))`; return `kind:'sentenceRu'`, `result: en`,
   `word: en`, one step: `inputKind:'build'`, `tokens`, `expected: en`, `lower: true`,
   `tokenAudio: true`, `chip:{label:'Предложение', color:'#34D399'}`,
   `banner:'Собери предложение'`, `prompt:'«' + ru + '»'`, `placeholder:'нажимай на слова…'`,
   `readsLabel:'Получилось:'`, `sayQ:['q-build']`, `sayA:[]`. Add a `node:test` (mirror
   vocab.test.js): tokens are the en words scrambled, `expected===en`, prompt contains `ru`.
   Add a `./sentencesRu` package export.
5. **`boardGenerators.js`/`boardRegistry.js`** — add
   `sentenceRu: { generate: genSentenceRu, content:'sentencesRu', board: SentenceBuilder }`.
   Then `npm run course:capabilities && course:schema && validate` (green). The capability catalog
   (`engine.capabilities.json`) now lists `sentenceRu` + its description — see Part E.

### B2. Sentence-worlds (content)
Two worlds, each one `sentenceRu` station + a Russian lesson. Sentences SHORT (3–4 tiles), nouns
from learned vocab, function words introduced gradually. `sentencesRu` items carry `band`.
(Note: token split keeps the period on the last tile, e.g. `cat.` — matches English Quest behavior.)

**B2a. Простые предложения 1** — `sentences1`, band 6, 📝, color `#34D399`. `sentencesRu` (band 6):
`I see a cat.`/Я вижу кошку · `I see a dog.`/Я вижу собаку · `It is a fish.`/Это рыба ·
`It is red.`/Это красный · `I like milk.`/Я люблю молоко · `I like cake.`/Я люблю торт

**B2b. Простые предложения 2** — `sentences2`, band 7, 📜, color `#A3E635`. `sentencesRu` (band 7):
`The cat is big.`/Кошка большая · `The dog is small.`/Собака маленькая ·
`This is my mom.`/Это моя мама · `I have a sister.`/У меня есть сестра ·
`I see a bird.`/Я вижу птицу · `It is blue.`/Это синий

---

## Part C — voice (gen-voice; owner-gated real run)
**`gen-voice.mjs` change:** it currently derives `word-<w>` jobs only from `content.vocab`. Add a
second source — the distinct, cleaned words across `content.sentencesRu[].en`
(`clean(w)=toLowerCase, strip punctuation`) — so the new function/content words get clips (the
SentenceBuilder tap-audio + the sentence comprehension need them). All clip TEXT still derives from
the course (vocab words, sentence words, narration); no code word-lists.
New clips this expansion needs (the `--dry-run` lists the exact set):
- **Word clips:** family (8), numbers (10), body (8), and the new sentence words
  (`i, see, a, it, is, like, the, big, small, this, my, have` + any sentence noun not already
  clipped). ~40–50 `word-<w>`.
- **Narration clips:** `la-family-*`, `la-numbers-*`, `la-body-*`, the two sentence lessons' lines
  (RU, slow), and `q-build` (RU "Собери предложение").
- Reactions already exist.

## Part D — verify + ship (across both repos)
1. `course:check` green after each world (open-core canonical YAML). `node:test` green
   (genSentenceRu + the per-station integration test).
2. Sync canonical → vendored (`platform/packages/english-ru/english-ru.course.yml`); propagate the
   engine changes to platform copies; `npm install`; `npm run build` all apps green;
   `npm run smoke` green.
3. `gen-voice --dry-run` → confirm missing == the new set; real run (owner key) → commit mp3s + manifest.
4. Puppeteer **drive + screenshot** each new world + the sentence board in the EFL app: styled,
   Russian instruction, gating, the sentence builds + speaks-on-tap. Confirm **English Quest's
   sentence board unchanged** + math unaffected (shared engine touched).
5. FF-merge both repos; deploy `discoveryquest-english-ru`; verify live.

## Part E — document the new capability (REQUIRED for any new engine capability — owner directive)
Users **and agents** must be able to discover what the engine can do.
1. **Public repo — capability catalog (primary):** the `sentenceRu` `description` in `boardMeta.js`
   flows into the regenerated `packages/english/engine.capabilities.json` (the catalog
   `COURSE-AUTHORING.md` tells authors/agents to read). Make the description clear + self-explanatory.
   Add a one-line mention of the sentence-builder board to `docs/authoring/COURSE-AUTHORING.md`
   where it describes the board vocabulary (keep it generic — it defers to the catalog).
2. **Public repo — README/CONTRIBUTING:** if the README enumerates example board kinds, add
   `sentenceRu`; otherwise ensure it points at the catalog. (Check; don't pad.)
3. **Website (`platform/apps/platform/public/index.html`):** the prose listing the "interactive
   pieces" (counting boards, phonics tiles, lesson scenes…) should include sentence-building. Also
   the EFL "source — soon" card is now stale (EFL is open) — point it at the public repo/course
   YAML. Light, factual edits — this is marketing copy, not a catalog.
Deploy the website too if it changed (it's `discoveryquest.app` / `apps/platform`).

## Acceptance
- 6 word-worlds + 2 sentence-worlds in `english-ru.course.yml`; `course:check` green.
- New `sentenceRu` board+generator works (node:test + puppeteer; speaks-on-tap); English Quest's
  `sentence` board byte-for-byte behavior unchanged (the `?? default` + opt-in `tokenAudio`).
- All new clips generated; build/smoke/puppeteer green; EFL deployed + live; EFL/EQ/math regression-free.
- Both YAML copies in sync; engine changes backported to open-core; **`sentenceRu` documented** in
  the capability catalog + authoring guide + website.

## Out of scope / flagged
- Speaking/pronunciation, reading comprehension — later phases.
- The sentence-comprehension board (hear→pick-picture) — deferred.
- **Owner review flags:** (a) the build-a-sentence beginner UX; (b) Family/Body emoji are
  same-category (mitigated by the `ru` gloss pictureMatch shows).
