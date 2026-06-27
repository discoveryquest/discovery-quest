// Sector 1 — "The Backyard Sky" — authored as DATA (design spec §B.1 scene-as-data
// and §3.1 curriculum alignment). The immersive engine renders `scene` from the
// primitive library; `stations` carry the learning content + NGSS standard codes.
// Adding planets/beacons/stations here is a data change, not an engine change.

export const backyardSky = {
  id: 'backyard-sky',
  title: 'The Backyard Sky',
  emoji: '🌙',
  color: '#22d3ee',
  blurb: 'Earth, the Moon, day & night, and gravity.',

  // 3D scene description — rendered by SectorScene via the primitive components.
  scene: {
    skybox: 'dawn-gradient',
    starfield: { count: 4000, depth: 'far' },
    lights: [
      { kind: 'ambient', intensity: 0.16 },
      // The Sun: a directional light (drives day-sides + Moon phases) + a glowing disc.
      { kind: 'sun', position: [60, 18, 10], intensity: 2.3, bloom: true },
    ],
    bodies: [
      { id: 'earth', model: 'earth', radius: 1.6, position: [0, 0, 0], spin: 0.15 },
      { id: 'moon', model: 'moon', radius: 0.45, spin: 0.05, orbit: { around: 'earth', r: 6, period: 36 } },
    ],
    // Spread along a sweeping arc (right → up-over-the-middle → left) so the
    // star-dust trail reads as a journey, not a cluster around Earth.
    beacons: [
      { station: 'moon-phases', at: 'moon', label: 'Moon Phases' },          // right, by the Moon
      { station: 'day-night', at: 'earth', offset: [0.5, 4, 1], label: 'Day & Night' }, // up over Earth
      { station: 'gravity', at: 'earth', offset: [-7, 1.5, 2], label: 'Gravity' },      // off to the left
    ],
    setpiece: null, // escape hatch for bespoke 3D (none needed here) — spec §B.1
  },

  // Learning content. `concept` drives XP/spaced-review; `standard` = NGSS codes
  // for reviewer audit (spec §3.1); `bands` = age tiers (0 youngest … 3 oldest).
  stations: [
    {
      id: 'moon-phases',
      title: 'Moon Phases',
      concept: 'moon-phases',
      standard: ['1-ESS1-1', '5-ESS1-2'],
      bands: [0, 1],
      facts: [
        { emoji: '🌙', text: 'The Moon makes no light of its own — it shines by reflecting sunlight.' },
        { emoji: '🌗', text: "As the Moon orbits Earth, we see more or less of its sunlit half. That's a phase!" },
        { emoji: '🔁', text: 'The phases cycle about every 29 days — new moon to full moon and back.' },
      ],
      questions: [
        { prompt: 'What gives the Moon its light?', options: ['The Sun', 'The Moon itself', "Earth's glow"], answer: 'The Sun' },
        { prompt: 'Why does the Moon look different on different nights?', options: ['We see more or less of its sunlit half', 'It changes its shape', 'Clouds cover parts of it'], answer: 'We see more or less of its sunlit half' },
      ],
      gate: { kind: 'phaseLock', target: 'waxing-gibbous' },
    },
    {
      id: 'day-night',
      title: 'Day & Night',
      concept: 'day-night-cycle',
      standard: ['1-ESS1-1', '5-ESS1-2'],
      bands: [0, 1],
      facts: [
        { emoji: '🌍', text: 'Earth spins like a top — one full spin takes about 24 hours.' },
        { emoji: '☀️', text: 'The side facing the Sun has daytime; the side facing away has night.' },
        { emoji: '🔄', text: "It's Earth's spinning — not the Sun moving — that gives us day and night." },
      ],
      questions: [
        { prompt: 'What causes day and night?', options: ['Earth spinning', 'The Sun turning off', 'The Moon blocking the Sun'], answer: 'Earth spinning' },
        { prompt: 'About how long is one full spin of Earth?', options: ['24 hours', '1 hour', '1 week'], answer: '24 hours' },
      ],
      gate: { kind: 'phaseLock', target: 'noon' },
    },
    {
      id: 'gravity',
      title: 'Gravity',
      concept: 'gravity-pulls-down',
      standard: ['5-PS2-1'],
      bands: [1, 2],
      facts: [
        { emoji: '🪐', text: 'Gravity is a pull. Everything with mass pulls on everything else.' },
        { emoji: '⬇️', text: "Earth's gravity pulls things toward its center — that's why things fall down." },
        { emoji: '🚀', text: 'The more mass something has, the stronger its gravity pull.' },
      ],
      questions: [
        { prompt: "Which way does Earth's gravity pull things?", options: ["Down, toward Earth's center", 'Up, into the sky', 'Sideways'], answer: "Down, toward Earth's center" },
        { prompt: 'What has stronger gravity?', options: ['Something with more mass', 'Something more colorful', 'Something moving faster'], answer: 'Something with more mass' },
      ],
      gate: { kind: 'phaseLock', target: 'down' },
    },
  ],
};

export const stationOrder = backyardSky.stations.map((s) => s.id);
export default backyardSky;
