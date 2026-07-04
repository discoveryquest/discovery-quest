// Space Quest — the 2D app shell. Same shape as English/Math: profile gate → map →
// quests, with a "Learn it" lesson before a station's first play. Everything (worlds,
// stations, lessons, narration) comes from the loaded course (./course.js, from the
// validated space.course.yml). Saves under its own 'sq-save' key; profiles are the
// shared device-wide registry, so a hero from Math/English is offered here too.
import { useState, useEffect } from 'react';
import { setSaveKey, loadSave } from '@discoveryquest/engine/save';
import { ensureRegistry, loadRegistry, resolveActiveProfile, createProfile, setActiveProfile } from '@discoveryquest/engine/profiles';
import { hushAll } from '@discoveryquest/voice-kit/audio';
import ProfileSetup from '@discoveryquest/engine-ui/ProfileSetup';
import ProfilePicker from '@discoveryquest/engine-ui/ProfilePicker';
import QuizScreen from './QuizScreen.jsx'; // Space's richer quest host (draggable Luna, tiles)
import PracticeScreen from './PracticeScreen.jsx';
import MapScreen from './MapScreen.jsx';
import CourseLesson from './CourseLesson.jsx';
import { playMusic, trackForWorld, MAP_TRACK } from './music.js';
import { course } from './course.js';

const COURSE_ID = 'space';
const SAVE_KEY = 'sq-save';
setSaveKey(SAVE_KEY); // Space Quest's own save slot (never collides with math/english)

const SPACE_AVATARS = ['🚀', '🦉', '🧑‍🚀', '👩‍🚀', '🛸', '🪐', '⭐', '🌙'];
const SETUP_LABELS = { hero: 'Pick your explorer', name: 'Your explorer name', age: 'How old are you?', submit: 'Blast off! 🚀' };

function Shell({ children }) {
  return (
    <div
      className="min-h-full"
      style={{ background: 'radial-gradient(120% 90% at 50% -10%, #1b2550 0%, rgba(27,37,80,0) 55%), linear-gradient(180deg, #0b1026 0%, #05060f 100%)' }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}

export default function App() {
  const storage = globalThis.localStorage;
  const [reg, setReg] = useState(() => ensureRegistry(storage, [{ key: SAVE_KEY, courseId: COURSE_ID }]));
  const [route, setRoute] = useState(() => resolveActiveProfile(COURSE_ID, reg)); // { mode, profileId? }
  const [screen, setScreen] = useState('map'); // 'map' | 'quest'
  const [station, setStation] = useState(null);
  const [lesson, setLesson] = useState(null); // { id, then }
  const [saveTick, setSaveTick] = useState(0);

  // Background music: the map/hub theme on the map, the chapter's theme in a quest.
  // (Engine auto-ducks under Luna's narration; missing tracks are silent.)
  useEffect(() => {
    if (route.mode !== 'game') return;
    playMusic(screen === 'quest' && station ? trackForWorld(station.worldId) : MAP_TRACK);
  }, [route.mode, screen, station]);

  // Re-read the registry + recompute the route (used after create/pick). Called from the
  // profile submit/pick handlers, i.e. inside a user gesture — so starting music here
  // unlocks autoplay, letting the map theme play on FIRST entry (not just on return).
  const refresh = () => {
    const next = loadRegistry(storage);
    setReg(next);
    const r = resolveActiveProfile(COURSE_ID, next);
    setRoute(r);
    if (r.mode === 'game') playMusic(MAP_TRACK);
  };

  // ── Onboarding gate (identical to Math/English) ──
  if (route.mode === 'setup') {
    return (
      <Shell>
        <ProfileSetup
          avatars={SPACE_AVATARS}
          labels={SETUP_LABELS}
          onSubmit={(fields) => { createProfile(storage, { courseId: COURSE_ID, saveKey: SAVE_KEY, fields }); refresh(); }}
          onCancel={reg.profiles.length ? () => setRoute({ mode: 'picker' }) : undefined}
        />
      </Shell>
    );
  }
  if (route.mode === 'picker') {
    return (
      <Shell>
        <ProfilePicker
          profiles={reg.profiles}
          onPick={(id) => { setActiveProfile(storage, { reg, courseId: COURSE_ID, saveKey: SAVE_KEY, profileId: id }); refresh(); }}
          onNew={() => setRoute({ mode: 'setup' })}
        />
      </Shell>
    );
  }

  // ── Game ──
  const save = loadSave();
  const profile = reg.profiles.find((p) => p.id === route.profileId) || save.profile;
  const startQuest = (st) => { setStation(st); setScreen('quest'); };
  const Quest = station?.board === 'practice' ? PracticeScreen : QuizScreen;
  // Play means play: the button goes straight to practice, every time. The lesson
  // stays one tap away ("Learn it" in the popover), and its final CTA still chains
  // into practice — but pressing Practice must never open something else first.
  const onPlay = (st) => startQuest(st);
  // Replaying Learn it should still let the final "Let's practice!" CTA launch practice.
  const onLearn = (st) => setLesson({ id: st.lessonId, then: () => startQuest(st) });

  return (
    <Shell>
      {screen === 'quest' ? (
        <Quest key={station?.id} station={station} course={course} onExit={() => { setSaveTick((t) => t + 1); setScreen('map'); }} />
      ) : (
        <MapScreen key={saveTick} worlds={course.worlds} save={save} profile={profile} onPlay={onPlay} onLearn={onLearn}
          lastPlayedId={station?.id}
          onSwitchPlayer={() => { hushAll(); setRoute({ mode: 'picker' }); }} />
      )}

      {lesson && course.lessonsById[lesson.id] && (
        <CourseLesson
          lesson={course.lessonsById[lesson.id]}
          narration={course.narration}
          onDone={() => { const then = lesson.then; hushAll(); setLesson(null); then?.(); }}
          onClose={() => { hushAll(); setLesson(null); }}
        />
      )}
    </Shell>
  );
}
