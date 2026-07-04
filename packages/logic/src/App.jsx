// Logic Quest — the app shell. Same shape as Space/Math/English: profile gate →
// map → practice quests. Everything (worlds, stations, missions, narration)
// comes from the loaded course (./course.js, from the validated
// logic.course.yml). Saves under its own 'lq-save' key; profiles are the
// shared device-wide registry, so a hero from Math/Space is offered here too.
// v1 ships practice-only (no Learn-it lessons yet — spec §2 build order).
import { useState, useEffect } from 'react';
import { setSaveKey, loadSave } from '@discoveryquest/engine/save';
import { ensureRegistry, loadRegistry, resolveActiveProfile, createProfile, setActiveProfile } from '@discoveryquest/engine/profiles';
import { hushAll } from '@discoveryquest/voice-kit/audio';
import ProfileSetup from '@discoveryquest/engine-ui/ProfileSetup';
import ProfilePicker from '@discoveryquest/engine-ui/ProfilePicker';
import PracticeScreen from './PracticeScreen.jsx';
import MapScreen from './MapScreen.jsx';
import { playMusic, trackForWorld, MAP_TRACK } from './music.js';
import { course } from './course.js';

const COURSE_ID = 'logic';
const SAVE_KEY = 'lq-save';
setSaveKey(SAVE_KEY); // Logic Quest's own save slot (never collides with other courses)

const LOGIC_AVATARS = ['🧩', '🦊', '🦉', '🎩', '🔍', '🤖', '🧠', '⭐'];
const SETUP_LABELS = { hero: 'Pick your puzzler', name: 'Your puzzler name', age: 'How old are you?', submit: "Let's puzzle! 🧩" };

function Shell({ children }) {
  return (
    <div
      className="min-h-full"
      style={{ background: 'radial-gradient(120% 90% at 50% -10%, #3b2417 0%, rgba(59,36,23,0) 55%), linear-gradient(180deg, #17100c 0%, #0a0705 100%)' }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}

export default function App() {
  const storage = globalThis.localStorage;
  const [reg, setReg] = useState(() => ensureRegistry(storage, [{ key: SAVE_KEY, courseId: COURSE_ID }]));
  const [route, setRoute] = useState(() => resolveActiveProfile(COURSE_ID, reg));
  const [screen, setScreen] = useState('map'); // 'map' | 'quest'
  const [station, setStation] = useState(null);
  const [saveTick, setSaveTick] = useState(0);

  useEffect(() => {
    if (route.mode !== 'game') return;
    playMusic(screen === 'quest' && station ? trackForWorld(station.worldId) : MAP_TRACK);
  }, [route.mode, screen, station]);

  const refresh = () => {
    const next = loadRegistry(storage);
    setReg(next);
    const r = resolveActiveProfile(COURSE_ID, next);
    setRoute(r);
    if (r.mode === 'game') playMusic(MAP_TRACK);
  };

  if (route.mode === 'setup') {
    return (
      <Shell>
        <ProfileSetup
          avatars={LOGIC_AVATARS}
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

  const save = loadSave();
  const profile = reg.profiles.find((p) => p.id === route.profileId) || save.profile;

  return (
    <Shell>
      {screen === 'quest' ? (
        <PracticeScreen key={station?.id} station={station} course={course}
          onExit={() => { setSaveTick((t) => t + 1); setScreen('map'); }} />
      ) : (
        <MapScreen key={saveTick} worlds={course.worlds} save={save} profile={profile}
          onPlay={(st) => { setStation(st); setScreen('quest'); }}
          onSwitchPlayer={() => { hushAll(); setRoute({ mode: 'picker' }); }} />
      )}
    </Shell>
  );
}
