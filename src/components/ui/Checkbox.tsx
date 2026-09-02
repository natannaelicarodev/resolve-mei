import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/components/motion';
import { colors, motion, radii, sizes, spacing, useTheme } from '@/theme';
import { Text } from './Text';
import { Icon } from './Icon';

interface CheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ checked, label, onChange, error }: CheckboxProps) {
  const { colors: themeColors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    const target = checked ? 1 : 0;
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: motion.duration.fast });
  }, [checked, progress, reducedMotion]);

  // A caixa preenche de dentro para fora em vez de trocar de cor de um quadro
  // para o outro.
  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', themeColors.primary],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [themeColors.borderSubtle, themeColors.primary],
    ),
  }));

  // O glyph acompanha com mola: sem isso ele apareceria seco no meio de uma
  // transição suave, que lê pior do que não animar nada.
  const markStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: reducedMotion
          ? 1
          : withSpring(checked ? 1 : 0.6, motion.spring.press),
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel={label}
        accessibilityHint={error}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <Animated.View style={[styles.box, boxStyle]}>
          {/* Sempre montado: desmontar o glyph impediria animar sua saída.
              O `Pressable` acima já é o elemento acessível e anuncia o estado
              por `accessibilityState`, então a marca não vira um nó próprio. */}
          <Animated.View style={markStyle}>
            <Icon
              color="textInverse"
              name="success"
              size="small"
              testID="checkbox-checked-icon"
            />
          </Animated.View>
        </Animated.View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: themeColors.danger }}
          variant="caption"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  label: { flex: 1 },
  error: { color: colors.danger },
});
