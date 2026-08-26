import type { ViewStyle } from 'react-native';

export { colors } from './colors';
export type { ColorToken } from './colors';
export { motion } from './motion';
export { opacity, radii, sizes, spacing } from './spacing';
export { fontFamilies, typography } from './typography';
export type { TypographyVariant } from './typography';

export const shadows = {
  none: {},
  card: {
    boxShadow: '0 2px 8px rgba(32, 37, 34, 0.07)',
    elevation: 2,
  },
  floating: {
    boxShadow: '0 6px 18px rgba(32, 37, 34, 0.11)',
    elevation: 5,
  },
  modal: {
    boxShadow: '0 12px 32px rgba(32, 37, 34, 0.16)',
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;
