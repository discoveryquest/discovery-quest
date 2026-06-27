import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS, SECTOR_ORDER, getSector, nextSectorId, collectedFactCount } from './sectors.js';

// A thin scene-as-data validator (spec §B.1): every sector/station/gate/content
// item is well-formed and internally consistent. Catches content typos (e.g. a
// question whose answer isn't one of its options) and dangling references.
const KNOWN_GATES = new Set(['phaseLock', 'orbitSort', 'connectStars', 'dock', 'eventHorizon']);

test('SECTOR_ORDER matches the registry and all resolve', () => {
  assert.equal(SECTOR_ORDER.length, Object.keys(SECTORS).length);
  for (const id of SECTOR_ORDER) assert.ok(getSector(id), `missing sector ${id}`);
});

test('nextSectorId walks the order and ends at null', () => {
  assert.equal(nextSectorId(SECTOR_ORDER[0]), SECTOR_ORDER[1]);
  assert.equal(nextSectorId(SECTOR_ORDER[SECTOR_ORDER.length - 1]), null);
  assert.equal(nextSectorId('bogus'), null);
});

test('collectedFactCount sums facts of learned stations only', () => {
  assert.equal(collectedFactCount({}), 0);
  const first = getSector(SECTOR_ORDER[0]).stations[0];
  assert.equal(collectedFactCount({ [first.id]: true }), first.facts?.length || 0);
});

for (const sid of SECTOR_ORDER) {
  const sector = getSector(sid);

  test(`[${sid}] sector + scene shape`, () => {
    assert.ok(sector.id && sector.title && sector.emoji && sector.color, 'sector header');
    assert.ok(Array.isArray(sector.stations) && sector.stations.length > 0, 'has stations');
    assert.ok(sector.scene && Array.isArray(sector.scene.bodies), 'has scene bodies');
  });

  test(`[${sid}] beacons + orbits reference real ids`, () => {
    const stationIds = new Set(sector.stations.map((s) => s.id));
    const bodyIds = new Set(sector.scene.bodies.map((b) => b.id));
    for (const bcn of sector.scene.beacons || []) {
      assert.ok(stationIds.has(bcn.station), `beacon → unknown station ${bcn.station}`);
      assert.ok(bodyIds.has(bcn.at), `beacon at unknown body ${bcn.at}`);
    }
    for (const b of sector.scene.bodies) {
      if (b.orbit) assert.ok(bodyIds.has(b.orbit.around), `${b.id} orbits unknown ${b.orbit.around}`);
    }
    // every station should have a beacon to fly to
    const beaconStations = new Set((sector.scene.beacons || []).map((b) => b.station));
    for (const s of sector.stations) assert.ok(beaconStations.has(s.id), `station ${s.id} has no beacon`);
  });

  for (const st of sector.stations) {
    test(`[${sid}/${st.id}] station, gate, and content valid`, () => {
      assert.ok(st.title && st.concept, 'title + concept');
      assert.ok(Array.isArray(st.bands) && st.bands.length > 0, 'has bands');
      assert.ok(st.gate && KNOWN_GATES.has(st.gate.kind), `known gate kind (got ${st.gate?.kind})`);

      for (const q of st.questions || []) {
        assert.ok(Array.isArray(q.options) && q.options.length >= 2, `"${q.prompt}" needs ≥2 options`);
        assert.ok(q.options.includes(q.answer), `answer "${q.answer}" not in options for "${q.prompt}"`);
      }
      for (const f of st.facts || []) assert.ok(f.emoji && f.text, 'fact has emoji + text');

      if (st.gate.kind === 'orbitSort') {
        assert.ok(st.gate.planets.length >= 2, 'orbitSort needs ≥2 planets');
        for (const p of st.gate.planets) assert.ok(p.id && p.label, 'planet has id + label');
      }
      if (st.gate.kind === 'connectStars') {
        const starIds = new Set(st.gate.stars.map((s) => s.id));
        assert.ok(st.gate.order.length >= 2, 'connectStars needs a path');
        for (const id of st.gate.order) assert.ok(starIds.has(id), `order id ${id} is not a star`);
      }
      if (st.gate.kind === 'phaseLock') assert.ok(st.gate.target, 'phaseLock needs a target');
    });
  }
}
