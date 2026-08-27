import { useEffect, useMemo, useRef } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type {
  BottomSheetBackdropProps,
  BottomSheetModal as BottomSheetModalRef,
} from '@gorhom/bottom-sheet';

import { useReducedMotion } from '@/components/motion';
import { spacing, useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}>;

/**
 * Bottom sheet real com gesto de arrastar e snap point único ajustado ao
 * conteúdo, construído sobre @gorhom/bottom-sheet — substitui o antigo
 * `BottomSheet = Dialog` (um modal central sem física de gesto nenhuma).
 */
export function BottomSheet({
  visible,
  title,
  description,
  onClose,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const ref = useRef<BottomSheetModalRef>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const animationConfigs = useMemo(
    () => ({ duration: reducedMotion ? 1 : 260 }),
    [reducedMotion],
  );

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.6}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetModal
      accessibilityLabel={title}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      enableDynamicSizing
      handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
      onDismiss={onClose}
      ref={ref}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
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
        {children as ReactNode}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl, padding: spacing.lg },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
});
