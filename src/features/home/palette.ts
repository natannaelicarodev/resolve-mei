/**
 * The "Direção B" palette the shipping screens actually use — Welcome, SignIn,
 * SignUp, Onboarding, Clientes, Serviços and the bottom navigation all carry
 * these literal values. It is deliberately not `src/theme` tokens: reconciling
 * the two systems is a separate decision, tracked in SPEC-home-bright-desk.md.
 *
 * Extracted here so the Home surfaces share one source instead of redeclaring
 * the same hex in every file.
 */
export const homePalette = {
  background: '#000000',
  surface: '#0A0A0A',
  raised: '#121212',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.13)',
  onPrimary: '#07110E',
  text: '#FFFFFF',
  secondary: '#A1A1A7',
  muted: '#85878E',
  // Lifted from #6C6E75 so small print clears WCAG AA (4.5:1) on #0A0A0A;
  // the old value measured 3.89:1.
  faint: '#8A8C93',
  warning: '#F2B84B',
  warningSoft: 'rgba(242,184,75,0.14)',
  onWarning: '#231803',
  info: '#7FB2FF',
  infoSoft: 'rgba(127,178,255,0.14)',
  neutralSoft: 'rgba(255,255,255,0.06)',
} as const;
