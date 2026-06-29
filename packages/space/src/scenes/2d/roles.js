// Shared celestial-body visual styling (role → radial-gradient fill + bloom glow color).
// Imported by Body2D, Orbit2D, and Compare2D so the look stays consistent (no copy-paste drift).
export const ROLE_GRADIENT = {
  star: 'radial-gradient(circle at 38% 35%, #fff7e0 0%, #ffe066 18%, #ffac18 48%, #c45a00 80%, #5a1800 100%)',
  planet:
    'radial-gradient(circle at 36% 32%, #c8e8ff 0%, #4fa8e8 22%, #1460b8 55%, #052050 85%, #020d1f 100%)',
  moon: 'radial-gradient(circle at 38% 32%, #e8e8e0 0%, #c0c0b8 25%, #8c8c80 60%, #404038 90%, #1a1a14 100%)',
  blackhole:
    'radial-gradient(circle at 50% 50%, #1a0808 0%, #0a0505 40%, #050202 70%, #020101 100%)',
};

export const ROLE_GLOW = {
  star: 'rgba(255,180,30,0.7)',
  planet: 'rgba(60,150,255,0.55)',
  moon: 'rgba(200,200,180,0.35)',
  blackhole: 'rgba(255,80,30,0.7)',
};

export const CELESTIAL_THEME = {
  mercury: {
    gradient:
      'radial-gradient(circle at 38% 32%, #f4f0dd 0%, #b8ac94 30%, #6c6254 68%, #221e1a 100%)',
    glow: 'rgba(210,200,180,0.36)',
  },
  venus: {
    gradient:
      'radial-gradient(circle at 36% 31%, #fff0bf 0%, #e7b653 34%, #b76b24 70%, #3b1c08 100%)',
    glow: 'rgba(248,190,90,0.5)',
  },
  earth: {
    gradient:
      'radial-gradient(circle at 34% 30%, #d8fff1 0%, #37b8e8 26%, #168358 48%, #0d4da8 70%, #051932 100%)',
    glow: 'rgba(72,190,255,0.58)',
  },
  mars: {
    gradient:
      'radial-gradient(circle at 36% 32%, #ffd0a8 0%, #d96b35 34%, #8d321e 68%, #2d0d08 100%)',
    glow: 'rgba(230,105,55,0.48)',
  },
  moon: {
    gradient:
      'radial-gradient(circle at 38% 32%, #e8e8e0 0%, #c0c0b8 25%, #8c8c80 60%, #404038 90%, #1a1a14 100%)',
    glow: 'rgba(200,200,180,0.35)',
  },
  jupiter: {
    gradient:
      'radial-gradient(circle at 36% 31%, #fff4d8 0%, #d7a66d 24%, #b9773d 44%, #e6cfac 58%, #7e4324 78%, #2d160d 100%)',
    glow: 'rgba(226,170,105,0.5)',
  },
  saturn: {
    gradient:
      'radial-gradient(circle at 36% 31%, #fff6d8 0%, #e1bf74 34%, #b98743 68%, #38210d 100%)',
    glow: 'rgba(236,200,120,0.46)',
  },
  uranus: {
    gradient:
      'radial-gradient(circle at 35% 31%, #e3fff8 0%, #8ee8df 34%, #3aa9bf 68%, #0c3445 100%)',
    glow: 'rgba(120,235,225,0.48)',
  },
  neptune: {
    gradient:
      'radial-gradient(circle at 35% 31%, #d8ecff 0%, #5e8dff 34%, #2446c6 68%, #07143d 100%)',
    glow: 'rgba(90,130,255,0.52)',
  },
  asteroid: {
    gradient:
      'radial-gradient(circle at 38% 32%, #eee4d2 0%, #9a8f80 35%, #5f574e 70%, #201d19 100%)',
    glow: 'rgba(190,180,165,0.32)',
  },
  comet: {
    gradient:
      'radial-gradient(circle at 36% 31%, #f3ffff 0%, #a5f3fc 35%, #6bb7d0 70%, #173544 100%)',
    glow: 'rgba(150,235,255,0.48)',
  },
};

export const roleGradient = (role) => ROLE_GRADIENT[role] ?? ROLE_GRADIENT.planet;
export const roleGlow = (role) => ROLE_GLOW[role] ?? ROLE_GLOW.planet;
export const celestialGradient = (role, color) => {
  if (color && CELESTIAL_THEME[color]) return CELESTIAL_THEME[color].gradient;
  if (color && color.includes('gradient(')) return color;
  if (color) {
    return `radial-gradient(circle at 36% 32%, #ffffff 0%, ${color} 42%, #07111f 100%)`;
  }
  return roleGradient(role);
};
export const celestialGlow = (role, color) => {
  if (color && CELESTIAL_THEME[color]) return CELESTIAL_THEME[color].glow;
  return roleGlow(role);
};
