import { useEffect } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch as NativeSwitch,
  View,
  useWindowDimensions,
} from 'react-native';
import type { PressableProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable, useReducedMotion } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { motion, radii, sizes, spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { IconButton } from './IconButton';
import { Input } from './Input';
import type { InputProps } from './Input';
import { Skeleton } from './Skeleton';
import { Text } from './Text';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export function Divider() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      style={[styles.divider, { backgroundColor: colors.borderSubtle }]}
    />
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flexCopy}>
        <Text variant="sectionTitle">{title}</Text>
        {description ? (
          <Text color="textSecondary" variant="bodySmall">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export const AppHeader = SectionHeader;

export function CompactCreateButton({
  label,
  icon = 'add',
  onPress,
  accessibilityHint,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={styles.compactCreateTarget}
    >
      <View
        style={[
          styles.compactCreateVisual,
          { backgroundColor: colors.primary },
        ]}
      >
        <Icon name={icon} rawColor={colors.textInverse} size="small" />
        <Text color="textInverse" numberOfLines={1} variant="badge">
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function ListPageHeader({
  title,
  summary,
  action,
}: {
  title: string;
  summary: string;
  action: ReactNode;
}) {
  return (
    <View style={styles.listPageHeader}>
      <View style={styles.listPageTitleRow}>
        <Text style={styles.listPageTitle} variant="pageTitle">
          {title}
        </Text>
        <View style={styles.listPageAction}>{action}</View>
      </View>
      <Text color="textSecondary" variant="bodySmall">
        {summary}
      </Text>
    </View>
  );
}

export function FormSection({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <View accessibilityRole="summary" style={styles.section}>
      <View style={styles.copyGap}>
        <Text variant="cardTitle">{title}</Text>
        {description ? (
          <Text color="textSecondary" variant="bodySmall">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function ListContainer({ children }: PropsWithChildren) {
  return <Card style={styles.listContainer}>{children}</Card>;
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      {leading}
      <View style={styles.flexCopy}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle ? (
          <Text color="textSecondary" variant="bodySmall">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon color="textMuted" name="forward" size="medium" /> : null}
    </>
  );
  return onPress ? (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      haptic="selection"
      onPress={onPress}
      style={styles.listItem}
    >
      {content}
    </AnimatedPressable>
  ) : (
    <View style={styles.listItem}>{content}</View>
  );
}

export function MetricCard({
  label,
  value,
  supportingText,
  icon,
}: {
  label: string;
  value: string;
  supportingText?: string;
  icon?: ReactNode;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricTop}>
        {icon}
        <Text color="textSecondary" variant="label">
          {label}
        </Text>
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        variant="monetaryValue"
      >
        {value}
      </Text>
      {supportingText ? (
        <Text color="textMuted" variant="caption">
          {supportingText}
        </Text>
      ) : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon = 'archive',
  illustration,
  action,
}: {
  title: string;
  description: string;
  icon?: IconName;
  /** Replaces the tinted glyph with richer artwork, e.g. a `daylight` Illustration. */
  illustration?: ReactNode;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.state}>
      {illustration ?? (
        <View
          style={[styles.stateIcon, { backgroundColor: colors.primarySubtle }]}
        >
          <Icon name={icon} rawColor={colors.primary} size="large" />
        </View>
      )}
      <Text align="center" variant="cardTitle">
        {title}
      </Text>
      <Text align="center" color="textSecondary">
        {description}
      </Text>
      {action}
    </View>
  );
}

export function ErrorState({
  title = 'Algo deu errado',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon="alert"
      action={
        onRetry ? (
          <Button
            label="Tentar novamente"
            onPress={onRetry}
            variant="secondary"
          />
        ) : undefined
      }
    />
  );
}

export function SkeletonBlock({
  lines = 3,
  height = 72,
  label = 'Carregando',
}: {
  lines?: number;
  height?: number;
  label?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.skeletonBlock}
    >
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton height={height} key={index} />
      ))}
    </View>
  );
}

export function InlineLoading({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.inlineLoading}
    >
      <ActivityIndicator color={colors.primary} size="small" />
      <Text color="textSecondary" variant="bodySmall">
        {label}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: motion.duration.fast });
  }, [progress, reducedMotion, selected]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, colors.surfaceSelected],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.borderSubtle, colors.primary],
    ),
  }));

  // A marca acompanha a cor: aparecer seca no meio de uma transição suave lê
  // pior do que não animar nada.
  //
  // Ambos os estilos vão no `containerStyle`, que é o `Animated.View` do
  // próprio AnimatedPressable; o `style` interno vai para um Pressable comum,
  // que ignora estilo do Reanimated.
  const markStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    width: progress.value * sizes.iconSmall,
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      containerStyle={[styles.chipSurface, chipStyle]}
      haptic="selection"
      onPress={onPress}
      style={styles.chip}
    >
      {/* Sempre montado, para poder animar a saída; o estado já é anunciado
          por `accessibilityState`, então a marca é decorativa. */}
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.chipMark, markStyle]}
      >
        <Icon color="primary" name="success" size="small" />
      </Animated.View>
      <Text color={selected ? 'primary' : 'textSecondary'} variant="badge">
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function Switch({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flexCopy}>
        <Text variant="bodyMedium">{label}</Text>
        {description ? (
          <Text color="textSecondary" variant="bodySmall">
            {description}
          </Text>
        ) : null}
      </View>
      <NativeSwitch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.surface}
        value={value}
      />
    </View>
  );
}

export function SearchInput(
  props: Omit<InputProps, 'label'> & { label?: string },
) {
  return (
    <Input
      label={props.label ?? 'Buscar'}
      leading={<Icon color="textMuted" name="search" size="medium" />}
      returnKeyType="search"
      reserveMessageSpace={false}
      trailing={
        props.value ? (
          <IconButton
            accessibilityLabel="Limpar busca"
            icon={<Icon color="textSecondary" name="close" size="medium" />}
            onPress={() => props.onChangeText?.('')}
          />
        ) : undefined
      }
      {...props}
    />
  );
}

export function MoneyInput(props: InputProps) {
  return <Input inputMode="decimal" keyboardType="decimal-pad" {...props} />;
}
export function DateInput(props: InputProps) {
  return (
    <Input
      inputMode="numeric"
      keyboardType="number-pad"
      placeholder="DD/MM/AAAA"
      {...props}
    />
  );
}

export function FloatingAction({
  label,
  onPress,
  icon = 'add',
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.primary }]}
    >
      <Icon name={icon} rawColor={colors.textInverse} size="medium" />
      <Text color="textInverse" variant="button">
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function Select({
  label,
  value,
  placeholder = 'Selecionar',
  onPress,
  error,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.copyGap}>
      <Text variant="label">{label}</Text>
      <AnimatedPressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint="Abre as opções disponíveis"
        onPress={onPress}
        style={[
          styles.select,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.borderSubtle,
          },
        ]}
      >
        <Text color={value ? 'textPrimary' : 'textMuted'}>
          {value ?? placeholder}
        </Text>
        <Icon color="textSecondary" name="expand" size="medium" />
      </AnimatedPressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" color="danger" variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Dialog({
  visible,
  title,
  description,
  children,
  onClose,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}>) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.scrim, { backgroundColor: colors.overlay }]}
      >
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          onAccessibilityEscape={onClose}
          testID="dialog-surface"
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surfaceElevated,
              maxHeight: Math.max(280, height - spacing.xl * 2),
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.flexCopy}>
              <Text variant="sectionTitle">{title}</Text>
              {description ? (
                <Text color="textSecondary">{description}</Text>
              ) : null}
            </View>
            <IconButton
              accessibilityLabel="Fechar"
              icon={<Icon color="textPrimary" name="close" size="medium" />}
              onPress={onClose}
            />
          </View>
          <ScrollView
            contentContainerStyle={styles.dialogContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID="dialog-scroll"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { fontScale, width } = useWindowDimensions();
  const stackActions = width < 480 || fontScale > 1.15;

  return (
    <Dialog
      description={description}
      onClose={loading ? () => undefined : onCancel}
      title={title}
      visible={visible}
    >
      <View
        testID="dialog-actions"
        style={[
          styles.dialogActions,
          stackActions && styles.dialogActionsStacked,
        ]}
      >
        <Button
          disabled={loading}
          label={cancelLabel}
          onPress={onCancel}
          style={
            stackActions ? styles.dialogActionStacked : styles.dialogAction
          }
          variant="ghost"
        />
        <Button
          haptic={destructive ? 'warning' : 'selection'}
          label={confirmLabel}
          loading={loading}
          onPress={onConfirm}
          style={
            stackActions ? styles.dialogActionStacked : styles.dialogAction
          }
          variant={destructive ? 'danger' : 'primary'}
        />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  section: { gap: spacing.md },
  copyGap: { gap: spacing.xs },
  flexCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  listContainer: { gap: 0, overflow: 'hidden', padding: 0 },
  listPageHeader: { gap: spacing.xs },
  listPageTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  listPageTitle: { flex: 1, minWidth: 0 },
  listPageAction: { flexShrink: 0 },
  compactCreateTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
  },
  compactCreateVisual: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 38,
    paddingHorizontal: spacing.md,
  },
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricCard: { flex: 1, minWidth: 140, padding: sizes.cardPadding },
  metricTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  skeletonBlock: { gap: spacing.sm },
  inlineLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  stateIcon: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  // A superfície carrega borda e raio porque é ela que anima; o miolo cuida
  // só do arranjo do conteúdo.
  chipSurface: {
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  chipMark: { alignItems: 'center', overflow: 'hidden' },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
  },
  fab: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  select: {
    alignItems: 'center',
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.inputHeight,
    paddingHorizontal: spacing.md,
  },
  scrim: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialog: {
    borderRadius: radii.modal,
    maxWidth: 520,
    padding: spacing.lg,
    width: '100%',
  },
  dialogContent: { gap: spacing.lg, paddingTop: spacing.lg },
  dialogActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  dialogAction: { flexBasis: 160, flexGrow: 1 },
  dialogActionsStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  dialogActionStacked: { flexGrow: 0, width: '100%' },
});
