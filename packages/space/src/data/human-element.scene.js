// Sector 4 — "The Human Element" — the ISS, satellites, getting to space, and
// living on Mars, as DATA (spec §B.1, §3.1). Engineering/STEM enrichment
// (NGSS 3-5-ETS1 + NASA mission content), not core science standards. New gate
// kind here: `dock`. Completes the four spec sectors.

export const humanElement = {
  id: 'human-element',
  title: 'The Human Element',
  emoji: '🛰️',
  color: '#2dd4bf',
  blurb: 'The ISS, satellites, getting to space, and living on Mars.',

  scene: {
    skybox: 'orbit-teal',
    starfield: { count: 5000, depth: 'far' },
    lights: [
      { kind: 'ambient', intensity: 0.18 },
      { kind: 'sun', position: [40, 15, 10], intensity: 2.2, bloom: true },
    ],
    bodies: [
      { id: 'earth', model: 'earth', radius: 2.4, position: [0, 0, 0], spin: 0.08 },
      { id: 'iss', model: 'iss', radius: 0.35, spin: 0.3, orbit: { around: 'earth', r: 5, period: 12 } },
      { id: 'satellite', model: 'satellite', radius: 0.22, spin: 0.5, orbit: { around: 'earth', r: 7, period: 18, phase: 1.6 } },
      { id: 'mars', model: 'mars', radius: 1.0, position: [16, 2, -8], spin: 0.1 },
    ],
    beacons: [
      { station: 'life-in-orbit', at: 'iss', label: 'Life in Orbit' },
      { station: 'getting-there', at: 'satellite', label: 'Getting There' },
      { station: 'mars-base', at: 'mars', label: 'Mars Base' },
    ],
    setpiece: null,
  },

  stations: [
    {
      id: 'life-in-orbit',
      title: 'Life in Orbit',
      concept: 'iss-astronauts',
      standard: ['3-5-ETS1-1'],
      bands: [0, 1],
      facts: [
        { emoji: '🛰️', text: 'The International Space Station orbits Earth about every 90 minutes.' },
        { emoji: '🧑‍🚀', text: "Astronauts float because they're in constant free-fall around Earth." },
        { emoji: '🔬', text: "Crews run science experiments you can't do on the ground." },
      ],
      questions: [
        { prompt: 'How often does the ISS circle Earth?', options: ['About every 90 minutes', 'Once a day', 'Once a year'], answer: 'About every 90 minutes' },
        { prompt: 'Why do astronauts float on the ISS?', options: ["They're in free-fall around Earth", 'There is no gravity in space', 'They wear special shoes'], answer: "They're in free-fall around Earth" },
      ],
      gate: { kind: 'dock', target: 'the ISS' },
    },
    {
      id: 'getting-there',
      title: 'Getting There',
      concept: 'space-travel-tech',
      standard: ['3-5-ETS1-2'],
      bands: [1, 2],
      facts: [
        { emoji: '🚀', text: 'Rockets push hot gas down hard, and that thrust pushes them up into space.' },
        { emoji: '⛽', text: 'Reaching orbit takes enormous speed — about 28,000 km/h!' },
        { emoji: '🪂', text: 'Many rockets now land back on Earth so they can be flown again.' },
      ],
      questions: [
        { prompt: 'What pushes a rocket upward?', options: ['Thrust from its engines', 'Wind', 'Magnets'], answer: 'Thrust from its engines' },
        { prompt: "What's special about many modern rockets?", options: ['They can land and be reused', 'They never need fuel', 'They are made of paper'], answer: 'They can land and be reused' },
      ],
      gate: { kind: 'dock', target: 'the transfer vehicle' },
    },
    {
      id: 'mars-base',
      title: 'Mars Base',
      concept: 'living-off-earth',
      standard: ['3-5-ETS1-3'],
      bands: [2, 3],
      facts: [
        { emoji: '🔴', text: 'Mars is a cold, dusty desert world — about half the size of Earth.' },
        { emoji: '🥶', text: 'A trip to Mars takes around 7 months with today\'s rockets.' },
        { emoji: '🏠', text: 'Future explorers will need to bring or make their own air, water, and food.' },
      ],
      questions: [
        { prompt: 'What is Mars like?', options: ['A cold, dusty desert', 'A warm ocean world', 'A ball of gas'], answer: 'A cold, dusty desert' },
        { prompt: 'What will Mars explorers need to make or bring?', options: ['Air, water, and food', 'Just sunglasses', 'Nothing at all'], answer: 'Air, water, and food' },
      ],
      gate: { kind: 'dock', target: 'the Mars lander' },
    },
  ],
};

export default humanElement;
