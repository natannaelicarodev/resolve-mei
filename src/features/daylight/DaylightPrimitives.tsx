import { router } from 'expo-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/components/motion';
import { Text } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import { Illustration } from './Illustration';
import type { IllustrationName } from './Illustration';
import {
  PRESS_SCALE,
  day,
  dayMotion,
  dayRadii,
  dayShadow,
  daySpace,
  daySpring,
  dayType,
} from './theme';

/**
 * Anything tappable. Compresses under the finger and springs back.
 *
 * The shared value is read only inside `useAnimatedStyle` — never in the render
 * scope, which is what Reanimated forbids.
 */
export function Tappable({
  accessibilityHint,
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  style,
}: {
  accessibilityHint?: string;
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: object;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const fire = () => {
    void triggerHaptic('selection');
    onPress();
  };

  const tap = Gesture.Tap()
    .maxDuration(10_000)
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      scale.set(reduced ? 1 : withSpring(PRESS_SCALE, daySpring.press));
    })
    .onEnd((_event, success) => {
      'worklet';
      scale.set(reduced ? 1 : withSpring(1, daySpring.gentle));
      if (success) runOnJS(fire)();
    })
    .onFinalize(() => {
      'worklet';
      scale.set(reduced ? 1 : withSpring(1, daySpring.gentle));
    });

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessible
        style={[style, disabled && styles.disabled, animated]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

/** Staggered entrance. Each item rises once, offset from its neighbour. */
export function Enter({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: object;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.set(1);
      return;
    }
    progress.set(
      withDelay(index * dayMotion.stagger, withSpring(1, daySpring.gentle)),
    );
  }, [index, progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** One-time signature entrance for the hero artwork. Never loops. */
export function HeroArtwork({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.set(1);
      return;
    }
    progress.set(withDelay(dayMotion.stagger, withSpring(1, daySpring.gentle)));
  }, [progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.92 + progress.value * 0.08 },
      { rotate: `${(1 - progress.value) * -2}deg` },
    ],
  }));

  return <Animated.View style={animated}>{children}</Animated.View>;
}

/** Fades a remote avatar in only after its pixels are ready. */
export function ProfileAvatarImage({
  style,
  uri,
}: {
  style: StyleProp<ImageStyle>;
  uri: string;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    opacity.set(reduced ? 1 : 0);
  }, [opacity, reduced, uri]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Image
      onLoad={() =>
        opacity.set(reduced ? 1 : withTiming(1, { duration: dayMotion.fast }))
      }
      source={{ uri }}
      style={[style, animated]}
      testID="profile-image"
    />
  );
}

/** A plain white card. */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export interface Shortcut {
  id: string;
  art: IllustrationName;
  label: string;
  /** One line saying what the area is for. */
  hint: string;
  route: string;
}

/** One compact cell in the four-across business navigation strip. */
export function ShortcutTile({
  compact = false,
  index,
  shortcut,
}: {
  compact?: boolean;
  index: number;
  shortcut: Shortcut;
}) {
  return (
    <Enter
      index={index}
      style={[styles.shortcutWrap, compact && styles.shortcutWrapCompact]}
    >
      <Tappable
        accessibilityHint={shortcut.hint}
        accessibilityLabel={shortcut.label}
        onPress={() => router.push(shortcut.route as never)}
        style={styles.shortcut}
      >
        <Illustration name={shortcut.art} bare size={32} />
        <Text numberOfLines={2} style={styles.shortcutLabel}>
          {shortcut.label}
        </Text>
      </Tappable>
    </Enter>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },

  card: {
    backgroundColor: day.surface,
    borderRadius: dayRadii.card,
    padding: daySpace.lg,
    ...dayShadow,
  },

  // Equal flex keeps all four destinations visible at every phone width.
  shortcutWrap: { flex: 1, minWidth: 0 },
  shortcutWrapCompact: { flexBasis: '47%', flexGrow: 1 },
  shortcut: {
    alignItems: 'center',
    backgroundColor: day.surface,
    borderRadius: dayRadii.control,
    gap: daySpace.xs,
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: daySpace.xs,
    paddingVertical: daySpace.sm,
    ...dayShadow,
  },
  shortcutLabel: {
    ...dayType.label,
    color: day.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
