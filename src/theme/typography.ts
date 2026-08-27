import type { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  fallback: undefined,
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
  },
  pageTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: 0,
  },
  cardTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySecondary: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  financial: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  monetaryHero: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  monetaryValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  navigation: {
    fontFamily: fontFamilies.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  status: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
