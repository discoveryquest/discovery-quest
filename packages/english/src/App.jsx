// English Quest — Home → map → quests, with an English "Learn it" before a station's first
// play. Progress saved via @discoveryquest/engine under its own 'eq-save' key.
//
// This app is DATA-DRIVEN: everything (worlds, stations, lessons, narration, UI chrome,
// reaction clips) comes from the loaded course in ./course.js (parsed from the vendored
// english.course.yml). The map + the Course* hosts read `course`; there is no bespoke
// runtime. Star-gating lives in ./curriculum.js.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { LunaOwl, useLivelyMood, useSpeaking } from '@discoveryquest/engine-ui/LunaOwl';
import { loadSave, setSaveKey, mutateSave } from '@discoveryquest/engine/save';
import { hushAll } from '@discoveryquest/voice-kit/audio';
import CourseQuest from '@discoveryquest/english/courseQuest';
import CourseLesson from '@discoveryquest/english/courseLesson';
import MapScreen from './MapScreen.jsx';
import { course } from './course.js';

setSaveKey('eq-save'); // English Quest's own save slot (never collides with math)

function Home({ onStart }) {
  const [base, setBase] = useState('idle');
  const mood = useLivelyMood(base);
  const talking = useSpeaking();

  return (
    <div className="font-display relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 text-center text-slate-200">
      <div className="pointer-events-none fixed -left-40 -top-40 h-[460px] w-[460px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-purple-500/10 blur-[120px]" />

      <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
        <LunaOwl mood={mood} talking={talking} />
      </motion.div>

      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Discovery Quest</p>
      <h1 className="mt-1 text-4xl font-extrabold text-white sm:text-5xl">English Quest</h1>
      <p className="mt-3 max-w-md text-base font-bold leading-relaxed text-slate-400">
        Listen, look, and learn to read — with Luna as your guide. First world:{' '}
        <span className="text-cyan-300">Phonics</span>.
      </p>

      <button
        type="button"
        onClick={() => { setBase('cheer'); onStart(); }}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-7 py-3 text-lg font-extrabold text-slate-900 shadow-[0_0_30px_rgba(255,185,83,0.35)] transition-colors hover:bg-amber-300"
      >
        <Volume2 size={20} />
        Start exploring
      </button>

      <p className="mt-8 text-[11px] font-bold uppercase tracking-wider text-slate-600">Built on the shared Discovery Quest engine</p>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'map' | 'quest'
  const [station, setStation] = useState(null);
  const [lesson, setLesson] = useState(null); // { id, then }
  // a counter to re-read the save after a quest persists stars (cheap, no global store)
  const [saveTick, setSaveTick] = useState(0);
  const save = loadSave();

  const hasLesson = (st) => st?.lessonId && course.lessonsById[st.lessonId];
  const startQuest = (st) => { setStation(st); setScreen('quest'); };
  // First visit to a station with a lesson → show "Learn it", then play. Else play.
  function onPlay(st) {
    if (hasLesson(st) && !save.conceptSeen?.[st.lessonId]) {
      mutateSave((s) => { s.conceptSeen = { ...(s.conceptSeen || {}), [st.lessonId]: true }; });
      setLesson({ id: st.lessonId, then: () => startQuest(st) });
    } else startQuest(st);
  }
  const onLearn = (st) => setLesson({ id: st.lessonId, then: null }); // replay only

  return (
    <div
      className="min-h-full"
      style={{
        background:
          'radial-gradient(120% 90% at 50% -10%, #2a2150 0%, rgba(42,33,80,0) 55%), radial-gradient(100% 80% at 110% 10%, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 50%), linear-gradient(180deg, #161a30 0%, #0e1124 100%)',
      }}
    >
      {screen === 'quest' ? (
        <CourseQuest
          key={station?.id}
          station={station}
          course={course}
          onExit={() => { setSaveTick((t) => t + 1); setScreen('map'); }}
        />
      ) : screen === 'map' ? (
        <MapScreen key={saveTick} worlds={course.worlds} save={save} onPlay={onPlay} onLearn={onLearn} />
      ) : (
        <Home onStart={() => setScreen('map')} />
      )}

      {lesson && course.lessonsById[lesson.id] && (
        <CourseLesson
          lesson={course.lessonsById[lesson.id]}
          narration={course.narration}
          lowercase={course.meta.lowercase}
          onDone={() => { const then = lesson.then; hushAll(); setLesson(null); then?.(); }}
        />
      )}
    </div>
  );
}
