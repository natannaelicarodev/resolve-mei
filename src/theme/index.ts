import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F5F7F8',
  surface: '#FFFFFF',
  primary: '#087F5B',
  primaryPressed: '#066649',
  textOnPrimary: '#FFFFFF',
  text: '#172126',
  textMuted: '#59656B',
  border: '#CDD5D8',
  danger: '#B42318',
  disabled: '#D8DEDF',
  disabledText: '#6D787D',
  focus: '#2563EB',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radii = { sm: 4, md: 8 } as const;
export const sizes = {
  controlHeight: 48,
  touchTarget: 44,
  contentMaxWidth: 560,
} as const;
export const typography = {
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>;
export const shadows = {
  card: {
    boxShadow: '0 2px 8px rgba(23, 33, 38, 0.08)',
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;
