# Rules & Tricks world (Release 1 of the master curriculum)

**Date:** 2026-06-16 · **Status:** designed (approved). The first concrete release of the
master plan (`2026-06-16-english-curriculum-master-plan.md`). Adds a new **`ruleQuiz`** engine
board + a **Rules & Tricks** world to English Quest (`english.course.yml`) that teaches the
mnemonics that make English click (Bossy R, Magic E, i-before-e, …), each as **Learn-it
(teach the mnemonic) → Practice (apply it)**.

## The interaction
- **Learn it** (a lesson beat): the rule's mnemonic + plain explanation + examples (taught via
  the existing lesson/narration engine — Russian/English text + voice).
- **Practice** (the new `ruleQuiz` board): a **reminder card** keeps the rule visible, then a
  question + tappable choices; tap the right one. Visual-first (spelling/word choices can't be
  heard), modeled on the existing `ContextClue` board.

## Engine changes (open-core; new capability → must be documented, §Docs)
Edit all catalog files before regenerating (gen-capabilities checks boardMeta↔registry lockstep).
1. **`packages/english/src/boards/RuleQuiz.jsx`** (NEW) — model on `ContextClue.jsx`. Renders:
   a prominent **rule reminder card** (`step.rule`, e.g. *"i before e, except after c"*), the
   **question** (`step.prompt`), and the **choices** (`step.choices`) as tappable tiles;
   `onPick(choice)` → quest compares to `step.expected`; correct/reveal styling like ContextClue.
   Speaks `step.audioPrompt` on mount — **key the effect on `step.prompt`** (the question, which
   changes per item), NOT on `step.rule` (the card can repeat across items, which would suppress
   the voice). Show choices with `disp` (case per `step.lower`).
2. **`packages/content-english/src/rules.js`** (NEW) — `genRuleQuiz(items, ctx = {})` modeled on
   `genContextClues`: `const item = pick(items); const choices = shuffle([item.answer, ...item.distractors]);`
   return `kind:'ruleQuiz'`, `word:item.answer`, `result:item.answer`, one step with
   `chip:{label:'Rule', color:'#FBBF24'}`, `rule:item.rule`, `banner:item.rule`,
   `prompt:item.question`, `audioPrompt:'q-rule'`, `inputKind:'choice'`, `choices`,
   `lower:true`, `expected:item.answer`, `hint:` (a short "because <rule>" line),
   `sayQ:['q-rule']`, `sayA:[]`. Add a `node:test` (mirror vocab.test.js): choices include the
   answer, 2–4 choices, `expected===answer`, `kind==='ruleQuiz'`. Add a `./rules` package export.
3. **`contentMeta.js`** — add a `rules` collection: `objects`, item fields
   `[{name:'rule',type:'string',req},{name:'question',type:'string',req},{name:'answer',type:'string',req},{name:'distractors',type:'string[]',req},{name:'band',type:'number',req:false}]`.
4. **`boardMeta.js`** — add board kind `ruleQuiz`, `content:'rules'`, with a clear public-catalog
   `description`: *"Apply a spelling/grammar rule: a reminder of the rule, then pick the word that
   follows it. Teaches the tricks (Bossy R, Magic E, i-before-e…)."*
5. **`boardGenerators.js`/`boardRegistry.js`** — add `ruleQuiz: { generate: genRuleQuiz,
   content:'rules', board: RuleQuiz }`. Regen capabilities/schema; `validate` + `course:check` green.

## Content — the Rules & Tricks world (`english.course.yml`)
World `rules`, title **Rules & Tricks** 💡, color `#FBBF24`. **3 stations** (each a `ruleQuiz`
station over a band-grouped rule set + a Learn-it lesson teaching those mnemonics). Place the
world appropriately (un-`soon` if reusing the Speaking slot? NO — add as a NEW world; keep
Speaking soon). `content.rules` items are band-tagged (the station slices its band).

### Station 1 — "Vowel Tricks" (`r-vowel`, band 0, lesson `rules-vowel`)
Rules taught (lesson) + practiced (ruleQuiz items):
- **Magic/Silent E** — *"A silent E at the end makes the vowel say its name: cap → cape."*
  items e.g. `{rule:"silent e makes the vowel say its name", question:"Which says the long sound?", answer:"cape", distractors:["cap"]}`, `…"kite"/["kit"]`, `…"note"/["not"]`.
- **Bossy R (r-controlled)** — *"When R follows a vowel it's bossy — ar/er/ir/or/ur: car, bird, fork."*
  `{rule:"r is bossy after a vowel", question:"Which has a bossy R?", answer:"car", distractors:["cat","can"]}`, `…"bird"/["bid","big"]`.
- **Two vowels go walking** — *"When two vowels go walking, the first one does the talking: rain, boat, team."*
  `{rule:"two vowels: the first one talks", question:"Which spells the long sound?", answer:"rain", distractors:["ran"]}`, `…"boat"/["bot"]`.
- **Y as a vowel** — *"Y can be a vowel: at the end it says /ee/ (happy) or /eye/ (cry)."*

### Station 2 — "Spelling Rules" (`r-spell`, band 1, lesson `rules-spell`)
- **I before E** — *"I before E, except after C, or when it says A as in neighbor and weigh."*
  `{rule:"i before e, except after c", question:"Which is correct?", answer:"receive", distractors:["recieve"]}`, `…"believe"/["beleive"]`, `…"chief"/["cheif"]`.
- **Doubling (1-1-1)** — *"One syllable, one vowel, one final consonant → double it before -ing/-ed: run → running."*
  `{rule:"double the last consonant (run→running)", question:"Add -ing to 'hop':", answer:"hopping", distractors:["hoping"]}`.
- **FLOSS** — *"After a short vowel, double f, l, s, z at the end: ball, miss, buzz, off."*
- **Plurals (-es, y→ies)** — *"Add -es after s, x, z, ch, sh (boxes); change y to i + es (baby → babies)."*
  `{rule:"add -es after ch/sh/s/x; y→ies", question:"More than one baby:", answer:"babies", distractors:["babys"]}`, `…"boxes"/["boxs"]`.

### Station 3 — "Word Rules" (`r-word`, band 2, lesson `rules-word`)
- **Soft C & G** — *"C and G go soft (s/j) before e, i, y: city, gem; hard otherwise: cat, go."*
- **A vs An** — *"Use 'an' before a vowel sound (an apple), 'a' before a consonant (a cat)."*
  `{rule:"a before a consonant, an before a vowel", question:"Choose: ___ apple", answer:"an", distractors:["a"]}`, `{rule:"…", question:"Choose: ___ cat", answer:"a", distractors:["an"]}`. (Every `content.rules` item MUST have a complete `question:` string — the generator uses it verbatim.)
- **Q needs U** — *"Q is almost always followed by U: queen, quick."*
- **Every sentence needs a verb / capital + end mark** — *"A sentence starts with a capital, ends with . ? or !, and needs a doing word."*

(8–12 rules total across the 3 stations; each station's lesson teaches its rules' mnemonics via
beats — caption = the mnemonic, view = a picture/word example — and `content.rules` holds 2–3
practice items per rule. Keep mnemonics verbatim-memorable.)

## Voice
New clips (English Quest's voice dir, `apps/english-quest/public/voice/…` — gen-voice for that
app). The English Quest gen-voice derives word clips from content + narration from the `narration`
map. New: the 3 lessons' narration (`la-rules-vowel-*`, `la-rules-spell-*`, `la-rules-word-*` —
the mnemonics, spoken), and a `q-rule` question prompt clip ("Which one follows the rule?").
The choice words are mostly spelling variants — no per-word audio needed (visual). Follow the
English Quest app's existing gen-voice/verify flow.

## Docs (new capability — owner directive)
`ruleQuiz` `description` flows into `engine.capabilities.json` (regenerated). Add a one-line
mention to `docs/authoring/COURSE-AUTHORING.md`. Add "rule/spelling drills" to the website
capability prose (`apps/platform/public/index.html`). (Same pattern as `sentenceRu`.)

## Verify + ship
1. `course:check english.course.yml` green; `node:test` (genRuleQuiz + the existing
   `courseStations.test.js` for English Quest — every station generates) green; `validate` green.
2. Propagate engine + YAML to platform copies (English Quest is platform's `apps/english-quest`);
   `npm install`; `npm run build` all apps green; `npm run smoke` green.
3. gen-voice (English Quest app) for the new narration/`q-rule` (run from the main checkout —
   `.env` gotcha); commit clips.
4. Puppeteer **drive + screenshot** the Rules world + a `ruleQuiz` station (rule card + question +
   choices; answering shows correct state). Confirm EFL + math unaffected (shared engine touched).
5. FF-merge both repos; deploy `discoveryquest-english` (+ website if docs changed); verify live.

## Acceptance
- A **Rules & Tricks** world with 3 stations is live in English Quest; each teaches a mnemonic
  (Learn it) + practices it (`ruleQuiz`).
- New `ruleQuiz` board works (node:test + puppeteer) and is **documented** (catalog + authoring +
  website); existing boards/courses unaffected (additive).
- Both YAML copies in sync; engine backported to open-core; deployed + live.

## Out of scope
- The other releases (Spelling strand, Grammar/Vocab/Reading depth, grade-banding, Writing,
  Speaking) — each its own spec per the master plan.
