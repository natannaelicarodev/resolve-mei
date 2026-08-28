import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { ScrollViewProps, TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { darkColors, lightColors, radii, spacing, typography } from '@/theme';

const stars = [
  ['8%', '13%'],
  ['20%', '7%'],
  ['34%', '19%'],
  ['49%', '10%'],
  ['68%', '16%'],
  ['87%', '8%'],
  ['13%', '35%'],
  ['28%', '43%'],
  ['58%', '31%'],
  ['79%', '40%'],
  ['93%', '27%'],
  ['42%', '52%'],
  ['7%', '61%'],
  ['22%', '72%'],
  ['38%', '66%'],
  ['55%', '78%'],
  ['71%', '59%'],
  ['89%', '70%'],
  ['14%', '88%'],
  ['47%', '91%'],
  ['82%', '86%'],
] as const;

function BusinessCharacters() {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration: 2400,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          duration: 2400,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);

  const ownerY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const clientY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 2],
  });
  const quoteY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, -10],
  });

  return (
    <View style={styles.businessScene}>
      <View style={styles.sceneLine} />
      <Animated.View
        style={[
          styles.personCard,
          styles.ownerCard,
          { transform: [{ translateY: ownerY }] },
        ]}
      >
        <View style={[styles.personAvatar, styles.ownerAvatar]}>
          <MaterialCommunityIcons
            color={darkColors.textOnPrimary}
            name="account-tie-outline"
            size={26}
          />
        </View>
        <View>
          <Text style={styles.sceneLabel} variant="caption">
            Você
          </Text>
          <Text style={styles.sceneCaption} variant="caption">
            MEI
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[
          styles.personCard,
          styles.clientCard,
          { transform: [{ translateY: clientY }] },
        ]}
      >
        <View style={[styles.personAvatar, styles.clientAvatar]}>
          <MaterialCommunityIcons
            color={darkColors.success}
            name="account-outline"
            size={25}
          />
        </View>
        <View>
          <Text style={styles.sceneLabel} variant="caption">
            Cliente
          </Text>
          <Text style={styles.sceneCaption} variant="caption">
            Atendimento
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[styles.quoteBubble, { transform: [{ translateY: quoteY }] }]}
      >
        <MaterialCommunityIcons
          color={darkColors.accent}
          name="file-document-check-outline"
          size={22}
        />
        <Text style={styles.quoteText} variant="caption">
          Orçamento
        </Text>
      </Animated.View>
    </View>
  );
}

export function AuthBackdrop() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.backdrop}
    >
      <LinearGradient
        colors={[
          darkColors.primarySubtle,
          darkColors.background,
          darkColors.background,
        ]}
        end={{ x: 0.8, y: 0.72 }}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        style={styles.fill}
      />
      {[12, 25, 38, 51, 64, 77, 90].map((left) => (
        <View
          key={`v-${left}`}
          style={[styles.gridVertical, { left: `${left}%` }]}
        />
      ))}
      {[9, 20, 31, 42, 53, 64, 75, 86, 97].map((top) => (
        <View
          key={`h-${top}`}
          style={[styles.gridHorizontal, { top: `${top}%` }]}
        />
      ))}
      {stars.map(([left, top], index) => (
        <View
          key={`${left}-${top}`}
          style={[
            styles.star,
            { left, opacity: index % 3 === 0 ? 0.62 : 0.34, top },
          ]}
        />
      ))}
      <View style={styles.orbLarge} />
      <View style={styles.orbSmall} />
      <BusinessCharacters />
    </View>
  );
}

export function AuthScreen({
  children,
  contentContainerStyle,
  headerVariant = 'standard',
}: PropsWithChildren<{
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  headerVariant?: 'standard' | 'large';
}>) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.authRoot}>
      <View
        pointerEvents="none"
        style={[
          styles.authBodyBackground,
          { top: headerVariant === 'large' ? 450 : 215 },
        ]}
      />
      <OrganicHeader large={headerVariant === 'large'} />
      <Screen
        background="transparent"
        contentContainerStyle={contentContainerStyle}
        keyboardAvoiding
        safeAreaEdges={[]}
      >
        {children}
      </Screen>
    </SafeAreaView>
  );
}

function OrganicHeader({ large }: { large: boolean }) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 5],
  });
  const artworkScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.025, 1.045],
  });
  const height = large ? 570 : 350;
  const basePath =
    'M0 0H393V493C355 510 329 538 279 547C222 557 190 527 146 491C103 456 64 449 0 462Z';
  return (
    <View pointerEvents="none" style={[styles.organicHeader, { height }]}>
      <Animated.View
        style={[
          styles.organicArtwork,
          {
            transform: [
              { translateX },
              { translateY },
              { scale: artworkScale },
            ],
          },
        ]}
      >
        <Svg
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 393 550"
          width="100%"
        >
          <Path d={basePath} fill={lightColors.primary} />
        </Svg>
        <View style={styles.contours}>
          <Svg
            height={height + 40}
            preserveAspectRatio="none"
            viewBox="0 0 393 550"
            width="100%"
          >
            <Defs>
              <ClipPath id={large ? 'organic-large' : 'organic-standard'}>
                <Path d="M-20-20H413V471C355 488 329 516 279 525C222 535 190 505 146 469C103 434 64 427-20 440Z" />
              </ClipPath>
            </Defs>
            <G
              clipPath={`url(#${large ? 'organic-large' : 'organic-standard'})`}
            >
              <Path
                d="M-40 80C12 15 86 8 126 66C161 117 127 176 66 181C8 185-25 144-40 80Z"
                fill="none"
                stroke="rgba(255,255,255,0.23)"
                strokeWidth="2"
              />
              <Path
                d="M-12 91C23 45 73 39 99 77C123 112 99 150 58 153C18 156-3 128-12 91Z"
                fill="none"
                stroke="rgba(255,255,255,0.23)"
                strokeWidth="2"
              />
              <Path
                d="M16 100C39 70 70 67 87 91C102 114 87 139 59 141C33 143 21 124 16 100Z"
                fill="none"
                stroke="rgba(255,255,255,0.23)"
                strokeWidth="2"
              />
              <Path
                d="M145-20C226-45 317-6 324 73C331 148 271 199 201 168C131 137 94 63 145-20Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M174 9C229-10 291 16 295 70C299 120 259 154 211 133C163 112 139 65 174 9Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M197 30C234 17 276 35 279 71C282 105 255 128 223 114C190 100 174 68 197 30Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M214 49C236 42 260 52 262 73C264 92 248 105 229 97C210 89 200 70 214 49Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M326-22C377-18 418 22 416 75C414 127 373 159 330 139C287 119 283 69 300 25C307 7 316-9 326-22Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M341 7C375 5 401 32 400 69C399 104 372 124 344 111C316 98 314 65 326 35C330 23 336 13 341 7Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M352 32C372 31 387 47 386 68C385 89 370 101 353 93C336 85 335 66 342 48C345 41 349 35 352 32Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M-32 229C48 168 103 172 166 218C225 261 274 237 329 197C377 163 424 184 438 243C455 315 379 348 314 324C244 299 205 311 145 341C75 375 7 341-32 287Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M13 244C68 204 105 205 150 238C196 272 245 262 289 231C329 202 369 213 382 256C395 301 347 320 302 303C239 280 197 290 143 315C87 341 36 315 13 281Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M53 254C87 229 112 229 142 251C181 280 229 277 273 247C303 226 335 232 344 262C353 292 322 303 291 291C239 272 196 281 146 302C102 321 68 300 53 276Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M89 261C110 246 126 246 145 260C176 283 218 284 257 259C275 247 294 251 300 269C305 287 286 293 267 286C226 272 191 280 151 294C121 304 99 290 89 276Z"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
              <Path
                d="M58 416C116 353 208 349 266 409C320 464 292 537 225 550C156 563 84 526 58 416Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <Path
                d="M101 429C139 389 199 387 237 425C272 461 254 507 210 515C165 524 118 499 101 429Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <Path
                d="M302 351C348 318 409 337 426 389C443 440 405 482 358 465C312 449 276 391 302 351Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <Path
                d="M329 370C358 350 395 362 405 394C415 425 392 450 363 440C334 430 313 394 329 370Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <Path
                d="M347 385C363 374 383 381 388 398C394 415 381 428 366 423C350 417 339 398 347 385Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
            </G>
          </Svg>
        </View>
      </Animated.View>
      <View style={styles.headerMark}>
        <Image
          accessibilityLabel="Logotipo do ResolveMEI"
          resizeMode="contain"
          source={require('../../../assets/resolve-mei-mark.png')}
          style={styles.headerMarkImage}
        />
      </View>
    </View>
  );
}

export function AuthHeading({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <FadeInView style={styles.heading}>
      <Text style={styles.title} variant="pageTitle">
        {title}
      </Text>
      <View style={styles.headingSubtitle}>{children}</View>
    </FadeInView>
  );
}

export function AuthFieldGroup({ children }: PropsWithChildren) {
  return <View style={styles.fieldGroup}>{children}</View>;
}

export function AuthField({
  icon,
  label,
  last = false,
  rightAccessory,
  ...props
}: TextInputProps & {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  last?: boolean;
  rightAccessory?: ReactNode;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel} variant="label">
        {label}
      </Text>
      <View style={[styles.fieldRow, !last && styles.fieldDivider]}>
        <MaterialCommunityIcons
          color={lightColors.primary}
          name={icon}
          size={21}
        />
        <TextInput
          accessibilityLabel={label}
          placeholder={label}
          placeholderTextColor={lightColors.textMuted}
          style={styles.fieldInput}
          {...props}
        />
        {rightAccessory}
      </View>
    </View>
  );
}

export function PasswordEye({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.eye}
    >
      <MaterialCommunityIcons
        color={lightColors.textMuted}
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={22}
      />
    </AnimatedPressable>
  );
}

export function AuthPrimaryButton({
  label,
  loading = false,
  onPress,
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={styles.primaryButton}
    >
      <LinearGradient
        colors={[lightColors.primaryPressed, lightColors.primary]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.primaryGradient}
      >
        <Text style={styles.primaryLabel} variant="label">
          {loading ? 'Aguarde...' : label}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function AuthErrorFeedback({
  message,
  title = 'Não foi possível entrar',
}: {
  message: string;
  title?: string;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={styles.authError}
    >
      <View style={styles.authErrorIcon}>
        <MaterialCommunityIcons
          color={lightColors.danger}
          name="alert-circle-outline"
          size={20}
        />
      </View>
      <View style={styles.authErrorCopy}>
        <Text style={styles.authErrorTitle} variant="label">
          {title}
        </Text>
        <Text style={styles.authErrorMessage} variant="caption">
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  authRoot: { backgroundColor: lightColors.primary, flex: 1 },
  authBodyBackground: {
    backgroundColor: lightColors.surface,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  organicHeader: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  organicArtwork: {
    bottom: -10,
    left: -8,
    position: 'absolute',
    right: -8,
    top: -10,
  },
  contours: {
    bottom: -20,
    left: -16,
    position: 'absolute',
    right: -16,
    top: -20,
  },
  headerMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.medium,
    height: 48,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -24,
    position: 'absolute',
    top: 70,
    width: 48,
  },
  headerMarkImage: { height: 32, width: 32 },
  backdrop: {
    backgroundColor: darkColors.background,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  gridVertical: {
    backgroundColor: 'rgba(169,156,245,0.14)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  gridHorizontal: {
    backgroundColor: 'rgba(169,156,245,0.14)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  star: {
    backgroundColor: darkColors.textPrimary,
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    width: 3,
  },
  orbLarge: {
    backgroundColor: 'rgba(169,156,245,0.13)',
    borderRadius: 120,
    height: 240,
    position: 'absolute',
    right: -110,
    top: -70,
    width: 240,
  },
  orbSmall: {
    backgroundColor: 'rgba(95,206,155,0.10)',
    borderRadius: 90,
    bottom: 20,
    height: 180,
    left: -90,
    position: 'absolute',
    width: 180,
  },
  businessScene: {
    bottom: 36,
    height: 126,
    left: 20,
    opacity: 0.9,
    position: 'absolute',
    right: 20,
  },
  sceneLine: {
    backgroundColor: 'rgba(169,156,245,0.26)',
    height: 1,
    left: 54,
    position: 'absolute',
    right: 54,
    top: 62,
  },
  personCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(30,24,41,0.92)',
    borderColor: darkColors.border,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    position: 'absolute',
  },
  ownerCard: { left: 0, top: 14 },
  clientCard: { bottom: 2, right: 0 },
  personAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  ownerAvatar: { backgroundColor: darkColors.primary },
  clientAvatar: { backgroundColor: darkColors.successSubtle },
  sceneLabel: {
    color: darkColors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  sceneCaption: { color: darkColors.textMuted, fontSize: 8, lineHeight: 11 },
  quoteBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: darkColors.accentSubtle,
    borderRadius: radii.medium,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    top: 33,
  },
  quoteText: {
    color: darkColors.accent,
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 11,
  },
  heading: { alignItems: 'flex-start', gap: spacing.sm },
  markGlow: {
    alignItems: 'center',
    backgroundColor: darkColors.primarySubtle,
    borderRadius: radii.medium,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  mark: { height: 36, width: 36 },
  title: {
    color: lightColors.textPrimary,
    fontSize: 31,
    lineHeight: 38,
    maxWidth: 320,
  },
  headingSubtitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-start',
  },
  fieldGroup: {
    gap: spacing.md,
  },
  fieldBlock: { gap: spacing.xs },
  fieldLabel: { color: lightColors.textPrimary, fontSize: 13, lineHeight: 18 },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomColor: lightColors.borderStrong,
    borderBottomWidth: 1,
    minHeight: 46,
    paddingHorizontal: 0,
  },
  fieldDivider: {
    borderBottomColor: darkColors.primary,
  },
  fieldInput: {
    color: lightColors.textPrimary,
    flex: 1,
    minHeight: 56,
    paddingVertical: 0,
    ...typography.body,
  },
  eye: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: -8,
    width: 44,
  },
  primaryButton: {
    borderRadius: radii.medium,
    overflow: 'hidden',
    width: '100%',
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  primaryLabel: { color: lightColors.textOnPrimary },
  authError: {
    alignItems: 'center',
    backgroundColor: lightColors.dangerSubtle,
    borderColor: 'rgba(180,35,24,0.18)',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authErrorIcon: {
    alignItems: 'center',
    backgroundColor: lightColors.surface,
    borderRadius: radii.circular,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  authErrorCopy: { flex: 1, gap: 2 },
  authErrorTitle: { color: lightColors.danger },
  authErrorMessage: { color: lightColors.textSecondary },
});
