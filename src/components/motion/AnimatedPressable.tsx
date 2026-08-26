import { useState } from 'react';
import { Animated, Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

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
  const [value] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  const animate = (pressed: boolean) => {
    const target =
      pressed && !disableScale && !reducedMotion ? motion.pressScale : 1;
    Animated.spring(value, {
      toValue: target,
      useNativeDriver: true,
      ...motion.spring,
    }).start();
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          opacity: disabled
            ? opacity.disabled
            : value.interpolate({
                inputRange: [motion.pressScale, 1],
                outputRange: [opacity.pressed, 1],
              }),
          transform: [{ scale: value }],
        },
      ]}
    >
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
