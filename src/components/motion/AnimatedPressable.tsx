import { Pressable } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';

import { motion, opacity } from '@/theme';
import { triggerHaptic } from '@/lib/haptics';
import type { HapticIntent } from '@/lib/haptics';
import { useReducedMotion } from './useReducedMotion';

export interface AnimatedPressableProps extends PressableProps {
  /**
   * Aplicado ao `Animated.View` externo, então aceita estilo animado — é onde
   * um chamador anima cor ou borda. O `style` interno vai para um `Pressable`
   * comum e ignora estilo do Reanimated.
   */
  containerStyle?: AnimatedProps<ViewProps>['style'];
  disableScale?: boolean;
  haptic?: HapticIntent | false;
  style?: PressableProps['style'];
}

export function AnimatedPressable({
  containerStyle,
  disableScale = false,
  disabled,
  haptic = false,
  onPress,
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
        onPress={(event) => {
          if (haptic) void triggerHaptic(haptic);
          onPress?.(event);
        }}
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
