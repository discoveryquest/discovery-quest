// Sector 2 — "Cosmic Neighborhood" — the Solar System, as DATA (spec §B.1, §3.1).
// Adding this whole sector is a data change; only the new `orbitSort` gate kind is
// engine code. Distances/sizes are stylized (spec §5.2), not to scale.

// Planet display info (id/label/color) reused by the orbitSort gate.
const P = {
  mercury: { id: 'mercury', label: 'Mercury', color: '#b1a296' },
  venus: { id: 'venus', label: 'Venus', color: '#e6c27a' },
  earth: { id: 'earth', label: 'Earth', color: '#3b82f6' },
  mars: { id: 'mars', label: 'Mars', color: '#c1440e' },
  jupiter: { id: 'jupiter', label: 'Jupiter', color: '#d8ca9d' },
  saturn: { id: 'saturn', label: 'Saturn', color: '#e3d8b0' },
  uranus: { id: 'uranus', label: 'Uranus', color: '#9fe3e3' },
  neptune: { id: 'neptune', label: 'Neptune', color: '#4b6cb7' },
};

// orbit radius + period per planet (stylized) — drives both the scene and ordering.
const ORBITS = {
  mercury: { r: 6, period: 10, radius: 0.35 },
  venus: { r: 8, period: 14, radius: 0.5 },
  earth: { r: 10, period: 18, radius: 0.55 },
  mars: { r: 12, period: 22, radius: 0.42 },
  jupiter: { r: 16, period: 34, radius: 1.2 },
  saturn: { r: 20, period: 44, radius: 1.05 },
  uranus: { r: 24, period: 54, radius: 0.8 },
  neptune: { r: 28, period: 64, radius: 0.78 },
};

const planetBody = (id) => ({ id, model: id, radius: ORBITS[id].radius, spin: 0.1, orbit: { around: 'sun', r: ORBITS[id].r, period: ORBITS[id].period } });
const ordered = (ids) => ids.map((id) => P[id]); // correct inner→outer order for the gate

export const cosmicNeighborhood = {
  id: 'cosmic-neighborhood',
  title: 'Cosmic Neighborhood',
  emoji: '🪐',
  color: '#a78bfa',
  blurb: 'The Solar System — inner vs outer planets, scale, and orbits.',

  scene: {
    skybox: 'deep-indigo',
    starfield: { count: 5000, depth: 'far' },
    lights: [
      { kind: 'ambient', intensity: 0.12 },
      { kind: 'point', position: [0, 0, 0], intensity: 2.8 },
    ],
    bodies: [
      { id: 'sun', model: 'sun', radius: 3, position: [0, 0, 0], spin: 0.05 },
      ...Object.keys(ORBITS).map(planetBody),
    ],
    beacons: [
      { station: 'inner-outer', at: 'earth', label: 'Inner & Outer' },
      { station: 'gas-giants', at: 'jupiter', label: 'Gas Giants' },
      { station: 'whole-system', at: 'neptune', label: 'The Whole System' },
    ],
    setpiece: null,
  },

  stations: [
    {
      id: 'inner-outer',
      title: 'Inner & Outer Planets',
      concept: 'inner-vs-outer-planets',
      standard: ['5-ESS1-1', 'MS-ESS1-3'],
      bands: [0, 1],
      facts: [
        { emoji: '☀️', text: 'Our Solar System has 8 planets, all circling the Sun.' },
        { emoji: '🪨', text: 'The 4 inner planets — Mercury, Venus, Earth, Mars — are small and rocky.' },
        { emoji: '🎈', text: 'The 4 outer planets are huge balls of gas and ice, much farther out.' },
      ],
      questions: [
        { prompt: 'How many planets orbit our Sun?', options: ['8', '5', '12'], answer: '8' },
        { prompt: 'What are the inner planets mostly made of?', options: ['Rock', 'Gas', 'Ice'], answer: 'Rock' },
      ],
      gate: { kind: 'orbitSort', planets: ordered(['mercury', 'venus', 'earth', 'mars']) },
    },
    {
      id: 'gas-giants',
      title: 'The Gas Giants',
      concept: 'gas-giants',
      standard: ['MS-ESS1-3'],
      bands: [1, 2],
      facts: [
        { emoji: '🪐', text: 'Jupiter is the biggest planet — over 1,000 Earths could fit inside!' },
        { emoji: '💍', text: "Saturn is famous for its bright rings, made of ice and rock." },
        { emoji: '❄️', text: 'Uranus and Neptune are icy giants, way out in the cold.' },
      ],
      questions: [
        { prompt: 'Which is the biggest planet?', options: ['Jupiter', 'Earth', 'Mars'], answer: 'Jupiter' },
        { prompt: "What are Saturn's rings made of?", options: ['Ice and rock', 'Gas', 'Fire'], answer: 'Ice and rock' },
      ],
      gate: { kind: 'orbitSort', planets: ordered(['jupiter', 'saturn', 'uranus', 'neptune']) },
    },
    {
      id: 'whole-system',
      title: 'The Whole System',
      concept: 'solar-system-order',
      standard: ['MS-ESS1-2', 'MS-ESS1-3'],
      bands: [2, 3],
      facts: [
        { emoji: '📏', text: 'Space is huge — the outer planets are billions of kilometers from the Sun.' },
        { emoji: '🥇', text: 'Mercury is closest to the Sun; Neptune is the farthest of the 8 planets.' },
        { emoji: '🌡️', text: 'Planets near the Sun are hot; far-away planets are freezing cold.' },
      ],
      questions: [
        { prompt: 'Which planet is closest to the Sun?', options: ['Mercury', 'Earth', 'Neptune'], answer: 'Mercury' },
        { prompt: 'Why are the far-away planets so cold?', options: ['They get less heat from the Sun', 'They have no color', 'They spin slower'], answer: 'They get less heat from the Sun' },
      ],
      gate: { kind: 'orbitSort', planets: ordered(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) },
    },
  ],
};

export default cosmicNeighborhood;
