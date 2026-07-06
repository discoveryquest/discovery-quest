// Pure gravity/jump math. Shared by PlayerController (jump) and the HUD gravity
// toggle. A SINGLE JUMP_V0 is used across gravity modes so the same impulse
// visibly behaves differently under Mars vs Earth — that difference IS the lesson.
export const GRAVITY = { mars: 3.72, earth: 9.81 };

export const apexHeight = (v0, g) => (v0 * v0) / (2 * g);   // metres
export const hangTime = (v0, g) => (2 * v0) / g;            // seconds (up + down)
