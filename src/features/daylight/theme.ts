import { lightColors } from '@/theme';

/**
 * "Daylight" — the light, friendly direction.
 *
 * Every value here comes from `src/theme/colors.ts`, the app's real token file,
 * rather than a sixth competing palette. The named aliases exist so a screen
 * reads in the product's own words ("income", "expense") instead of in raw
 * token names, and so the mapping is stated once rather than guessed at each
 * call site.
 */
export const day = {
  /** Page ground. A soft grey so white cards read as raised. */
  canvas: lightColors.background,
  /** Card and sheet surfaces. */
  surface: lightColors.surface,
  /** A block nested inside a card. */
  surfaceMuted: lightColors.surfaceMuted,
  /** Held state. */
  surfacePressed: lightColors.surfacePressed,

  textPrimary: lightColors.textPrimary,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,

  /** Brand. Header, primary action, selected state. */
  brand: lightColors.primary,
  brandPressed: lightColors.primaryPressed,
  brandSoft: lightColors.primarySubtle,
  onBrand: lightColors.textOnPrimary,

  /** Money coming in, and anything confirmed. */
  income: lightColors.success,
  incomeSoft: lightColors.successSubtle,
  /** Money going out, and hard failures. */
  expense: lightColors.danger,
  expenseSoft: lightColors.dangerSubtle,
  /** Needs attention, but nothing is broken. */
  pending: lightColors.warning,
  pendingSoft: lightColors.warningSubtle,
  /** Neutral information. */
  info: lightColors.info,
  infoSoft: lightColors.infoSubtle,

  border: lightColors.border,
  borderStrong: lightColors.borderStrong,
  disabled: lightColors.disabled,
  disabledText: lightColors.disabledText,
} as const;

export const daySpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

/**
 * Friendly radii. Generous on cards, tighter on the controls inside them, so a
 * button never looks inflated within its own card.
 */
export const dayRadii = {
  chip: 8,
  control: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const daySizes = {
  control: 48,
  touchTarget: 44,
  /** Circular illustration slot on a list row. */
  illustration: 44,
  /** Larger slot for a feature card. */
  illustrationLarge: 56,
  /** Hero slot, beside a headline. */
  illustrationHero: 72,
  /** Matches ProtectedBottomNavigation's own minHeight. Keep in sync. */
  tabBar: 84,
  /** Bottom navigation participates in layout, so only breathing room remains. */
  scrollTail: 20,
} as const;

/**
 * Motion. Short and purposeful: a light UI reads as sluggish long before a dark
 * one does, so nothing here runs past a third of a second.
 */
export const dayMotion = {
  press: 120,
  fast: 180,
  enter: 240,
  /** Delay between consecutive rows in a cascade. */
  stagger: 45,
} as const;

export const daySpring = {
  /** Signature settle: visible, soft, never floppy. */
  gentle: { damping: 16, stiffness: 180, mass: 0.8 },
  /** Tracks a finger; must not wobble under it. */
  press: { damping: 20, stiffness: 340, mass: 0.5 },
} as const;

/** Scale a surface settles to while held. */
export const PRESS_SCALE = 0.97;

/**
 * Soft elevation. Light themes need shadow to separate white-on-grey, but a
 * heavy drop looks cheap — this is wide and faint.
 */
export const dayShadow = {
  shadowColor: '#1A1D2E',
  shadowOffset: { height: 2, width: 0 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const dayShadowRaised = {
  shadowColor: '#1A1D2E',
  shadowOffset: { height: 6, width: 0 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 6,
} as const;

/** Type ramp. Poppins is the app's own family, already loaded at the root. */
export const dayType = {
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
  },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: 'Poppins_500Medium', fontSize: 14, lineHeight: 20 },
  label: { fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16 },
  /** Money. Tabular so columns of figures line up. */
  money: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  moneySmall: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
} as const;
