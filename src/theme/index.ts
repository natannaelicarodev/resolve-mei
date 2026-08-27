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

export const shadows = {
  none: {},
  card: {
    boxShadow: '0 2px 8px rgba(28, 26, 36, 0.07)',
    elevation: 2,
  },
  floating: {
    boxShadow: '0 6px 18px rgba(28, 26, 36, 0.11)',
    elevation: 5,
  },
  modal: {
    boxShadow: '0 12px 32px rgba(28, 26, 36, 0.16)',
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

const darkShadows = {
  none: {},
  card: {
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.28)',
    elevation: 4,
  },
  floating: {
    boxShadow: '0 7px 20px rgba(0, 0, 0, 0.34)',
    elevation: 6,
  },
  modal: {
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.42)',
    elevation: 9,
  },
} satisfies Record<string, ViewStyle>;

export function getThemeShadows(theme: 'light' | 'dark') {
  return theme === 'dark' ? darkShadows : shadows;
}
