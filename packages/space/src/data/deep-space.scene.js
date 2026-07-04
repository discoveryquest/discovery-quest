// Sector 3 — "Deep Space" — stars, constellations, the star life-cycle, and a
// black hole, as DATA (spec §B.1, §3.1). Mostly enrichment: star lifecycle and
// black holes go beyond formal K–6 (NGSS), so these are pitched at the older band.
// New gate kinds here: `connectStars` (trace a constellation) and `eventHorizon`
// (slingshot around the black hole).

export const deepSpace = {
  id: 'deep-space',
  title: 'Deep Space',
  emoji: '🌌',
  color: '#818cf8',
  blurb: 'Stars, constellations, how stars live and die, and black holes.',

  scene: {
    skybox: 'deep-indigo',
    starfield: { count: 8000, depth: 'far' },
    lights: [
      { kind: 'ambient', intensity: 0.22 },
      { kind: 'point', position: [-12, 4, -6], intensity: 1.6 },
    ],
    bodies: [
      { id: 'blackhole', model: 'blackhole', radius: 2.2, position: [0, 0, 0], spin: 0.2 },
      { id: 'star-a', model: 'sun', radius: 0.6, position: [-12, 4, -6] },
      { id: 'star-b', model: 'sun', radius: 0.5, position: [12, -3, -4] },
    ],
    beacons: [
      { station: 'constellations', at: 'star-a', label: 'Constellations' },
      { station: 'star-life', at: 'star-b', label: "A Star's Life" },
      { station: 'black-holes', at: 'blackhole', offset: [0, 4, 0], label: 'Black Holes' },
    ],
    setpiece: null,
  },

  stations: [
    {
      id: 'constellations',
      title: 'Constellations',
      concept: 'constellations',
      standard: ['5-ESS1-1'],
      bands: [0, 1],
      facts: [
        { emoji: '✨', text: 'A constellation is a pattern of stars that people imagined into pictures.' },
        { emoji: '🧭', text: 'Sailors and explorers used constellations to find their way at night.' },
        { emoji: '🌍', text: 'As Earth orbits the Sun, different constellations appear with the seasons.' },
      ],
      questions: [
        { prompt: 'What is a constellation?', options: ['A pattern of stars', 'A kind of planet', 'A space rock'], answer: 'A pattern of stars' },
        { prompt: 'What did people use constellations for?', options: ['To find their way', 'To cook food', 'To make rain'], answer: 'To find their way' },
      ],
      gate: {
        kind: 'connectStars',
        name: 'The Plough',
        stars: [
          { id: 's1', x: 14, y: 64 }, { id: 's2', x: 30, y: 56 }, { id: 's3', x: 46, y: 58 },
          { id: 's4', x: 60, y: 48 }, { id: 's5', x: 74, y: 38 }, { id: 's6', x: 85, y: 52 },
          { id: 's7', x: 70, y: 66 },
        ],
        order: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      },
    },
    {
      id: 'star-life',
      title: "A Star's Life",
      concept: 'star-lifecycle',
      standard: [], // enrichment — beyond formal K–6
      bands: [1, 2],
      facts: [
        { emoji: '☁️', text: 'Stars are born inside giant clouds of gas and dust called nebulae.' },
        { emoji: '⭐', text: 'A star shines for millions or billions of years by burning fuel in its core.' },
        { emoji: '💥', text: 'When a giant star runs out of fuel, it can explode in a supernova.' },
      ],
      questions: [
        { prompt: 'Where are stars born?', options: ['In clouds of gas and dust', 'Inside planets', 'On the Moon'], answer: 'In clouds of gas and dust' },
        { prompt: 'What can happen when a giant star dies?', options: ['It explodes in a supernova', 'It turns into a planet', 'Nothing at all'], answer: 'It explodes in a supernova' },
      ],
      gate: {
        kind: 'connectStars',
        name: 'a star, birth to death',
        stars: [
          { id: 'nebula', x: 12, y: 50 }, { id: 'protostar', x: 33, y: 38 }, { id: 'mainseq', x: 53, y: 56 },
          { id: 'giant', x: 72, y: 36 }, { id: 'remnant', x: 88, y: 56 },
        ],
        order: ['nebula', 'protostar', 'mainseq', 'giant', 'remnant'],
      },
    },
    {
      id: 'black-holes',
      title: 'Black Holes',
      concept: 'black-holes',
      standard: [], // enrichment
      bands: [2, 3],
      facts: [
        { emoji: '🕳️', text: 'A black hole has gravity so strong that not even light can escape it.' },
        { emoji: '🌟', text: 'Many black holes form when a giant star collapses at the end of its life.' },
        { emoji: '🔭', text: "We can't see black holes directly — we spot them by how they pull on nearby stars." },
      ],
      questions: [
        { prompt: "What can't escape a black hole?", options: ['Even light', 'Only rockets', 'Only sound'], answer: 'Even light' },
        { prompt: 'How do scientists find black holes?', options: ['By how they pull on nearby stars', 'By their bright color', 'By listening for them'], answer: 'By how they pull on nearby stars' },
      ],
      gate: { kind: 'eventHorizon' }, // slingshot around the black hole
    },
  ],
};

export default deepSpace;
