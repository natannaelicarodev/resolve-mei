import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { IconButton, Text } from '@/components/ui';
import { sizes, spacing, useTheme } from '@/theme';

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
    ? '#2DD4BF'
    : disabled
      ? colors.disabledText
      : colors.textSecondary;
  const content: ReactNode = (
    <>
      <View style={[styles.navMark, selected && styles.navMarkSelected]}>
        <MaterialCommunityIcons color={color} name={icon} size={18} />
      </View>
      <Text
        color={disabled ? 'disabledText' : 'textSecondary'}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.navigationLabel, selected && styles.selectedLabel]}
        variant="caption"
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
  return (
    <View
      accessibilityLabel="Navegação principal"
      accessibilityRole="tablist"
      style={[
        styles.bottomNavigation,
        { backgroundColor: '#191B20', borderTopColor: '#2C3037' },
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
    minHeight: 68,
    paddingHorizontal: spacing.xs,
    paddingBottom: 6,
    paddingTop: 7,
  },
  navigationSlot: { flex: 1, minWidth: 0 },
  navigationItem: {
    alignItems: 'center',
    gap: 3,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    width: '100%',
  },
  navMark: {
    alignItems: 'center',
    borderRadius: 6,
    height: 25,
    justifyContent: 'center',
    width: 38,
  },
  navMarkSelected: { backgroundColor: 'rgba(45, 212, 191, 0.14)' },
  navigationLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
    maxWidth: '100%',
  },
  selectedLabel: { color: '#2DD4BF' },
  pageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: sizes.touchTarget,
  },
  pageTitle: { flex: 1, minWidth: 0 },
});
