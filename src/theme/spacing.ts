/**
 * Escala única, em grid de 4 px. Os degraus de 12 e 20 vêm da Home: sem eles,
 * separar blocos dentro de um card obriga a escolher entre 8 (apertado) e
 * 16 (largo), que era a origem do ritmo irregular nas telas operacionais.
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  // Apelidos herdados. Mantidos nos valores originais: 259 usos dependem
  // deles, e redefini-los moveria o layout de todas as telas de uma vez.
  // Código novo usa a escala numérica acima.
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Três raios, não onze. Controle para tudo que se toca, card para superfície
 * de conteúdo, folha para o que sobe do rodapé. `pill` é o caso circular.
 */
export const radii = {
  control: 12,
  card: 16,
  sheet: 24,
  pill: 999,
  // Aliases mantidos enquanto as telas migram para os três nomes acima.
  small: 12,
  input: 12,
  button: 12,
  medium: 12,
  large: 16,
  largeCard: 16,
  modal: 24,
  circular: 999,
  sm: 12,
  md: 12,
} as const;

export const sizes = {
  buttonMinHeight: 52,
  inputHeight: 56,
  controlHeight: 52,
  touchTarget: 48,
  contentMaxWidth: 560,
  contentWideMaxWidth: 960,
  screenGutter: 16,
  screenGutterLarge: 24,
  sectionGap: 24,
  /** Único token de padding de card. O `Card` consome só este. */
  cardPadding: 20,
  bottomNavigationHeight: 76,
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 72,
} as const;

export const opacity = {
  pressed: 0.88,
  muted: 0.72,
  disabled: 0.48,
  overlay: 0.56,
  skeleton: 0.62,
} as const;
