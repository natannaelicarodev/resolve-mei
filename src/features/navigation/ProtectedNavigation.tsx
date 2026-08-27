import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable, useReducedMotion } from '@/components/motion';
import { IconButton, Text } from '@/components/ui';
import {
  getThemeShadows,
  motion,
  radii,
  sizes,
  spacing,
  useTheme,
} from '@/theme';

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
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.value = reducedMotion
      ? withTiming(target, { duration: motion.duration.instant })
      : withSpring(target, motion.spring.gentle);
  }, [progress, reducedMotion, selected]);
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));
  const color = selected
    ? colors.primary
    : disabled
      ? colors.textDisabled
      : colors.textSecondary;
  const content: ReactNode = (
    <>
      <View style={styles.navigationIconWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.navigationPill,
            { backgroundColor: colors.primaryMuted },
            pillStyle,
          ]}
        />
        <MaterialCommunityIcons
          color={color}
          name={icon}
          size={sizes.iconLarge}
        />
      </View>
      <Text
        color={
          selected ? 'primary' : disabled ? 'textDisabled' : 'textSecondary'
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
  const insets = useSafeAreaInsets();
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
          paddingBottom: Math.max(insets.bottom, spacing.sm),
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
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  navigationSlot: { flex: 1, minWidth: 0 },
  navigationItem: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    width: '100%',
  },
  navigationIconWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 56,
  },
  navigationPill: {
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: sizes.touchTarget,
  },
  pageTitle: { flex: 1, minWidth: 0 },
});
