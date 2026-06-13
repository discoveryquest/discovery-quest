// Geometry Galaxy lessons. ShapeSides/SymmetryFold/AngleSweep/PerimeterTrace/AreaFill/
// VolumeLayers draw their own labels & results; narration rides them.
import { LESSON_LINES as L } from './lines.js';
const b = (say, view) => ({ say, caption: L[say], view });

export const GEOMETRY_GALAXY = {
  shapes: {
    title: 'Name the Shapes',
    sections: [
      { id: 'tri', label: 'Triangle', beats: [
        b('lsh-1', { kind: 'shape', key: 'tri', sides: 3, name: 'triangle' }),
        b('lsh-2', { kind: 'shape', key: 'tri', sides: 3, name: 'triangle' }),
      ] },
      { id: 'sq', label: 'Square', beats: [b('lsh-3', { kind: 'shape', key: 'sq', sides: 4, name: 'square' })] },
      { id: 'pent', label: 'Pentagon', beats: [b('lsh-4', { kind: 'shape', key: 'pent', sides: 5, name: 'pentagon' })] },
      { id: 'go', label: 'Your turn', beats: [b('lsh-5', { kind: 'shape', key: 'hex', sides: 6, name: 'hexagon' })] },
    ],
  },
  symmetry: {
    title: 'Symmetry',
    sections: [
      { id: 'fold', label: 'Fold line', beats: [
        b('lsy-1', { kind: 'symmetry', key: 'bf', emoji: '🦋' }),
        b('lsy-2', { kind: 'symmetry', key: 'bf', emoji: '🦋' }),
      ] },
      { id: 'heart', label: 'Heart', beats: [b('lsy-3', { kind: 'symmetry', key: 'ht', emoji: '❤️' })] },
      { id: 'go', label: 'Your turn', beats: [b('lsy-4', { kind: 'symmetry', key: 'st', emoji: '⭐' })] },
    ],
  },
  angles: {
    title: 'Angles',
    sections: [
      { id: 'right', label: 'Right angle', beats: [
        b('lan-1', { kind: 'angle', key: 'a90', deg: 90 }),
        b('lan-2', { kind: 'angle', key: 'a90', deg: 90 }),
      ] },
      { id: 'acute', label: 'Acute', beats: [b('lan-3', { kind: 'angle', key: 'a45', deg: 45 })] },
      { id: 'obtuse', label: 'Obtuse', beats: [b('lan-4', { kind: 'angle', key: 'a130', deg: 130 })] },
      { id: 'go', label: 'Your turn', beats: [b('lan-5', { kind: 'angle', key: 'a90b', deg: 90 })] },
    ],
  },
  perimeter: {
    title: 'Perimeter',
    sections: [
      { id: 'edge', label: 'Around the edge', beats: [
        b('lpe-1', { kind: 'perimeter', key: 'p32', w: 3, h: 2 }),
        b('lpe-2', { kind: 'perimeter', key: 'p32', w: 3, h: 2 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lpe-3', { kind: 'perimeter', key: 'p43', w: 4, h: 3 })] },
    ],
  },
  area: {
    title: 'Area',
    sections: [
      { id: 'fill', label: 'Fill it', beats: [
        b('lar-1', { kind: 'area', key: 'ar32', w: 3, h: 2 }),
        b('lar-2', { kind: 'area', key: 'ar32', w: 3, h: 2 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lar-3', { kind: 'area', key: 'ar43', w: 4, h: 3 })] },
    ],
  },
  volume: {
    title: 'Volume',
    sections: [
      { id: 'stack', label: 'Stack cubes', beats: [
        b('lvo-1', { kind: 'volume', key: 'v322', l: 3, w: 2, h: 2 }),
        b('lvo-2', { kind: 'volume', key: 'v322', l: 3, w: 2, h: 2 }),
      ] },
      { id: 'go', label: 'Your turn', beats: [b('lvo-3', { kind: 'volume', key: 'v223', l: 2, w: 2, h: 3 })] },
    ],
  },
};
