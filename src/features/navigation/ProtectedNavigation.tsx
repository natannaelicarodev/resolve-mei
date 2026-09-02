import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import {
  Animated,
  type ColorValue,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Reanimated, {
  Easing as ReanimatedEasing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion';
import { Icon, IconButton, Text } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { sizes, spacing, typography, useTheme } from '@/theme';
type ProtectedDestination =
  'home' | 'agenda' | 'clients' | 'services' | 'quotes' | 'profile';

const CREATE_GLYPH_DURATION_MS = 220;

function CreateGlyph({ active = false }: { active?: boolean }) {
  const morph = useSharedValue(0);

  useEffect(() => {
    morph.value = withTiming(active ? 1 : 0, {
      duration: CREATE_GLYPH_DURATION_MS,
      easing: ReanimatedEasing.bezier(0.2, 0, 0, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [active, morph]);

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${interpolate(morph.value, [0, 1], [0, 45])}deg` }],
  }));
  const horizontalStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(morph.value, [0, 1], [1, 0.9]) }],
  }));
  const verticalStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(morph.value, [0, 1], [1, 0.9]) }],
  }));

  return (
    <Reanimated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.createGlyph, glyphStyle]}
    >
      <Reanimated.View
        style={[styles.createGlyphPlusHorizontal, horizontalStyle]}
      />
      <Reanimated.View
        style={[styles.createGlyphPlusVertical, verticalStyle]}
      />
    </Reanimated.View>
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
          <Icon name={icon} rawColor={color} size="large" />
        )}
      </View>
      {!emphasis ? (
        <Text
          numberOfLines={1}
          style={[
            styles.navigationLabel,
            { color },
            selected && styles.navigationLabelSelected,
          ]}
        >
          {label}
        </Text>
      ) : null}
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
          haptic="selection"
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
  onWarmComplete,
  visible,
  warming = false,
}: {
  accentColor?: string;
  blurTarget?: RefObject<View | null>;
  onClose: () => void;
  onWarmComplete?: () => void;
  visible: boolean;
  warming?: boolean;
}) {
  const { colors, resolvedTheme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [closing, setClosing] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const loadedWarmImages = useRef(new Set<number>());
  const warmCompletionTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
  const preparing = warming && !visible;

  const finishWarmup = useCallback(() => {
    if (warmCompletionTimer.current) return;
    // Keep the native menu tree alive for a few frames after the image
    // decoders finish before completing the silent warm-up.
    warmCompletionTimer.current = setTimeout(() => {
      warmCompletionTimer.current = null;
      onWarmComplete?.();
    }, 64);
  }, [onWarmComplete]);

  const markWarmImageLoaded = useCallback(
    (source: number) => {
      if (!warming) return;
      loadedWarmImages.current.add(source);
      if (loadedWarmImages.current.size === actions.length) finishWarmup();
    },
    [actions.length, finishWarmup, warming],
  );

  useEffect(() => {
    if (!warming) return;
    loadedWarmImages.current.clear();
    const fallback = setTimeout(finishWarmup, 1200);
    return () => {
      clearTimeout(fallback);
      if (warmCompletionTimer.current) {
        clearTimeout(warmCompletionTimer.current);
        warmCompletionTimer.current = null;
      }
    };
  }, [finishWarmup, warming]);

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
    setClosing(true);
    Animated.timing(progress, {
      duration: CREATE_GLYPH_DURATION_MS,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setClosing(false);
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
      visible={visible || warming}
    >
      <View
        accessibilityElementsHidden={preparing}
        importantForAccessibility={preparing ? 'no-hide-descendants' : 'auto'}
        pointerEvents={preparing ? 'none' : 'auto'}
        style={[styles.quickMenu, preparing && styles.quickMenuPreparing]}
      >
        {Platform.OS === 'android' ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.quickMenuAndroidBackdrop]}
          />
        ) : (
          <BlurView
            blurMethod="none"
            blurTarget={blurTarget}
            intensity={72}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            tint={resolvedTheme}
          />
        )}
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
                haptic="selection"
                onPress={() => choose(action.href)}
                style={[
                  styles.quickAction,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  onLoadEnd={() => markWarmImageLoaded(action.source)}
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
          <CreateGlyph active={visible && !closing} />
        </AnimatedPressable>
      </View>
    </Modal>
  );
}

export function ProtectedBottomNavigation({
  accentColor,
  accentSoftColor,
  backgroundColor,
  blurTarget,
  floating = false,
  selected,
  surfaceColor,
  warmQuickCreate = false,
}: {
  accentColor?: string;
  accentSoftColor?: string;
  backgroundColor?: ColorValue;
  blurTarget?: RefObject<View | null>;
  floating?: boolean;
  selected: ProtectedDestination;
  surfaceColor?: ColorValue;
  warmQuickCreate?: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [createOpen, setCreateOpen] = useState(false);
  const [quickCreatePrepared, setQuickCreatePrepared] = useState(false);
  const [quickCreateWarming, setQuickCreateWarming] = useState(false);
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

  useEffect(() => {
    if (!warmQuickCreate || quickCreatePrepared) return;
    if (typeof requestIdleCallback === 'function') {
      const idleCallback = requestIdleCallback(
        () => setQuickCreateWarming(true),
        { timeout: 1200 },
      );
      return () => cancelIdleCallback(idleCallback);
    }
    const fallback = setTimeout(() => setQuickCreateWarming(true), 0);
    return () => clearTimeout(fallback);
  }, [quickCreatePrepared, warmQuickCreate]);

  const finishQuickCreateWarmup = useCallback(() => {
    setQuickCreatePrepared(true);
    setQuickCreateWarming(false);
  }, []);

  return (
    <>
      <SafeAreaView
        accessibilityLabel="Navegação principal"
        edges={['bottom']}
        pointerEvents="box-none"
        style={[
          styles.bottomNavigationArea,
          floating ? styles.bottomNavigationFloating : null,
          {
            backgroundColor: floating
              ? 'transparent'
              : (backgroundColor ?? colors.background),
          },
        ]}
      >
        {floating ? (
          <LinearGradient
            colors={[
              'transparent',
              backgroundColor ?? colors.background,
              backgroundColor ?? colors.background,
            ]}
            locations={[0, 0.42, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={[styles.bottomNavigation, { width: barWidth }]}>
          <Svg
            height={84}
            pointerEvents="none"
            style={styles.navigationShape}
            viewBox={`0 0 ${barWidth} 84`}
            width={barWidth}
          >
            <Path d={barPath} fill={surfaceColor ?? colors.surface} />
          </Svg>
          <View style={styles.navigationItems}>
            <NavigationItem
              icon="home"
              label="Início"
              onPress={
                selected === 'home' ? undefined : () => router.navigate('/home')
              }
              selected={selected === 'home'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
            <NavigationItem
              icon="date"
              label="Agenda"
              onPress={
                selected === 'agenda'
                  ? undefined
                  : () => router.navigate('/agenda')
              }
              selected={selected === 'agenda'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
            <View style={styles.navigationSlot} />
            <NavigationItem
              icon="client"
              label="Clientes"
              onPress={
                selected === 'clients'
                  ? undefined
                  : () => router.navigate('/clients')
              }
              selected={selected === 'clients'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
            <NavigationItem
              icon="profile"
              label="Perfil"
              onPress={
                selected === 'profile'
                  ? undefined
                  : () => router.navigate('/profile')
              }
              selected={selected === 'profile'}
              selectedColor={accentColor}
              selectedSoftColor={accentSoftColor}
            />
          </View>
          <AnimatedPressable
            accessibilityLabel="Criar"
            accessibilityRole="button"
            haptic="selection"
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
        onWarmComplete={finishQuickCreateWarmup}
        visible={createOpen}
        warming={quickCreateWarming}
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
  const backRequested = useRef(false);
  const [backRequestId, setBackRequestId] = useState(0);

  useEffect(() => {
    if (!backRequested.current) return;
    // Consume the press before dispatching navigation. An unsaved-changes
    // guard may prevent that dispatch and rerender this header when its dialog
    // closes; keeping the flag set would dispatch the same back action again.
    backRequested.current = false;
    navigateBackOrFallback(
      backFallback,
      alwaysUseBackFallback,
      dismissToBackFallback,
    );
  }, [
    alwaysUseBackFallback,
    backFallback,
    backRequestId,
    dismissToBackFallback,
  ]);

  return (
    <View style={styles.pageHeader}>
      {back ? (
        <IconButton
          accessibilityLabel="Voltar"
          icon={<Icon color="textPrimary" name="back" size="large" />}
          onPress={() => {
            backRequested.current = true;
            setBackRequestId((current) => current + 1);
          }}
        />
      ) : null}
      <Text numberOfLines={1} style={styles.pageTitle} variant="sectionTitle">
        {title}
      </Text>
      {settings ? (
        <IconButton
          accessibilityLabel="Abrir configurações"
          icon={<Icon color="textPrimary" name="settings" size="large" />}
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
  bottomNavigationFloating: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
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
    gap: spacing.xs,
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
  navigationLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    maxWidth: '100%',
    textAlign: 'center',
  },
  navigationLabelSelected: { fontFamily: 'Poppins_600SemiBold' },
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
  quickMenuAndroidBackdrop: { backgroundColor: 'rgba(16, 24, 32, 0.52)' },
  quickMenuPreparing: { opacity: 0 },
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
    ...typography.label,
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
