// A lean playable Phonics quest (P1). Drives @discoveryquest/content-english's Sound→Letter
// generator through the shared voice-kit + LunaOwl. Save/review/telemetry and the
// shared engine-ui QuestScreen come in the board-framework surgery; this proves
// the audio-first loop end-to-end first.

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { mutateSave } from '@discoveryquest/engine/save';
import { letterSounds, blendWords, wordFamilies, digraphTeams, WORD_EMOJI } from '@discoveryquest/content-english/phonics';
import { pictureMatch, vocabListen, sightWords, sameOpposite, contextClues } from '@discoveryquest/content-english/vocab';
import { nouns, verbs, adjectives, buildSentence, punctuation } from '@discoveryquest/content-english/grammar';
import SoundToLetter from './boards/SoundToLetter.jsx';
import BlendBuilder from './boards/BlendBuilder.jsx';
import WordFamily from './boards/WordFamily.jsx';
import PictureMatch from './boards/PictureMatch.jsx';
import WordChoice from './boards/WordChoice.jsx';
import SameOpposite from './boards/SameOpposite.jsx';
import ContextClue from './boards/ContextClue.jsx';
import GrammarSort from './boards/GrammarSort.jsx';
import SentenceBuilder from './boards/SentenceBuilder.jsx';
import PunctuationChoice from './boards/PunctuationChoice.jsx';
import { VOICE_LINES, voiceKey } from './voiceLines.js';

const QUEST_LEN = 6;
// station.boardKind → topic generator; problem.kind → board component
const TOPICS = { soundToLetter: letterSounds, blendWord: blendWords, wordFamily: wordFamilies, digraphs: digraphTeams, pictureMatch, vocabListen, sightWord: sightWords, sameOpp: sameOpposite, contextClue: contextClues, grammarNoun: nouns, grammarVerb: verbs, grammarAdj: adjectives, sentence: buildSentence, punctuation };
const BOARDS = { soundToLetter: SoundToLetter, blendWord: BlendBuilder, wordFamily: WordFamily, pictureMatch: PictureMatch, vocabListen: WordChoice, sightWord: WordChoice, sameOpp: SameOpposite, contextClue: ContextClue, grammarSort: GrammarSort, sentence: SentenceBuilder, punctuation: PunctuationChoice };

export default function PhonicsQuest({ station, onExit }) {
  const band = station?.band ?? 0;
  const topic = TOPICS[station?.boardKind] || letterSounds;
  const quest = useMemo(
    () => Array.from({ length: QUEST_LEN }, () => topic.generate(band)),
    [band, station?.boardKind],
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [reveal, setReveal] = useState(null); // { word, emoji } shown on a correct answer

  const [base, setBase] = useState('idle');
  const mood = useLivelyMood(base);
  const talking = useSpeaking();

  const problem = quest[idx];
  const step = problem.steps[0];

  function onPick(letter) {
    if (picked != null) return;
    setPicked(letter);
    const right = letter === step.expected;
    if (right) {
      setCorrect((c) => c + 1);
      setBase('cheer');
      // show the word's picture so the spoken word matches something on screen
      // (the example/target word lives on the problem, not the step)
      setReveal({ word: problem.word, emoji: WORD_EMOJI[problem.word], lower: step.lower });
      speak([voiceKey('praise', Math.floor(Math.random() * VOICE_LINES.praise.length)), ...(step.sayA || [])], {
        important: true,
      });
    } else {
      setBase('hint');
      speak(voiceKey('oops', Math.floor(Math.random() * VOICE_LINES.oops.length)), { important: true });
    }
    // Hold the feedback on screen long enough for its audio to finish, THEN hush so the
    // word never bleeds into the next question, and advance. (Was: advanced mid-clip.)
    setTimeout(() => {
      hushAll();
      setBase('idle');
      setReveal(null);
      if (idx + 1 >= QUEST_LEN) {
        setDone(true);
        setTimeout(() => speak(voiceKey('solved', Math.floor(Math.random() * VOICE_LINES.solved.length)), { important: true }), 60);
      } else {
        setPicked(null);
        setIdx((i) => i + 1);
      }
    }, right ? 2200 : 1700);
  }

  const stars = correct >= QUEST_LEN ? 3 : correct >= QUEST_LEN - 2 ? 2 : correct >= QUEST_LEN / 2 ? 1 : 0;

  // Persist the best result for this station (keep the highest stars earned).
  useEffect(() => {
    if (!done || !station?.id) return;
    mutateSave((s) => {
      s.stations = s.stations || {};
      const prev = s.stations[station.id] || { stars: 0, attempts: 0 };
      s.stations[station.id] = {
        stars: Math.max(prev.stars || 0, stars),
        bestBand: Math.max(prev.bestBand || 0, band),
        attempts: (prev.attempts || 0) + 1,
      };
      s.questCount = (s.questCount || 0) + 1;
    });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="font-display relative flex min-h-full flex-col items-center px-5 py-6 text-slate-200">
      <button
        type="button"
        onClick={() => { hushAll(); onExit(); }}
        aria-label="Back"
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      >
        <ArrowLeft size={18} />
      </button>

      {/* progress dots */}
      <div className="mt-1 flex gap-1.5">
        {quest.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i < idx || done ? 'bg-cyan-300' : i === idx ? 'bg-cyan-300/60' : 'bg-white/15'}`}
          />
        ))}
      </div>

      <div className="mt-3 scale-90">
        <LunaOwl mood={mood} talking={talking} />
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 text-center">
            <h2 className="text-3xl font-extrabold text-white">Great listening!</h2>
            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 1, 2].map((k) => (
                <Star key={k} size={40} className={k < stars ? 'fill-yellow-300 text-yellow-300' : 'text-slate-700'} />
              ))}
            </div>
            <p className="mt-2 font-bold text-slate-400">You got {correct} of {QUEST_LEN} sounds!</p>
            <button
              type="button"
              onClick={() => { hushAll(); onExit(); }}
              className="mt-6 rounded-2xl bg-amber-400 px-7 py-3 text-lg font-extrabold text-slate-900 hover:bg-amber-300"
            >
              Back to the map
            </button>
          </motion.div>
        ) : (
          <motion.div key={idx} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="mt-6 w-full max-w-md">
            {(() => { const Board = BOARDS[problem.kind] || SoundToLetter; return <Board step={step} picked={picked} onPick={onPick} />; })()}
            <AnimatePresence>
              {reveal && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="mt-6 flex flex-col items-center gap-1"
                >
                  {reveal.emoji && <span className="text-7xl" style={{ filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.4))' }}>{reveal.emoji}</span>}
                  <span className="text-3xl font-extrabold text-emerald-300" style={{ textShadow: '0 0 12px #4ADE8088' }}>{reveal.lower ? reveal.word : reveal.word.toUpperCase()}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
