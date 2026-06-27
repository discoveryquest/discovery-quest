// ENGINE SEAM implementation: record a resolved gate into the shared
// @discoveryquest/engine save, in the exact shape xp.js reads, so Space Quest
// stars/corrects/concepts feed computeXp()/heroLevel() and the cross-course
// xpByCourse ledger — identical to how math/english accrue XP.
//
// Wire it once at startup:  setSaveKey('sq-save'); setGatePersister(recordGateResult)
import { mutateSave } from '@discoveryquest/engine/save';
import { todayKey } from '@discoveryquest/engine/telemetry';

const DEFAULT_TELEMETRY = { sec: 0, quests: 0, correct: 0, missed: 0, reviewsHit: 0, reviewsMissed: 0 };

export function recordGateResult({ stationId, stars = 0, correct = 0, concept = null }, storage) {
  if (!stationId) return;
  mutateSave((s) => {
    // best-of stars per station (matches the store + math/english behavior)
    s.stations = s.stations || {};
    const st = (s.stations[stationId] = s.stations[stationId] || { stars: 0, bestBand: 0, attempts: 0 });
    st.stars = Math.max(st.stars || 0, stars);
    st.attempts = (st.attempts || 0) + 1;

    // a new concept seen → +CONCEPT xp, and makes the station spaced-reviewable
    if (concept) { s.conceptSeen = s.conceptSeen || {}; s.conceptSeen[concept] = true; }

    // per-day telemetry bucket (xp.js sums `correct` across days, capped per station)
    s.telemetry = s.telemetry || {};
    const day = (s.telemetry[todayKey()] = s.telemetry[todayKey()] || {});
    const t = (day[stationId] = day[stationId] || { ...DEFAULT_TELEMETRY });
    t.correct += correct;
    t.quests += 1;
  }, storage);
}

// Record a "Learn it" check result (the questions before the gate). Adds correct
// answers + marks the concept seen — feeds XP CORRECT + CONCEPT — but awards no
// stars (stars come from the Cosmic Gate).
export function recordLessonResult({ stationId, correct = 0, concept = null }, storage) {
  if (!stationId) return;
  mutateSave((s) => {
    if (concept) { s.conceptSeen = s.conceptSeen || {}; s.conceptSeen[concept] = true; }
    s.telemetry = s.telemetry || {};
    const day = (s.telemetry[todayKey()] = s.telemetry[todayKey()] || {});
    const t = (day[stationId] = day[stationId] || { ...DEFAULT_TELEMETRY });
    t.correct += correct;
    t.quests += 1;
  }, storage);
}
