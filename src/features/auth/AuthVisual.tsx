import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Animated, Image, StyleSheet, TextInput, View } from 'react-native';
import type { ScrollViewProps, TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
}: PropsWithChildren<{
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}>) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.authRoot}>
      <AuthBackdrop />
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

export function AuthHeading({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <FadeInView style={styles.heading}>
      <View style={styles.markGlow}>
        <Image
          accessibilityLabel="Logotipo do ResolveMEI"
          resizeMode="contain"
          source={require('../../../assets/resolve-mei-mark.png')}
          style={styles.mark}
        />
      </View>
      <Text align="center" style={styles.title} variant="pageTitle">
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
    <View>
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
        colors={[darkColors.primaryPressed, darkColors.primary]}
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

const styles = StyleSheet.create({
  authRoot: { backgroundColor: darkColors.background, flex: 1 },
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
  heading: { alignItems: 'center', gap: spacing.md },
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
    color: darkColors.textPrimary,
    fontSize: 31,
    lineHeight: 38,
    maxWidth: 320,
  },
  headingSubtitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  fieldGroup: {
    backgroundColor: lightColors.surface,
    borderRadius: radii.medium,
    overflow: 'hidden',
  },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  fieldDivider: {
    borderBottomColor: lightColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  primaryLabel: { color: darkColors.textOnPrimary },
});
