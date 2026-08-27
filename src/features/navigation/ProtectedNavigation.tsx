import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { IconButton, Text } from '@/components/ui';
import { getThemeShadows, radii, sizes, spacing, useTheme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type ProtectedDestination =
  'home' | 'clients' | 'services' | 'quotes' | 'profile';

export function navigateBackOrFallback(
  fallback: Href = '/home',
  alwaysUseFallback = false,
  dismissToFallback = false,
) {
  if (dismissToFallback) router.dismissTo(fallback);
  else if (!alwaysUseFallback && router.canGoBack()) router.back();
  else router.replace(fallback);
}

function NavigationItem({
  disabled = false,
  icon,
  label,
  selected = false,
  onPress,
}: {
  disabled?: boolean;
  icon: IconName;
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const color = selected
    ? colors.primary
    : disabled
      ? colors.disabledText
      : colors.textSecondary;
  const content: ReactNode = (
    <>
      <View
        style={[
          styles.navigationIcon,
          selected && { backgroundColor: colors.primaryMuted },
        ]}
      >
        <MaterialCommunityIcons color={color} name={icon} size={23} />
      </View>
      <Text
        color={
          selected ? 'primary' : disabled ? 'disabledText' : 'textSecondary'
        }
        numberOfLines={1}
        variant="navigation"
      >
        {label}
      </Text>
    </>
  );

  return (
    <View style={styles.navigationSlot}>
      {disabled ? (
        <View
          accessible
          accessibilityLabel={`${label}, indisponível`}
          accessibilityRole="tab"
          accessibilityState={{ disabled: true, selected }}
          style={styles.navigationItem}
        >
          {content}
        </View>
      ) : (
        <AnimatedPressable
          accessibilityLabel={label}
          accessibilityRole="tab"
          accessibilityState={{ disabled: false, selected }}
          disableScale
          onPress={onPress}
          style={styles.navigationItem}
        >
          {content}
        </AnimatedPressable>
      )}
    </View>
  );
}

export function ProtectedBottomNavigation({
  selected,
}: {
  selected: ProtectedDestination;
}) {
  const { colors, resolvedTheme } = useTheme();
  return (
    <View
      accessibilityLabel="Navegação principal"
      accessibilityRole="tablist"
      style={[
        styles.bottomNavigation,
        getThemeShadows(resolvedTheme).floating,
        {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      <NavigationItem
        icon="home-variant"
        label="Início"
        onPress={
          selected === 'home' ? undefined : () => router.replace('/home')
        }
        selected={selected === 'home'}
      />
      <NavigationItem
        icon="account-group-outline"
        label="Clientes"
        onPress={
          selected === 'clients' ? undefined : () => router.replace('/clients')
        }
        selected={selected === 'clients'}
      />
      <NavigationItem
        icon="briefcase-outline"
        label="Serviços"
        onPress={
          selected === 'services'
            ? undefined
            : () => router.replace('/services')
        }
        selected={selected === 'services'}
      />
      <NavigationItem
        icon="file-document-outline"
        label="Orçamentos"
        onPress={
          selected === 'quotes'
            ? undefined
            : () => router.replace('/quotes' as Href)
        }
        selected={selected === 'quotes'}
      />
      <NavigationItem
        icon="account-circle-outline"
        label="Perfil"
        onPress={
          selected === 'profile' ? undefined : () => router.replace('/profile')
        }
        selected={selected === 'profile'}
      />
    </View>
  );
}

export function ProtectedPageHeader({
  title,
  back = false,
  backFallback = '/home',
  alwaysUseBackFallback = false,
  dismissToBackFallback = false,
  settings = false,
}: {
  title: string;
  back?: boolean;
  backFallback?: Href;
  alwaysUseBackFallback?: boolean;
  dismissToBackFallback?: boolean;
  settings?: boolean;
}) {
  const { colors } = useTheme();
  const [backRequested, setBackRequested] = useState(false);

  useEffect(() => {
    if (!backRequested) return;
    navigateBackOrFallback(
      backFallback,
      alwaysUseBackFallback,
      dismissToBackFallback,
    );
  }, [
    alwaysUseBackFallback,
    backFallback,
    backRequested,
    dismissToBackFallback,
  ]);

  return (
    <View style={styles.pageHeader}>
      {back ? (
        <IconButton
          accessibilityLabel="Voltar"
          icon={
            <MaterialCommunityIcons
              color={colors.textPrimary}
              name="arrow-left"
              size={22}
            />
          }
          onPress={() => setBackRequested(true)}
        />
      ) : null}
      <Text numberOfLines={1} style={styles.pageTitle} variant="sectionTitle">
        {title}
      </Text>
      {settings ? (
        <IconButton
          accessibilityLabel="Abrir configurações"
          icon={
            <MaterialCommunityIcons
              color={colors.textPrimary}
              name="cog-outline"
              size={22}
            />
          }
          onPress={() => router.push('/settings')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: sizes.bottomNavigationHeight,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  navigationSlot: { flex: 1, minWidth: 0 },
  navigationItem: {
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    width: '100%',
  },
  navigationIcon: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 48,
  },
  pageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: sizes.touchTarget,
  },
  pageTitle: { flex: 1, minWidth: 0 },
});
