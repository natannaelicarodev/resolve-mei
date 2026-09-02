import type { TextStyle } from 'react-native';

/**
 * Poppins é a família única do app. A rampa abaixo vem da Home — a tela mais
 * madura do produto — e passou a valer para todas as telas: escala compacta,
 * adequada a telas densas, com `letterSpacing` negativo nos títulos, que é o
 * refinamento que a rampa anterior não tinha.
 */
export const fontFamilies = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  fallback: undefined,
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  /** Dinheiro em destaque. Tabular para alinhar colunas de valores. */
  financial: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  monetaryHero: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  monetaryValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    lineHeight: 20,
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
    fontFamily: fontFamilies.medium,
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
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
