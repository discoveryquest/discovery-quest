// Registry of all Space Quest sectors, so the HUD/shell can resolve a station by
// id without hard-coding a single sector. Adding a sector = import + register here.
import backyardSky from './backyard-sky.scene.js';
import cosmicNeighborhood from './cosmic-neighborhood.scene.js';
import deepSpace from './deep-space.scene.js';
import humanElement from './human-element.scene.js';

export const SECTORS = {
  'backyard-sky': backyardSky,
  'cosmic-neighborhood': cosmicNeighborhood,
  'deep-space': deepSpace,
  'human-element': humanElement,
};

export const SECTOR_ORDER = ['backyard-sky', 'cosmic-neighborhood', 'deep-space', 'human-element'];

export const getSector = (id) => SECTORS[id] || null;

// The next sector in the journey, or null if this is the last one.
export function nextSectorId(id) {
  const i = SECTOR_ORDER.indexOf(id);
  return i >= 0 && i < SECTOR_ORDER.length - 1 ? SECTOR_ORDER[i + 1] : null;
}

export function findStation(sectorId, stationId) {
  return getSector(sectorId)?.stations.find((s) => s.id === stationId) || null;
}

export const stationTitle = (sectorId, stationId) =>
  findStation(sectorId, stationId)?.title ?? stationId ?? '';

// Count facts collected into the Discovery Deck, given the store's `learned` map
// (keyed by station id). Used for the HUD log badge.
export function collectedFactCount(learned = {}) {
  let n = 0;
  for (const id of SECTOR_ORDER) {
    for (const st of getSector(id).stations) if (learned[st.id]) n += st.facts?.length || 0;
  }
  return n;
}
