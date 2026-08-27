export const motion = {
  duration: {
    instant: 0,
    press: 100,
    fast: 180,
    standard: 220,
    enter: 260,
    route: 320,
  },
  easingStandard: 'ease-in-out',
  easingEnter: 'ease-out',
  easingExit: 'ease-in',
  spring: {
    press: { damping: 18, stiffness: 260, mass: 0.8 },
    gentle: { damping: 20, stiffness: 220, mass: 0.9 },
  },
  distance: { small: 8, medium: 12, step: 20 },
  pressScale: 0.98,
  stagger: 40,
} as const;
