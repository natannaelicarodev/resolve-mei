import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion, opacity } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

export interface AnimatedPressableProps extends PressableProps {
  containerStyle?: StyleProp<ViewStyle>;
  disableScale?: boolean;
  style?: PressableProps['style'];
}

export function AnimatedPressable({
  containerStyle,
  disableScale = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  children,
  ...props
}: AnimatedPressableProps) {
  const value = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animate = (pressed: boolean) => {
    const target =
      pressed && !disableScale && !reducedMotion ? motion.pressScale : 1;
    value.value = withSpring(target, motion.spring.press);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: disabled
      ? opacity.disabled
      : interpolate(value.value, [motion.pressScale, 1], [opacity.pressed, 1]),
    transform: [{ scale: value.value }],
  }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        disabled={disabled}
        onPressIn={(event) => {
          animate(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(false);
          onPressOut?.(event);
        }}
        style={style}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
