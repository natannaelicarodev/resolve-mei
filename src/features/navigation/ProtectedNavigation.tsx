import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode, RefObject } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion';
import { IconButton, Text } from '@/components/ui';
import { sizes, spacing, useTheme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type ProtectedDestination =
  'home' | 'clients' | 'services' | 'quotes' | 'profile';

function CreateGlyph() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.createGlyph}
    >
      <View style={styles.createGlyphPlusHorizontal} />
      <View style={styles.createGlyphPlusVertical} />
    </View>
  );
}

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
  emphasis = false,
  icon,
  label,
  role = 'tab',
  selected = false,
  selectedColor,
  selectedSoftColor,
  onPress,
}: {
  disabled?: boolean;
  emphasis?: boolean;
  icon: IconName;
  label: string;
  role?: 'button' | 'tab';
  selected?: boolean;
  selectedColor?: string;
  selectedSoftColor?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  // The selected tint follows the theme's own primary rather than a literal, so
  // the bar belongs to whichever theme is active instead of staying dark-only.
  const color = selected
    ? (selectedColor ?? colors.primary)
    : emphasis
      ? colors.textInverse
      : disabled
        ? colors.textDisabled
        : colors.textSecondary;
  const content: ReactNode = (
    <>
      <View
        style={[
          styles.navMark,
          emphasis && {
            backgroundColor: selectedColor ?? colors.primary,
            borderRadius: 31,
            boxShadow: `0 8px 18px ${selectedSoftColor ?? colors.primarySubtle}`,
            elevation: 8,
            height: 62,
            width: 62,
          },
        ]}
      >
        {emphasis ? (
          <CreateGlyph />
        ) : (
          <MaterialCommunityIcons color={color} name={icon} size={22} />
        )}
      </View>
    </>
  );

  return (
    <View
      style={[styles.navigationSlot, emphasis && styles.createNavigationSlot]}
    >
      {disabled ? (
        <View
          accessible
          accessibilityLabel={`${label}, indisponível`}
          accessibilityRole={role}
          accessibilityState={{ disabled: true, selected }}
          style={[
            styles.navigationItem,
            emphasis && styles.createNavigationItem,
          ]}
        >
          {content}
        </View>
      ) : (
        <AnimatedPressable
          accessibilityLabel={label}
          accessibilityRole={role}
          accessibilityState={{ disabled: false, selected }}
          disableScale
          onPress={onPress}
          style={[
            styles.navigationItem,
            emphasis && styles.createNavigationItem,
          ]}
        >
          {content}
        </AnimatedPressable>
      )}
    </View>
  );
}

function QuickCreateMenu({
  accentColor,
  blurTarget,
  onClose,
  visible,
}: {
  accentColor?: string;
  blurTarget?: RefObject<View | null>;
  onClose: () => void;
  visible: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const primary = accentColor ?? colors.primary;
  const actionWidth = Math.min(156, (width - 32) / 2);
  const center = width / 2;
  const sideOffset = (width - actionWidth - 20) / 2;
  const buttonBottom = insets.bottom + 43;
  const actions: {
    href: Href;
    imageScale: number;
    label: string;
    offsetX: number;
    offsetY: number;
    source: number;
  }[] = [
    {
      href: '/clients/new',
      imageScale: 0.94,
      label: 'Novo cliente',
      offsetX: -sideOffset,
      offsetY: 108,
      source: require('../../../assets/illustrations/quick-create-client-anil.png'),
    },
    {
      href: '/quotes/new',
      imageScale: 1.1,
      label: 'Novo orçamento',
      offsetX: 0,
      offsetY: 174,
      source: require('../../../assets/illustrations/quick-create-quote-3d-v2.png'),
    },
    {
      href: '/services/new',
      imageScale: 1.1,
      label: 'Novo serviço',
      offsetX: sideOffset,
      offsetY: 108,
      source: require('../../../assets/illustrations/quick-create-service-anil.png'),
    },
  ];

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.spring(progress, {
      damping: 17,
      mass: 0.75,
      stiffness: 190,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  const dismiss = (afterClose?: () => void) => {
    Animated.timing(progress, {
      duration: 150,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      afterClose?.();
    });
  };

  const choose = (href: Href) =>
    dismiss(() => requestAnimationFrame(() => router.push(href)));

  return (
    <Modal
      animationType="none"
      onRequestClose={() => dismiss()}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.quickMenu}>
        <BlurView
          blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'}
          blurTarget={blurTarget}
          intensity={72}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          tint="light"
        />
        <Pressable
          accessibilityLabel="Fechar menu de criação"
          accessibilityRole="button"
          onPress={() => dismiss()}
          style={styles.quickMenuBackdrop}
        />

        {actions.map((action) => {
          const finalLeft = center + action.offsetX - actionWidth / 2;
          return (
            <Animated.View
              key={action.label}
              style={[
                styles.quickActionPosition,
                {
                  bottom: buttonBottom + action.offsetY,
                  left: finalLeft,
                  opacity: progress,
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-action.offsetX, 0],
                      }),
                    },
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [action.offsetY, 0],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.45, 1],
                      }),
                    },
                  ],
                  width: actionWidth,
                },
              ]}
            >
              <AnimatedPressable
                accessibilityLabel={action.label}
                accessibilityRole="button"
                onPress={() => choose(action.href)}
                style={[
                  styles.quickAction,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={action.source}
                  style={[
                    styles.quickActionImage,
                    { transform: [{ scale: action.imageScale }] },
                  ]}
                />
                <Text numberOfLines={2} style={styles.quickActionLabel}>
                  {action.label}
                </Text>
              </AnimatedPressable>
            </Animated.View>
          );
        })}

        <AnimatedPressable
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          containerStyle={[
            styles.quickCloseContainer,
            { bottom: buttonBottom, left: center - 31 },
          ]}
          onPress={() => dismiss()}
          style={[styles.quickCloseButton, { backgroundColor: primary }]}
        >
          <MaterialCommunityIcons
            color={colors.textInverse}
            name="close"
            size={30}
          />
        </AnimatedPressable>
      </View>
    </Modal>
  );
}

export function ProtectedBottomNavigation({
  accentColor,
  accentSoftColor,
  blurTarget,
  selected,
}: {
  accentColor?: string;
  accentSoftColor?: string;
  blurTarget?: RefObject<View | null>;
  selected: ProtectedDestination;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [createOpen, setCreateOpen] = useState(false);
  const barWidth = Math.max(280, width - 24);
  const center = barWidth / 2;
  const barPath = [
    'M 24 14',
    `H ${center - 58}`,
    `C ${center - 40} 14 ${center - 40} 50 ${center} 50`,
    `C ${center + 40} 50 ${center + 40} 14 ${center + 58} 14`,
    `H ${barWidth - 24}`,
    `Q ${barWidth} 14 ${barWidth} 38`,
    `V 76 Q ${barWidth} 84 ${barWidth - 16} 84`,
    'H 16 Q 0 84 0 76 V 38 Q 0 14 24 14 Z',
  ].join(' ');
  return (
    <>
      <SafeAreaView
        accessibilityLabel="Navegação principal"
        edges={['bottom']}
        pointerEvents="box-none"
        style={[
          styles.bottomNavigationArea,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.bottomNavigation, { width: barWidth }]}>
          <Svg
            height={84}
            pointerEvents="none"
            style={styles.navigationShape}
            viewBox={`0 0 ${barWidth} 84`}
            width={barWidth}
          >
            <Path d={barPath} fill={colors.surface} />
          </Svg>
          <View style={styles.navigationItems}>
            <NavigationItem
              icon="home-variant-outline"
              label="Início"
              onPress={
                selected === 'home' ? undefined : () => router.replace('/home')
              }
              selected={selected === 'home'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
            <View style={styles.navigationSlot} />
            <NavigationItem
              icon="account-circle-outline"
              label="Perfil"
              onPress={
                selected === 'profile'
                  ? undefined
                  : () => router.replace('/profile')
              }
              selected={selected === 'profile'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
          </View>
          <AnimatedPressable
            accessibilityLabel="Criar"
            accessibilityRole="button"
            containerStyle={[
              styles.centralActionContainer,
              { left: center - 31 },
            ]}
            onPress={() => setCreateOpen(true)}
            style={[
              styles.centralActionButton,
              {
                backgroundColor: accentColor ?? colors.primary,
                boxShadow: `0 9px 20px ${accentSoftColor ?? colors.primarySubtle}`,
              },
            ]}
          >
            <CreateGlyph />
          </AnimatedPressable>
        </View>
      </SafeAreaView>
      <QuickCreateMenu
        accentColor={accentColor}
        blurTarget={blurTarget}
        onClose={() => setCreateOpen(false)}
        visible={createOpen}
      />
    </>
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
  bottomNavigationArea: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
    paddingTop: 22,
  },
  bottomNavigation: {
    height: 84,
    position: 'relative',
  },
  navigationShape: { left: 0, position: 'absolute', top: 0 },
  navigationItems: {
    flexDirection: 'row',
    height: 84,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  centralActionContainer: {
    height: 62,
    position: 'absolute',
    top: -17,
    width: 62,
    zIndex: 3,
  },
  centralActionButton: {
    alignItems: 'center',
    borderRadius: 31,
    elevation: 9,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  navigationSlot: { flex: 1, minWidth: 0 },
  createNavigationSlot: { zIndex: 2 },
  navigationItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 84,
    paddingTop: 14,
    width: '100%',
  },
  createNavigationItem: {
    minHeight: 78,
    paddingTop: 0,
    transform: [{ translateY: -22 }],
  },
  navMark: {
    alignItems: 'center',
    borderRadius: 11,
    height: 30,
    justifyContent: 'center',
    width: 42,
  },
  createGlyph: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  createGlyphPlusHorizontal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    width: 24,
  },
  createGlyphPlusVertical: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    height: 24,
    position: 'absolute',
    width: 3,
  },
  quickMenu: { flex: 1 },
  quickMenuBackdrop: {
    backgroundColor: 'rgba(24, 28, 48, 0.16)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  quickActionPosition: { position: 'absolute' },
  quickAction: {
    alignItems: 'center',
    borderRadius: 28,
    boxShadow: '0 6px 18px rgba(24, 28, 48, 0.14)',
    elevation: 6,
    flexDirection: 'row',
    gap: 6,
    height: 58,
    paddingHorizontal: 7,
    paddingRight: 10,
    width: '100%',
  },
  quickActionImage: { height: 46, width: 46 },
  quickActionLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    lineHeight: 16,
    minWidth: 0,
  },
  quickCloseContainer: {
    height: 62,
    position: 'absolute',
    width: 62,
  },
  quickCloseButton: {
    alignItems: 'center',
    borderRadius: 31,
    boxShadow: '0 9px 20px rgba(64, 84, 214, 0.28)',
    elevation: 9,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  pageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: sizes.touchTarget,
  },
  pageTitle: { flex: 1, minWidth: 0 },
});
