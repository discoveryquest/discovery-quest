// "Blast from the Past" review deck (GDD §7) — pure logic, no React.
// Every station with ≥1 star is enrolled. Each entry sits in a Leitner box
// 1–4; it becomes due when EITHER enough quests have been played OR enough
// days have passed (whichever comes first), so daily players and
// once-a-week players both get sane spacing.
// Correct first try → box+1 (max 4). Miss → back to box 1.

export const BOX_GAP = [
  null,
  { quests: 1, days: 1 },
  { quests: 2, days: 2 },
  { quests: 5, days: 5 },
  { quests: 12, days: 12 },
];

const DAY = 86400000;

export function bumpQuestCount(save) {
  save.questCount = (save.questCount || 0) + 1;
}

export function enrollStation(save, stationId, now = Date.now()) {
  if (!save.review[stationId]) {
    save.review[stationId] = { box: 1, lastSeen: now, lastQuest: save.questCount || 0 };
  }
}

export function isDue(save, stationId, now = Date.now()) {
  const it = save.review[stationId];
  if (!it) return false;
  const gap = BOX_GAP[it.box] || BOX_GAP[1];
  const questsElapsed = (save.questCount || 0) - it.lastQuest;
  const daysElapsed = (now - it.lastSeen) / DAY;
  return questsElapsed >= gap.quests || daysElapsed >= gap.days;
}

// How overdue an entry is (used to review the rustiest skill first).
function overdueness(save, stationId, now) {
  const it = save.review[stationId];
  const gap = BOX_GAP[it.box] || BOX_GAP[1];
  const q = ((save.questCount || 0) - it.lastQuest) / gap.quests;
  const d = (now - it.lastSeen) / DAY / gap.days;
  return Math.max(q, d);
}

// Up to `max` due stations, rustiest first, excluding the station currently
// being played (its own quest is already practice for it).
export function dueReviews(save, { exclude = null, max = 2, now = Date.now() } = {}) {
  return Object.keys(save.review)
    .filter((id) => id !== exclude && isDue(save, id, now))
    .sort((a, b) => overdueness(save, b, now) - overdueness(save, a, now))
    .slice(0, max);
}

export function recordReview(save, stationId, firstTry, now = Date.now()) {
  const it = save.review[stationId];
  if (!it) return;
  it.box = firstTry ? Math.min(it.box + 1, 4) : 1;
  it.lastSeen = now;
  it.lastQuest = save.questCount || 0;
}
