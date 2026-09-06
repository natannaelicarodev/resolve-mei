import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const WORDMARK_COLORS = {
  backgroundColor: '#F7F5F2',
  ink: '#24556F',
} as const;
const WORDMARK_WIDTH = 280;
const WORDMARK_HEIGHT = 104;
const WORDMARK_SOURCE = require('../../../assets/images/tavi-wordmark.png');
const WORDMARK_OUTLINE_SOURCE = require('../../../assets/images/tavi-wordmark-outline.png');

function WordmarkLayer({ outline = false }: { outline?: boolean }) {
  return (
    <Image
      resizeMode="contain"
      source={outline ? WORDMARK_OUTLINE_SOURCE : WORDMARK_SOURCE}
      style={styles.image}
    />
  );
}

export function TaviWordmark({
  completed = false,
  progress,
}: {
  completed?: boolean;
  progress: SharedValue<number>;
}) {
  const outlineRevealStyle = useAnimatedStyle(() => ({
    width: completed
      ? WORDMARK_WIDTH
      : interpolate(
          progress.value,
          [0, 0.55],
          [0, WORDMARK_WIDTH],
          Extrapolation.CLAMP,
        ),
  }));
  const fillRevealStyle = useAnimatedStyle(() => ({
    width: completed
      ? WORDMARK_WIDTH
      : interpolate(
          progress.value,
          [0.35, 1],
          [0, WORDMARK_WIDTH],
          Extrapolation.CLAMP,
        ),
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.wordmark}
    >
      <Animated.View style={[styles.reveal, outlineRevealStyle]}>
        <WordmarkLayer outline />
      </Animated.View>
      <Animated.View style={[styles.reveal, fillRevealStyle]}>
        <WordmarkLayer />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: WORDMARK_HEIGHT,
    tintColor: WORDMARK_COLORS.ink,
    width: WORDMARK_WIDTH,
  },
  reveal: {
    height: WORDMARK_HEIGHT,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  wordmark: {
    height: WORDMARK_HEIGHT,
    width: WORDMARK_WIDTH,
  },
});

export { WORDMARK_COLORS };
