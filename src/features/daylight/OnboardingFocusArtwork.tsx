import { Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import type { OnboardingPriority } from '@/features/business/schemas';

const ARTWORK: Record<OnboardingPriority, ImageSourcePropType> = {
  agenda: require('../../../assets/images/onboarding-agenda-3d.png'),
  collections: require('../../../assets/images/onboarding-collections-3d.png'),
  profit: require('../../../assets/images/onboarding-profit-3d.png'),
  quotes: require('../../../assets/images/onboarding-quotes-3d.png'),
};

/** Compact contextual artwork shown once after onboarding. */
export function OnboardingFocusArtwork({
  priority,
  size = 120,
}: {
  priority: OnboardingPriority;
  size?: number;
}) {
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no"
      resizeMode="contain"
      source={ARTWORK[priority]}
      style={{ height: size, width: size }}
      testID={`onboarding-focus-artwork-${priority}`}
    />
  );
}
