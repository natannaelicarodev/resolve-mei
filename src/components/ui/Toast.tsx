import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { getThemeShadows, motion, radii, spacing, useTheme } from '@/theme';
import type { FeedbackVariant } from './InlineFeedback';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { Icon } from './Icon';

type ToastInput = {
  title: string;
  message?: string;
  variant?: FeedbackVariant;
  duration?: number;
};

type ToastContextValue = { showToast: (toast: ToastInput) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const { colors, resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [toast, setToast] = useState<ToastInput>();
  const progress = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const clearToast = () => setToast(undefined);
    progress.value = withTiming(
      0,
      {
        duration: reducedMotion
          ? motion.duration.instant
          : motion.duration.fast,
      },
      (finished) => {
        if (finished) runOnJS(clearToast)();
      },
    );
  }, [progress, reducedMotion]);

  const showToast = useCallback(
    (next: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      cancelAnimation(progress);
      setToast(next);
      progress.value = reducedMotion ? 1 : 0;
      if (next.variant === 'success') void triggerHaptic('success');
      if (next.variant === 'error') void triggerHaptic('error');
      progress.value = reducedMotion
        ? withTiming(1, { duration: motion.duration.instant })
        : withSpring(1, motion.spring.gentle);
      timer.current = setTimeout(dismiss, next.duration ?? 4500);
    },
    [dismiss, progress, reducedMotion],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  const variant = toast?.variant ?? 'info';
  const config = {
    success: { color: colors.success, icon: 'success' as const },
    error: { color: colors.danger, icon: 'alert' as const },
    warning: { color: colors.warning, icon: 'alert' as const },
    info: { color: colors.info, icon: 'statusInfo' as const },
  }[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : -12 + progress.value * 12 }],
  }));

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityRole={variant === 'error' ? 'alert' : undefined}
          style={[
            styles.position,
            getThemeShadows(resolvedTheme).overlay,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderSubtle,
              top: insets.top + spacing.sm,
            },
            animatedStyle,
          ]}
        >
          <View style={[styles.icon, { backgroundColor: `${config.color}20` }]}>
            <Icon name={config.icon} rawColor={config.color} size="medium" />
          </View>
          <View style={styles.copy}>
            <Text variant="label">{toast.title}</Text>
            {toast.message ? (
              <Text color="textSecondary" variant="bodySmall">
                {toast.message}
              </Text>
            ) : null}
          </View>
          <IconButton
            accessibilityLabel="Fechar mensagem"
            icon={<Icon color="textSecondary" name="close" size="medium" />}
            onPress={dismiss}
          />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  position: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    maxWidth: 520,
    padding: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    zIndex: 1000,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
});
