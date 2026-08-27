import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { motion, radii, shadows, spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const titleRef = useRef<View>(null);
  // Guards against a double tap firing the action twice while the dialog
  // animates out; reset whenever the dialog is reopened.
  const settled = useRef(false);

  useEffect(() => {
    if (visible) settled.current = false;
  }, [visible]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, visible]);

  const settle = (action: () => void) => {
    if (settled.current || loading) return;
    settled.current = true;
    action();
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={() => settle(onCancel)}
      onShow={() => {
        AccessibilityInfo.announceForAccessibility(title);
      }}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel={`Fechar ${title}`}
        onPress={() => settle(onCancel)}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <Animated.View
          style={[
            styles.centered,
            {
              opacity: progress,
              transform: [
                {
                  translateY: reducedMotion
                    ? 0
                    : progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [motion.distance.small, 0],
                      }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="alert"
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.dialog,
              shadows.modal,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <View accessible focusable ref={titleRef}>
              <Text variant="sectionTitle">{title}</Text>
            </View>
            <Text color="textSecondary" variant="body">
              {description}
            </Text>
            <View style={styles.actions}>
              <Button
                disabled={loading}
                label={cancelLabel}
                onPress={() => settle(onCancel)}
                variant="ghost"
              />
              <Button
                haptic={destructive ? 'warning' : 'selection'}
                label={confirmLabel}
                loading={loading}
                onPress={() => settle(onConfirm)}
                variant={destructive ? 'danger' : 'primary'}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  centered: { width: '100%' },
  dialog: {
    borderRadius: radii.large,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
});
