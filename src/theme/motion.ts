export const motion = {
  duration: { instant: 0, press: 100, fast: 180, enter: 260, success: 320 },
  distance: { small: 8, medium: 12, step: 20 },
  pressScale: 0.98,
  stagger: 40,
  spring: { damping: 18, stiffness: 260, mass: 0.8 },
} as const;
