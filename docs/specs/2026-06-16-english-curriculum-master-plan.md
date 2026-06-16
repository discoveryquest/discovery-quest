# Discovery English — master curriculum plan (grade-banded K–6 ELA)

**Date:** 2026-06-16 · **Status:** master roadmap (the "best English course online" plan).
Approved architecture: **grade-banded levels × ELA strands**, full scope incl. Writing &
Speaking. This doc is the durable map; each release below gets its own spec → plan →
implement cycle. The existing English Quest course is the early-level slice — nothing is
discarded; the course deepens up the levels and fills the missing strands.

## Vision
A complete, leveled K–6 English Language Arts course a child climbs from "learning to read"
to "reading & writing to learn" — built on the open YAML course engine (most worlds are
authorable content; a few need new engine boards or AI). Best-in-class because it is (a)
**comprehensive** (every ELA strand), (b) **progressive** (clear grade-banded levels), (c)
**explicit** (the Rules & Tricks world teaches the *why*), and (d) **open** (the curriculum
is data anyone can read/extend).

## Levels (the progression spine)
**Level K** · **Level 1–2** · **Level 3–4** · **Level 5–6**. On the map, worlds are tagged by
level; a child unlocks the next level by mastering the current. (Map shows the level spine;
implementation of the spine is its own release — see §Sequence.)

## Strands (each recurs per level at increasing difficulty)
Mapped to standard ELA (Common-Core-aligned). For each strand: the skill arc, and a status of
what's **built** vs **gap**, plus content-only vs needs-new-engine.

### 1. Foundational Skills (decoding & fluency)
Arc: letter sounds → blends/digraphs → **vowel teams, r-controlled, silent-e, diphthongs,
syllable types** → **morphology (prefixes/suffixes/roots), multisyllabic decoding** → fluency.
Built: **Phonics Cove** (K–1 slice: soundToLetter ×3, blend, word-family, digraphs).
Gap: everything past early single-letter phonics. Mostly **content** on existing boards
(soundToLetter/blendWord/wordFamily/digraphs generalize to advanced patterns); fluency may
need a new timed/read-aloud board (later).

### 2. Vocabulary & Word Study
Arc: picture-word, sight words, synonyms/antonyms, context → **multiple-meaning words, shades
of meaning, roots/affixes, figurative language (similes, idioms, metaphors)**.
Built: **Word Woods** (pictureMatch, sightWord, sameOpp, contextClue). Gap: morphology,
figurative language. Mostly **content** (sameOpp/contextClue/pictureMatch reuse); figurative
language may want a small new board or reuse contextClue.

### 3. Grammar & Conventions (Language)
Arc: noun/verb/adjective, sentences, capitals/periods → **pronouns, adverbs, prepositions,
conjunctions, articles; verb tenses, subject–verb agreement; plurals/possessives/contractions;
comparatives; sentence types, compound/complex, fragments/run-ons**.
Built: **Grammar Grove** (grammarNoun/Verb/Adj, sentence, punctuation). Gap: most of the
conventions arc. Largely **content** (grammarSort/sentence/contextClue reuse for many; a few —
e.g. verb-tense transforms — may need a new generator/board).

### 4. Reading Comprehension (Literature + Informational)
Arc: main idea/detail/inference → **summarizing, sequence, cause/effect, compare/contrast,
author's purpose, point of view, theme, character, text features, fact vs opinion** + **genres
(fiction/nonfiction, poetry, fable)**.
Built: **Story Harbor** (firstReader, mainIdea, findDetail, inference — all via StoryReader).
Gap: the rest of the comprehension arc + genres. Mostly **content** on the StoryReader board
(it's a story + question; new question types are new content/generators), some new view kinds
for genres/text-features.

### 5. Spelling (new strand)
Arc: high-frequency words, spelling patterns + rules by grade (closely paired with Rules &
Tricks §8). Board: a spelling-choice/build board — likely reuse `ruleQuiz` (pick the correct
spelling) and/or `sentence`-style tile building for "build the word". Mostly **content** once
the board exists.

### 6. Writing (new strand — production)
Arc: sentence → paragraph → composition; **narrative, informative/explanatory, opinion**; the
writing process (plan/draft/revise/edit). **Needs new engine work**: production boards (order/
construct/edit) and, for open writing, **AI feedback** (rubric-scored). Flagged as a later,
bigger phase; early sub-skills (sentence expansion, paragraph order, edit-the-mistake) are
buildable on choice/build boards first.

### 7. Speaking & Listening (new strand)
Arc: listening comprehension (buildable on audio + choice boards) + **Speaking Studio**
(the realtime conversational world). Speaking needs the **`live-tutor` package** (Gemini Live
realtime) + a **Gemini API key** + metering/monetization. Biggest, latest phase. Listening
comprehension is buildable sooner (content on a listen→choose board).

### 8. Rules & Tricks ⭐ (the cross-cutting "why it works" world)
Memorable rules/mnemonics that unlock spelling/phonics/grammar: Bossy R, Magic/Silent E, "two
vowels go walking", I-before-E, Y-as-a-vowel, Soft C & G, the doubling (1-1-1) rule, FLOSS,
A vs An, plurals (-es / y→ies), Q-needs-U, every-sentence-needs-a-verb, etc. Rules unlock at the
grade where they apply, so this world threads through all levels. **Release 1** (own spec:
`2026-06-16-rules-world-design.md`): a new `ruleQuiz` board + ~10 rules. New engine capability →
documented (catalog + authoring guide + website).

## Content-vs-engine summary
- **Content-only (YAML on existing boards):** most of strands 1–4's depth, Spelling practice
  (once a board exists), listening comprehension, early writing sub-skills.
- **New engine (a board/generator):** `ruleQuiz` (Rules/Spelling), possibly verb-tense &
  figurative-language boards, genre/text-feature views, writing-construction boards.
- **New capability + external (AI/API):** open Writing feedback, Speaking Studio (`live-tutor`
  + Gemini key).

## Release sequence (each its own spec → plan → implement)
1. **Rules & Tricks world** (`ruleQuiz` board + ~10 rules) + refresh the stale roadmap doc.
2. **Spelling strand + advanced Phonics** — ✅ **SHIPPED 2026-06-16.** Two new content-only
   worlds reusing the `ruleQuiz` interaction over their own collections: **Sound Patterns** 🎵
   (`soundPattern` board / `patterns` collection — vowel teams, r-controlled, diphthongs, silent
   letters; 3 bands) and **Spelling Bee** 🐝 (`spellBee` board / `spellings` collection — tricky
   high-frequency words, homophones, word endings; 3 bands). ~60 items + 2 Learn-it lessons. No
   loader change — the two boards are thin catalog entries pointing `genRuleQuiz` at new
   collections (same idiom as `grammarNoun/Verb/Adj`).
3. **Grammar depth** (tenses, agreement, pronouns/adverbs/prepositions, sentence types) +
   **Vocabulary depth** (roots/affixes, figurative language).
4. **Reading Comprehension depth** (summarize, cause/effect, compare/contrast, author's
   purpose, genres, text features).
5. **Grade-banding rollout** — the K / 1–2 / 3–4 / 5–6 level spine on the map + per-world level
   tags + cross-level progression/unlock.
6. **Writing strand** — buildable sub-skills first (sentence expansion, paragraph order,
   edit-the-error), then open composition with **AI rubric feedback** (new capability).
7. **Speaking Studio** — `live-tutor` package (Gemini Live) + metering. Biggest; needs a key.

## Acceptance (of the program — each release has its own)
- A child can progress from Level K foundational reading through Level 5–6 reading + writing,
  across all 8 strands, with the Rules world making the patterns explicit.
- Every world is open data (or a documented engine capability); the course "feels complete"
  after Releases 1–4 (receptive + rules + spelling), with Writing/Speaking as the ambitious cap.

## Notes
- Refresh `docs/specs/2026-06-13-english-quest-status-and-roadmap.md` (stale — it predates the
  loader migration that shipped Vocab/Grammar/Reading). Point it at this master plan.
- "English Quest" → consider rebranding the broadened course "Discovery English" (the platform
  brand) as it outgrows the phonics-first origin; cosmetic, deferred.
