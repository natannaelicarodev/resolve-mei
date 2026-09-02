import type { ViewStyle } from 'react-native';

export { colors } from './colors';
export { darkColors, lightColors } from './colors';
export type { ColorToken, ThemeColors } from './colors';
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemePreference } from './ThemeProvider';
export { motion } from './motion';
export { opacity, radii, sizes, spacing } from './spacing';
export { fontFamilies, typography } from './typography';
export type { TypographyVariant } from './typography';

/**
 * Dois níveis, não sete. `rest` separa uma superfície do fundo; `raised`
 * levanta o que flutua sobre o conteúdo. Os sete níveis anteriores tinham
 * pares idênticos (`floating` e `elevated`) e degraus indistinguíveis em
 * tela. Os nomes antigos continuam como apelidos enquanto as telas migram.
 */
const restShadow = {
  boxShadow: '0 2px 8px rgba(32, 37, 34, 0.06)',
  elevation: 2,
} satisfies ViewStyle;

const raisedShadow = {
  boxShadow: '0 6px 16px rgba(32, 37, 34, 0.10)',
  elevation: 6,
} satisfies ViewStyle;

export const shadows = {
  none: {},
  rest: restShadow,
  raised: raisedShadow,
  // Apelidos herdados enquanto as telas migram para `rest` e `raised`.
  subtle: restShadow,
  card: restShadow,
  floating: raisedShadow,
  elevated: raisedShadow,
  overlay: raisedShadow,
  modal: raisedShadow,
} satisfies Record<string, ViewStyle>;

// No escuro a sombra precisa ser mais densa para separar superfícies que já
// têm pouco contraste entre si.
const darkRestShadow = {
  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.28)',
  elevation: 4,
} satisfies ViewStyle;

const darkRaisedShadow = {
  boxShadow: '0 8px 22px rgba(0, 0, 0, 0.36)',
  elevation: 8,
} satisfies ViewStyle;

const darkShadows = {
  none: {},
  rest: darkRestShadow,
  raised: darkRaisedShadow,
  subtle: darkRestShadow,
  card: darkRestShadow,
  floating: darkRaisedShadow,
  elevated: darkRaisedShadow,
  overlay: darkRaisedShadow,
  modal: darkRaisedShadow,
} satisfies Record<string, ViewStyle>;

export function getThemeShadows(theme: 'light' | 'dark') {
  return theme === 'dark' ? darkShadows : shadows;
}
