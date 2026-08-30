import type { ViewStyle } from 'react-native';

// Same literal palette as WelcomeScreen.tsx / SignInScreen.tsx — the DNA the
// user asked to preserve, not the unused src/theme token system. Any future
// production port should centralize this, but for now the prototype matches
// what the shipping auth screens actually use, value for value.
export const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  surfacePressed: '#171717',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.14)',
  primaryStrong: 'rgba(69,230,176,0.34)',
  onPrimary: '#07110E',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
  warning: '#F2B84B',
  warningSoft: 'rgba(242,184,75,0.14)',
  danger: '#FF6B6B',
  dangerSoft: '#240D0F',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 28 } as const;

export const radii = {
  control: 12,
  input: 14,
  button: 14,
  card: 22,
  panorama: 26,
  sheet: 28,
  pill: 999,
} as const;

// Matches the soft, large-radius shadow WelcomeScreen.tsx uses on its
// `previewShell` card — the actual "depth" technique already in the product,
// not a generic drop shadow.
export const elevation: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { height: 18, width: 0 },
  shadowOpacity: 0.48,
  shadowRadius: 38,
  elevation: 12,
};

export const prototypeMotion = {
  press: { damping: 18, mass: 0.4, stiffness: 340 },
  settle: { damping: 20, mass: 0.7, stiffness: 260 },
  sheet: { damping: 24, mass: 0.9, stiffness: 220 },
  ticker: { damping: 16, mass: 0.55, stiffness: 170 },
} as const;

export const dragTuning = {
  longPressMs: 320,
  releaseThresholdPx: 55,
  sheetDismissThresholdPx: 100,
} as const;
