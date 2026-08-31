import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { day, dayRadii, daySizes } from './theme';

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
  | 'service'
  | 'quote'
  | 'quoteHero'
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

const SLOTS: Record<IllustrationName, Slot> = {
  income: { icon: 'trendUp', tint: day.income, soft: day.incomeSoft },
  expense: { icon: 'trendDown', tint: day.expense, soft: day.expenseSoft },
  pending: { icon: 'alert', tint: day.pending, soft: day.pendingSoft },
  approved: { icon: 'success', tint: day.income, soft: day.incomeSoft },
  client: { icon: 'client', tint: day.info, soft: day.infoSoft },
  service: { icon: 'service', tint: '#4054D6', soft: '#E8EBFF' },
  quote: { icon: 'quote', tint: day.brand, soft: day.brandSoft },
  quoteHero: { icon: 'quote', tint: day.brand, soft: day.brandSoft },
  quoteHeroDraft: { icon: 'edit', tint: day.brand, soft: day.brandSoft },
  catalog: { icon: 'money', tint: day.brand, soft: day.brandSoft },
  business: { icon: 'service', tint: '#4054D6', soft: '#E8EBFF' },
  stats: { icon: 'trendUp', tint: day.info, soft: day.infoSoft },
  empty: { icon: 'success', tint: day.income, soft: day.incomeSoft },
};

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
  expense: require('../../../assets/illustrations/card.png'),
  pending: require('../../../assets/illustrations/clock.png'),
  approved: require('../../../assets/illustrations/tick.png'),
  client: require('../../../assets/illustrations/client-person-anil.png'),
  service: require('../../../assets/illustrations/service-briefcase-cropped.png'),
  quote: require('../../../assets/illustrations/quote-clipboard-anil.png'),
  quoteHero: require('../../../assets/illustrations/quote-catalog-hero-padded-alpha.png'),
  quoteHeroDraft: require('../../../assets/illustrations/quote-continue-hero-2d.png'),
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
  const slot = SLOTS[name];
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
export const illustrationNames = Object.keys(SLOTS) as IllustrationName[];

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    borderRadius: dayRadii.pill,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
