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

export const roleGradient = (role) => ROLE_GRADIENT[role] ?? ROLE_GRADIENT.planet;
export const roleGlow = (role) => ROLE_GLOW[role] ?? ROLE_GLOW.planet;
