// English Quest lesson visuals. A beat's `view` is { kind, key?, ...props };
// renderLessonView dispatches kind → a node. Subject-specific (phonics), mirroring
// math-quest's lessons/views.jsx so the lesson format is identical across apps.
import { motion } from 'framer-motion';
import { speak, hushAll } from '@discoveryquest/voice-kit/audio';
import { PHONEMES, DIGRAPHS } from '@discoveryquest/content-english/phonics';
import Emoji from '@discoveryquest/engine-ui/Emoji';

// tap → play this sound immediately, cutting off whatever was playing (no queue build-up)
const playNow = (clip) => { hushAll(); speak(clip, { important: true }); };

// interactive: every letter + team as a button — tap to hear its sound (one screen).
export function Soundboard() {
  const Tile = ({ label, clip, color }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => playNow(clip)}
      className="font-mono flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl font-black"
      style={{ borderColor: `${color}66`, background: `${color}1a`, color }}
    >
      {label}
    </motion.button>
  );
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-5 gap-2">
        {[...PHONEMES].sort((a, b) => a.letter.localeCompare(b.letter)).map((p) => (
          <Tile key={p.key} label={p.letter.toUpperCase()} clip={p.key} color="#22d3ee" />
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {DIGRAPHS.map((d) => (
          <motion.button key={d.key} type="button" whileTap={{ scale: 0.88 }} onClick={() => playNow(d.key)}
            className="font-mono flex h-12 w-16 items-center justify-center rounded-xl border-2 text-xl font-black uppercase"
            style={{ borderColor: '#a78bfa66', background: '#a78bfa1a', color: '#c4b5fd' }}>
            {d.team}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// case helper: text is stored lowercase; show caps unless we're in the lowercase stage
const cased = (s, lower) => (lower ? s : s.toUpperCase());

// a row of letters; the active one lifts and glows (intro / recap beats)
export function Letters({ items = ['s', 'a', 't', 'p', 'i', 'n'], active = -1, lower = false }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {items.map((c, i) => (
        <motion.span
          key={c + i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: i === active ? 1.25 : 1, opacity: 1, y: i === active ? -6 : 0 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 18 }}
          className="font-mono flex h-12 w-12 items-center justify-center rounded-xl border-2 border-cyan-300/40 bg-cyan-400/10 text-2xl font-black text-cyan-200"
          style={i === active ? { textShadow: '0 0 12px #22d3eecc' } : undefined}
        >
          {cased(c, lower)}
        </motion.span>
      ))}
    </div>
  );
}

// one letter in focus: big letter card + an example word & picture
export function Phoneme({ letter = 's', word = 'sun', emoji = '☀️', lower = false }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-cyan-300/40 bg-cyan-400/10"
        style={{ boxShadow: '0 0 28px rgba(34,211,238,0.25)' }}
      >
        <span className="font-mono text-7xl font-black text-cyan-200" style={{ textShadow: '0 0 16px #22d3ee99' }}>
          {cased(letter, lower)}
        </span>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-3"
      >
        <Emoji char={emoji} className="text-5xl" />
        <span className="text-2xl font-extrabold text-white">
          <span className="text-yellow-300">{cased(word[0], lower)}</span>{cased(word.slice(1), lower)}
        </span>
      </motion.div>
    </div>
  );
}

// sounds blending into a word: letter chips → the whole word
export function Blend({ letters = ['c', 'a', 't'], word = 'cat', lower = false }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {letters.map((c, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.3, type: 'spring', stiffness: 300, damping: 18 }}
            className="font-mono flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cyan-300/40 bg-cyan-400/10 text-3xl font-black text-cyan-200"
          >
            {cased(c, lower)}
          </motion.span>
        ))}
      </div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: letters.length * 0.3 + 0.2 }} className="text-xs font-bold uppercase tracking-wide text-slate-500">↓ blend ↓</motion.span>
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: letters.length * 0.3 + 0.4, type: 'spring', stiffness: 260, damping: 16 }}
        className="font-mono text-5xl font-black text-yellow-300"
        style={{ textShadow: '0 0 18px #FFE06699' }}
      >
        {cased(word, lower)}
      </motion.span>
    </div>
  );
}

// two letters teaming up to make one sound (digraphs)
export function Team({ team = 'sh', sound = '/sh/', word = 'ship', emoji = '🚢', lower = false }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {team.split('').map((c, i) => (
          <motion.span key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.25, type: 'spring', stiffness: 300, damping: 18 }}
            className="font-mono flex h-14 w-14 items-center justify-center rounded-xl border-2 border-purple-300/50 bg-purple-400/10 text-3xl font-black text-purple-200">
            {cased(c, lower)}
          </motion.span>
        ))}
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="ml-1 font-mono text-2xl font-extrabold text-yellow-300">= {sound}</motion.span>
      </div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex items-center gap-3">
        <Emoji char={emoji} className="text-5xl" />
        <span className="text-2xl font-extrabold text-white"><span className="text-purple-300">{cased(word.slice(0, team.length), lower)}</span>{cased(word.slice(team.length), lower)}</span>
      </motion.div>
    </div>
  );
}

// two words in a relation: same (=) or opposite (⇄)
export function Pair({ a = 'big', b = 'large', rel = 'same', lower = false }) {
  const same = rel === 'same';
  const c = same ? '#4ade80' : '#fb923c';
  const Word = ({ w }) => (
    <span className="font-mono text-3xl font-black" style={{ color: c }}>{cased(w, lower)}</span>
  );
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <Word w={a} />
        <span className="font-mono text-3xl font-black" style={{ color: c }}>{same ? '=' : '⇄'}</span>
        <Word w={b} />
      </div>
      <span className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide" style={{ color: c, background: `${c}18` }}>
        {same ? 'mean the same' : 'opposites'}
      </span>
    </div>
  );
}

// a full sentence, with the capital first letter + the period highlighted
export function Sentence({ text = 'The cat is big.' }) {
  const body = text.slice(1, text.length - 1);
  return (
    <p className="max-w-[420px] text-center text-3xl font-extrabold leading-relaxed text-slate-100">
      <span className="text-cyan-300" style={{ textShadow: '0 0 10px #22d3ee88' }}>{text[0]}</span>
      {body}
      <span className="text-yellow-300" style={{ textShadow: '0 0 10px #FFE06688' }}>{text[text.length - 1]}</span>
    </p>
  );
}

// a category label + a few example words (grammar parts of speech)
export function Examples({ label = 'naming words', words = ['cat', 'hat', 'bus'], lower = false }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="rounded-full bg-purple-400/15 px-4 py-1 text-sm font-extrabold uppercase tracking-wide text-purple-200">{label}</span>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {words.map((w, i) => (
          <motion.span key={w + i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.18, type: 'spring', stiffness: 300, damping: 18 }}
            className="font-mono rounded-2xl border-2 border-purple-300/40 bg-purple-400/10 px-5 py-3 text-3xl font-black text-purple-100">
            {cased(w, lower)}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// a sentence with a blank — optionally filled with the answer (context clues)
export function Cloze({ sentence = 'I sleep in my ___.', answer = '', lower = false }) {
  const [pre, post] = sentence.split('___');
  return (
    <p className="max-w-[400px] text-center text-2xl font-extrabold leading-relaxed text-slate-100">
      {pre}
      {answer
        ? <span className="text-emerald-300" style={{ textShadow: '0 0 10px #4ADE8088' }}>{cased(answer, lower)}</span>
        : <span className="mx-1 inline-block min-w-[64px] border-b-4 border-cyan-300/60 align-middle">&nbsp;</span>}
      {post}
    </p>
  );
}

// a picture + its word (vocabulary)
export function Picture({ emoji = '🐱', word = 'cat', lower = false }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }} className="text-8xl"><Emoji char={emoji} /></motion.span>
      <motion.span initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="font-mono text-4xl font-black text-yellow-300" style={{ textShadow: '0 0 16px #FFE06699' }}>{cased(word, lower)}</motion.span>
    </div>
  );
}

// `lower` (default false = capitals first) cases letters/words to the station's stage.
export function renderLessonView(view, lower = false) {
  if (!view) return null;
  switch (view.kind) {
    case 'soundboard': return <Soundboard />;
    case 'picture': return <Picture emoji={view.emoji} word={view.word} lower={lower} />;
    case 'pair': return <Pair a={view.a} b={view.b} rel={view.rel} lower={lower} />;
    case 'cloze': return <Cloze sentence={view.sentence} answer={view.answer} lower={lower} />;
    case 'examples': return <Examples label={view.label} words={view.words} lower={lower} />;
    case 'sentence': return <Sentence text={view.text} />;
    case 'letters': return <Letters items={view.items} active={view.active ?? -1} lower={lower} />;
    case 'phoneme': return <Phoneme letter={view.letter} word={view.word} emoji={view.emoji} lower={lower} />;
    case 'blend': return <Blend letters={view.letters} word={view.word} lower={lower} />;
    case 'team': return <Team team={view.team} sound={view.sound} word={view.word} emoji={view.emoji} lower={lower} />;
    default: return null;
  }
}
