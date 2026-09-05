import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { dayRadii, daySizes, useDayTheme } from './theme';
import type { DayPalette } from './theme';

/**
 * Every illustrated slot in the product, named by what it means rather than by
 * what it depicts. A screen asks for `income`, never for "a banknote with
 * arrows", so swapping the artwork never touches a screen.
 */
export type IllustrationName =
  | 'income'
  | 'expense'
  | 'pending'
  | 'approved'
  | 'client'
  | 'clientEmpty'
  | 'service'
  | 'quote'
  | 'quoteHero'
  | 'quoteHeroNew'
  | 'quoteHeroDraft'
  | 'catalog'
  | 'business'
  | 'stats'
  | 'empty';

interface Slot {
  /** Fallback glyph, used until real artwork is dropped in. */
  icon: IconName;
  /** Tint for the fallback glyph and its halo. */
  tint: string;
  soft: string;
}

const slotsFor = (day: DayPalette): Record<IllustrationName, Slot> => ({
  income: { icon: 'trendUp', tint: day.income, soft: day.incomeSoft },
  expense: { icon: 'trendDown', tint: day.expense, soft: day.expenseSoft },
  pending: { icon: 'alert', tint: day.pending, soft: day.pendingSoft },
  approved: { icon: 'success', tint: day.income, soft: day.incomeSoft },
  client: { icon: 'client', tint: day.info, soft: day.infoSoft },
  clientEmpty: { icon: 'client', tint: day.info, soft: day.infoSoft },
  service: { icon: 'service', tint: day.brand, soft: day.brandSoft },
  quote: { icon: 'quote', tint: day.brand, soft: day.brandSoft },
  quoteHero: { icon: 'quote', tint: day.brand, soft: day.brandSoft },
  quoteHeroNew: { icon: 'quote', tint: day.brand, soft: day.brandSoft },
  quoteHeroDraft: { icon: 'edit', tint: day.brand, soft: day.brandSoft },
  catalog: { icon: 'money', tint: day.brand, soft: day.brandSoft },
  business: { icon: 'service', tint: day.brand, soft: day.brandSoft },
  stats: { icon: 'trendUp', tint: day.info, soft: day.infoSoft },
  empty: { icon: 'success', tint: day.income, soft: day.incomeSoft },
});

/**
 * Artwork registry.
 *
 * Drop PNG or SVG files into `assets/illustrations/` and map them here — the
 * screens need no change, because they address artwork by role. Anything left
 * unmapped falls back to a tinted glyph, so the product is never broken by a
 * missing file.
 *
 * Expected: square, transparent, 3x for the largest slot (168px for a 56pt
 * frame).
 */
const ARTWORK: Partial<Record<IllustrationName, ImageSourcePropType>> = {
  income: require('../../../assets/illustrations/money.png'),
  expense: require('../../../assets/illustrations/home-expense-3x.png'),
  pending: require('../../../assets/illustrations/clock.png'),
  approved: require('../../../assets/illustrations/tick.png'),
  client: require('../../../assets/illustrations/client-person-anil.png'),
  clientEmpty: require('../../../assets/illustrations/tavi-clientes-circulo-transparente.png'),
  service: require('../../../assets/illustrations/home-service-3x.png'),
  quote: require('../../../assets/illustrations/home-quote-3x.png'),
  quoteHero: require('../../../assets/illustrations/home-quote-hero-sent-3x.png'),
  quoteHeroNew: require('../../../assets/illustrations/home-quote-hero-new-3x.png'),
  quoteHeroDraft: require('../../../assets/illustrations/home-quote-hero-draft-3x.png'),
  catalog: require('../../../assets/illustrations/bag.png'),
  business: require('../../../assets/illustrations/business-store-cropped.png'),
  stats: require('../../../assets/illustrations/chart.png'),
  empty: require('../../../assets/illustrations/folder.png'),
};

export interface IllustrationProps {
  name: IllustrationName;
  /** Frame size. Defaults to the list-row slot. */
  size?: number;
  /** Hides the tinted halo, for artwork that carries its own background. */
  bare?: boolean;
}

/**
 * A circular illustrated slot. Renders real artwork when it has been supplied,
 * and a tinted glyph until then.
 */
export function Illustration({
  bare = false,
  name,
  size = daySizes.illustration,
}: IllustrationProps) {
  const day = useDayTheme();
  const slot = slotsFor(day)[name];
  const art = ARTWORK[name];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.frame,
        { borderRadius: size / 2, height: size, width: size },
        !bare && !art && { backgroundColor: slot.soft },
        !bare && art ? { backgroundColor: 'transparent' } : null,
      ]}
    >
      {art ? (
        <Image
          resizeMode="contain"
          source={art}
          style={{ height: size, width: size }}
        />
      ) : (
        <Icon
          name={slot.icon}
          rawColor={slot.tint}
          size={size >= daySizes.illustrationLarge ? 'large' : 'medium'}
        />
      )}
    </View>
  );
}

/** True when real artwork has been supplied for a slot. */
export function hasArtwork(name: IllustrationName): boolean {
  return ARTWORK[name] !== undefined;
}

/** Every slot the product declares. Used by the coverage test. */
export const illustrationNames = Object.keys(ARTWORK) as IllustrationName[];

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    borderRadius: dayRadii.pill,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
