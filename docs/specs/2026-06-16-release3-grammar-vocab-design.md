# Grammar Gym + Word Lab (Release 3 of the master curriculum)

**Date:** 2026-06-16 · **Status:** designed (approved). The third concrete release of the
master plan (`2026-06-16-english-curriculum-master-plan.md`, Release 3 = Grammar depth +
Vocabulary depth). Adds **one new engine board — `wordBuild` (morpheme builder)** — plus two
new worlds to English Quest (`english.course.yml`): **Grammar Gym** 💪 and **Word Lab** 🔬.
Grammar/figurative content that is *identify/choose* rather than *construct* reuses the shipped
`ruleQuiz` board (Release 1) over new collections — same content-only idiom as Release 2's
Sound Patterns / Spelling Bee.

Latin/Greek **roots** (port/tract/…) are **deferred** to a later vocab pass — abstract for this
age band; prefixes/suffixes already deliver the morphology win. YAGNI for Release 3.

## The interactions

### New: `wordBuild` (morpheme builder)
Construct a word form by tapping word-part tiles into order, then **Check**. Teaches morphology
visually (the *why* of a transform), unlike multiple-choice. Modeled on `SentenceBuilder.jsx`'s
tile idiom, with two differences: tiles join with **`''`** (no spaces) and there is an explicit
**Check** button (the tray includes distractor tiles, so the board can't infer "done" by count
the way SentenceBuilder does when it uses *every* tile).

- **Learn it** (a lesson beat): the rule/pattern (e.g. *"add -ed for the past"*, *"un- means
  not"*) + examples, via the existing lesson/narration engine.
- **Practice** (the `wordBuild` board): a **rule reminder card** stays visible, a prompt
  (*"Make it past tense"*), a **build line**, and a **tray** of scrambled morpheme tiles =
  the correct `parts` **plus** `distractors` (extra endings to reject). Tap tiles into the line
  → tap **Check** → `onPick(joined)`; `CourseQuest` compares `joined === step.expected`. A
  "start over" reset clears the line (like SentenceBuilder).

Good for **regular** transforms: `walk+ed`, `jump+ing`, `cat+s`, `box+es`, `big+ger`,
`un+happy`, `re+do`, `help+ful`, `care+less`. **Irregulars** (run→ran, good→better) don't
decompose into tiles → those go on `ruleQuiz` ("Yesterday I ___ (ran/runned/run)").

### Reused: `ruleQuiz` (Release 1) for identify/choose
Pronouns & subject–verb agreement, sentence types, figurative language (similes/metaphors/idioms)
are *choose the right one* tasks — they ride on the existing `ruleQuiz` board over new
collections. Zero engine change.

## Engine changes (open-core; new capability → must be documented, §Docs)
Edit all four catalog files before regenerating (gen-capabilities checks boardMeta↔registry
lockstep; gen-schema turns contentMeta into validators).

1. **`packages/english/src/boards/WordBuilder.jsx`** (NEW) — model on `SentenceBuilder.jsx`.
   State = placed tile indices. Render: rule reminder card (`step.banner`/`step.rule`, chip
   `{label:'Build', color:'#818CF8'}`), prompt (`step.prompt`), a build line showing
   `placed.map(k => tokens[k]).join('')`, and a tray of un-placed `step.tokens` as tap tiles.
   A **Check** button (enabled once ≥1 tile placed) calls `onPick(placed.map(k=>tokens[k]).join(''))`.
   A "start over" reset. Speak `step.audioPrompt` on mount — **key the effect on `step.prompt`**
   (changes per item), not on `step.rule` (the card repeats across items). Correct/reveal styling
   like SentenceBuilder (the board derives `correct = answered && assembled === step.expected`
   for coloring only; scoring is CourseQuest's `choice === step.expected`).

2. **`packages/content-english/src/build.js`** (NEW) — `genWordBuild(items, ctx = {})` modeled on
   `genBuildSentence`. `const item = pick(items);` return `kind:'wordBuild'`, `word:item.answer`,
   `result:item.answer`, one step with `chip:{label:'Build', color:'#818CF8'}`, `rule:item.rule`,
   `banner:item.rule`, `prompt:item.prompt`, `tokens: shuffle([...item.parts, ...item.distractors])`,
   `inputKind:'build'`, `joinWith:''`, `lower:true`, `expected:item.answer`, `audioPrompt:'q-build'`,
   `hint:` (a short "because <rule>" line), `sayQ:['q-build']`, `sayA:[]`. Add a `./build` package
   export. Add a `node:test` (`packages/content-english/test/build.test.js`, mirror rules.test.js):
   `kind==='wordBuild'`, `expected===item.answer`, tokens include every `part`, tokens length ===
   parts+distractors, `joinWith===''`.

3. **`contentMeta.js`** — add a `wordParts` collection (`collection:'objects'`), item fields:
   `rule`(string,req), `prompt`(string,req), `parts`(string[],req, the ordered correct tiles),
   `distractors`(string[],req, extra tiles to reject), `answer`(string,req, = parts joined),
   `band`(number,opt). Clear description ("Morpheme-building items: assemble a word form from
   part tiles — verb endings, plurals/comparatives, prefixes/suffixes. Feeds the wordBuild board.").

4. **`boardMeta.js`** — add board kind `wordBuild`, `content:'wordParts'`, public-catalog
   `description`: *"Build a word form by tapping its parts in order (walk+ed → walked, un+happy →
   unhappy). Teaches morphology: verb tenses, plurals, comparatives, prefixes & suffixes."* with
   the item fields above.

5. **`boardGenerators.js`/`boardRegistry.js`** — add `wordBuild: { generate: genWordBuild,
   content:'wordParts', board: WordBuilder }`. Import `genWordBuild` from
   `@discoveryquest/content-english/build`. Regen capabilities/schema; `validate` +
   `course:check` green.

## Course content (`english.course.yml`, authored in `docs/specs/course-format/`, vendored)

### World: Grammar Gym 💪 (`#818CF8`) — "Train your grammar — build the right form."
| id | station | board | band | content |
|---|---|---|---|---|
| `gg-tense` | Verb Tenses ⏰ | `wordBuild` | 0 | add -ed/-ing: walk→walked, jump→jumping, play→played |
| `gg-plural` | Plurals & Comparatives 📊 | `wordBuild` | 1 | cat→cats, box→boxes, big→bigger, fast→faster |
| `gg-pro` | Pronouns & Agreement 🔁 | `ruleQuiz` | 1 | "She ___ fast (runs/run)", "give it to ___ (him/he)", irregular past |
| `gg-sent` | Sentence Types ❓ | `ruleQuiz` | 2 | statement/question/command/exclamation |

### World: Word Lab 🔬 (`#F59E0B`) — "Take words apart and build new ones."
| id | station | board | band | content |
|---|---|---|---|---|
| `wl-pre` | Prefixes ⬅️ | `wordBuild` | 0 | un+happy, re+do, pre+view, dis+like |
| `wl-suf` | Suffixes ➡️ | `wordBuild` | 1 | help+ful, care+less, quick+ly, teach+er |
| `wl-fig` | Figurative Language 🎭 | `ruleQuiz` | 2 | "'busy as a bee' is a ___ (simile/metaphor)", idiom meanings |

- **7 stations** (4 `wordBuild`, 3 `ruleQuiz`), ~70 items across collections: `wordParts` (the
  4 wordBuild stations, banded), and ruleQuiz `rules`-shaped collections for `gg-pro`/`gg-sent`/
  `wl-fig` — author as new collections (e.g. `grammar_depth`, `sentence_types`, `figurative`) so
  each board points at its own list (mirrors Release 2's pattern of dedicated collections).
- **7 Learn-it lessons** + `narration:` lines (caption == narration, enforced by course:check).
- Voice: ~7 new lesson clips + one new gameplay prompt clip **`q-build`** (the wordBuild prompt;
  ruleQuiz stations reuse the existing `q-rule`).

## Verification (non-negotiable, in order)
1. `npm run course:check` → **10 worlds, 35 stations** (was 8/28).
2. `npm test` in `packages/english` + `packages/content-english` — `courseStations` generates
   every station from YAML (shape-covers all 7 new), plus the new `genWordBuild` unit test.
3. Vendor engine + YAML into `platform` (`release3-grammar-vocab` branch); `npm run build` +
   `npm run smoke` green.
4. **gen-voice** from the platform main checkout (`.env` gotcha) → `q-build` + 7 lesson clips.
5. **Puppeteer drive**: open `gg-tense`, play the Learn-it lesson, assemble `walk`+`ed`→`walked`,
   tap **Check**, confirm correct state; confirm a `ruleQuiz` station (`gg-pro`) still works;
   screenshot; zero console errors.
6. Commit → (with go-ahead) deploy English Quest → live curl + click-through → FF-merge both
   repos → update memory.

## Docs
- `docs/authoring/COURSE-AUTHORING.md` — document the new `wordBuild` board + `wordParts` collection.
- Mark Release 3 status in the master plan once shipped.
