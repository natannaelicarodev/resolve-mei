import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Modal, StyleSheet, Switch as NativeSwitch, View } from 'react-native';
import type { PressableProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { radii, sizes, spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { IconButton } from './IconButton';
import { Input } from './Input';
import type { InputProps } from './Input';
import { Text } from './Text';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

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
  icon = 'plus',
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
        <MaterialCommunityIcons
          color={colors.textInverse}
          name={icon}
          size={17}
        />
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
  const { colors } = useTheme();
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
      {onPress ? (
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={sizes.iconMedium}
        />
      ) : null}
    </>
  );
  return onPress ? (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
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
  icon = 'inbox-outline',
  action,
}: {
  title: string;
  description: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.state}>
      <View
        style={[styles.stateIcon, { backgroundColor: colors.primarySubtle }]}
      >
        <MaterialCommunityIcons color={colors.primary} name={icon} size={28} />
      </View>
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
      icon="alert-circle-outline"
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
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.surfaceSelected : colors.surface,
          borderColor: selected ? colors.primary : colors.borderSubtle,
        },
      ]}
    >
      {selected ? (
        <MaterialCommunityIcons color={colors.primary} name="check" size={16} />
      ) : null}
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
  const { colors } = useTheme();
  return (
    <Input
      label={props.label ?? 'Buscar'}
      leading={
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="magnify"
          size={20}
        />
      }
      returnKeyType="search"
      reserveMessageSpace={false}
      trailing={
        props.value ? (
          <IconButton
            accessibilityLabel="Limpar busca"
            icon={
              <MaterialCommunityIcons
                color={colors.textSecondary}
                name="close"
                size={20}
              />
            }
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
  icon = 'plus',
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
      <MaterialCommunityIcons
        color={colors.textInverse}
        name={icon}
        size={24}
      />
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
        <MaterialCommunityIcons
          color={colors.textSecondary}
          name="chevron-down"
          size={20}
        />
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
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.scrim, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityRole="alert"
          style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}
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
              icon={
                <MaterialCommunityIcons
                  color={colors.textPrimary}
                  name="close"
                  size={22}
                />
              }
              onPress={onClose}
            />
          </View>
          {children}
        </View>
      </View>
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
  return (
    <Dialog
      description={description}
      onClose={loading ? () => undefined : onCancel}
      title={title}
      visible={visible}
    >
      <View style={styles.dialogActions}>
        <Button
          disabled={loading}
          label={cancelLabel}
          onPress={onCancel}
          variant="ghost"
        />
        <Button
          haptic={destructive ? 'warning' : 'selection'}
          label={confirmLabel}
          loading={loading}
          onPress={onConfirm}
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
  chip: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
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
    gap: spacing.lg,
    maxWidth: 520,
    padding: spacing.lg,
    width: '100%',
  },
  dialogActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
