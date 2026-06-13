// Telemetry groundwork (T9.1): compact per-day, per-station buckets in the
// save — the future parent dashboard's data source. No network; prunes
// itself after 90 days.
//
//   save.telemetry["2026-06-12"]["cc-add"] =
//     { sec, quests, correct, missed, reviewsHit, reviewsMissed }

import { mutateSave } from './save.js';

const DAY = 86400000;
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export function bump(stationId, field, n = 1, storage) {
  if (!stationId) return;
  mutateSave((s) => {
    s.telemetry = s.telemetry || {};
    // prune anything older than 90 days
    const cutoff = todayKey(new Date(Date.now() - 90 * DAY));
    for (const k of Object.keys(s.telemetry)) if (k < cutoff) delete s.telemetry[k];
    const day = (s.telemetry[todayKey()] = s.telemetry[todayKey()] || {});
    const st = (day[stationId] = day[stationId] || { sec: 0, quests: 0, correct: 0, missed: 0, reviewsHit: 0, reviewsMissed: 0 });
    st[field] = (st[field] || 0) + n;
  }, storage);
}
