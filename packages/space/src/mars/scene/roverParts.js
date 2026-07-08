// Named subsystems exposed by the NASA Perseverance GLB. The source GLB contains
// many CAD-level nodes; this list groups them into kid-friendly rover parts and
// references the actual node names used for highlighting.
export const ROVER_PARTS = [
  {
    id: 'wheels',
    title: 'Six rock-gripping wheels',
    nodes: ['Wheels_objs', 'suspension'],
    summary: 'Six aluminum wheels and a rocker-bogie suspension help the rover crawl over rocks without tipping.',
    detail: 'Each wheel has raised treads called grousers. They bite into dusty ground so Perseverance can climb and steer slowly.',
  },
  {
    id: 'mastcam',
    title: 'Mast cameras',
    nodes: ['head', 'Mastcam_Z_cams', 'NavCams'],
    summary: 'The tall mast is the rover’s head. It carries cameras for navigation and zoomed science pictures.',
    detail: 'Mastcam-Z can zoom in on far rocks, while navigation cameras help the rover plan safe drives.',
  },
  {
    id: 'hazcams',
    title: 'Hazard cameras',
    nodes: ['hazcams_front', 'hazcams_front_cover', 'hazcams_rear', 'hazcams_rear_cover_l', 'hazcams_rear_cover_r', 'hazcams_rear_wiring'],
    summary: 'Small front and rear cameras watch for hazards close to the wheels.',
    detail: 'Before driving, the rover checks for rocks, holes, and slopes so it does not get stuck.',
  },
  {
    id: 'arm',
    title: 'Robotic arm',
    nodes: ['arm', 'arm.001', 'arm.002', 'arm.003', 'arm.004', 'turret_obj', 'turret_obj.002', 'turret_obj.004', 'turret_obj.006', 'turret_parts'],
    summary: 'A long robotic arm reaches out to inspect rocks up close.',
    detail: 'The arm places tools exactly where scientists want measurements, like a careful space geologist.',
  },
  {
    id: 'pixl',
    title: 'PIXL rock scanner',
    nodes: ['PIXL', 'PIXL_cover_01'],
    summary: 'PIXL uses X-rays to map tiny chemical clues inside rocks.',
    detail: 'It helps scientists decide whether a rock formed in water and whether it could preserve signs of ancient life.',
  },
  {
    id: 'watson',
    title: 'WATSON close-up camera',
    nodes: ['WATSON'],
    summary: 'WATSON takes close-up pictures like a magnifying glass.',
    detail: 'It can photograph rock textures and even rover hardware for engineering checkups.',
  },
  {
    id: 'rimfax',
    title: 'RIMFAX ground radar',
    nodes: ['RIMFAX'],
    summary: 'RIMFAX sends radar pulses into the ground to peek below the surface.',
    detail: 'It helps reveal buried layers, like reading a history book under the rover.',
  },
  {
    id: 'power',
    title: 'Nuclear power pack',
    nodes: ['rtg'],
    summary: 'The RTG power source makes electricity from heat, even during cold dusty nights.',
    detail: 'Solar panels can get dusty. Perseverance uses a steady power system so it can keep working for years.',
  },
  {
    id: 'antennas',
    title: 'Antennas',
    nodes: ['antenna_uhf', 'antenna_hg', 'antenna_lg'],
    summary: 'Antennas send rover messages through Mars orbiters and back to Earth.',
    detail: 'Commands from Earth and science data from Mars travel across millions of kilometres.',
  },
  {
    // Catch-all: any mesh not claimed by a named subsystem above (the main body,
    // instrument deck, brackets and wiring). Stays near the center as the anchor
    // the other parts fly off of. nodes:[] flags it as the fallback owner.
    id: 'chassis',
    title: 'Body & instrument deck',
    nodes: [],
    summary: 'The car-sized body is a warm, protected box that holds the rover’s computer and electronics.',
    detail: 'Everything else bolts onto this chassis. Heaters keep the brain-box cosy through freezing Martian nights.',
  },
];

// The fallback part that owns any mesh not matched to a named subsystem.
export const CHASSIS_ID = 'chassis';

// Kid-friendly icon per part for the game-style info card.
export const PART_EMOJI = {
  wheels: '🛞',
  mastcam: '📷',
  hazcams: '👀',
  arm: '🦾',
  pixl: '🔬',
  watson: '🔎',
  rimfax: '📡',
  power: '🔋',
  antennas: '📶',
  chassis: '🤖',
};

export function partIndexById(id) {
  return Math.max(0, ROVER_PARTS.findIndex((p) => p.id === id));
}
