import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import type { FeedbackVariant } from './InlineFeedback';
import { IconButton } from './IconButton';
import { Text } from './Text';

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
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(progress, {
      duration: reducedMotion ? 0 : 140,
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(undefined);
    });
  }, [progress, reducedMotion]);

  const showToast = useCallback(
    (next: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      progress.stopAnimation();
      setToast(next);
      progress.setValue(reducedMotion ? 1 : 0);
      if (next.variant === 'success') void triggerHaptic('success');
      if (next.variant === 'error') void triggerHaptic('error');
      Animated.spring(progress, {
        damping: 22,
        stiffness: 240,
        toValue: 1,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(dismiss, next.duration ?? 4500);
    },
    [dismiss, progress, reducedMotion],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  const variant = toast?.variant ?? 'info';
  const config = {
    success: { color: colors.success, icon: 'check-circle-outline' as const },
    error: { color: colors.danger, icon: 'alert-circle-outline' as const },
    warning: { color: colors.warning, icon: 'alert-outline' as const },
    info: { color: colors.info, icon: 'information-outline' as const },
  }[variant];

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
              opacity: progress,
              top: insets.top + spacing.sm,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: reducedMotion ? [0, 0] : [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: `${config.color}20` }]}>
            <MaterialCommunityIcons
              color={config.color}
              name={config.icon}
              size={22}
            />
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
            icon={
              <MaterialCommunityIcons
                color={colors.textSecondary}
                name="close"
                size={20}
              />
            }
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
