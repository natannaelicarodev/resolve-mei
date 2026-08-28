import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Text } from '@/components/ui';
import { darkColors, lightColors, radii, spacing } from '@/theme';
import { AuthScreen } from './AuthVisual';

export function WelcomeScreen() {
  return (
    <AuthScreen contentContainerStyle={styles.screen} headerVariant="large">
      <FadeInView style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title} variant="pageTitle">
            Bem-vindo ao ResolveMEI
          </Text>
          <Text style={styles.message}>
            Organize clientes, serviços e orçamentos em um só lugar. Mais
            clareza para você cuidar do que realmente importa: fazer seu negócio
            crescer.
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel="Continuar"
          accessibilityRole="button"
          onPress={() => router.replace('/home')}
          style={styles.continueButton}
        >
          <Text style={styles.continueLabel} variant="label">
            Continuar
          </Text>
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons
              color={darkColors.textOnPrimary}
              name="arrow-right"
              size={26}
            />
          </View>
        </AnimatedPressable>
      </FadeInView>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: 540,
  },
  content: { gap: spacing.xl, minHeight: 250 },
  copy: { gap: spacing.md },
  title: { color: lightColors.textPrimary, fontSize: 31, lineHeight: 38 },
  message: { color: lightColors.textSecondary, fontSize: 15, lineHeight: 23 },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  continueLabel: { color: lightColors.textSecondary },
  arrowCircle: {
    alignItems: 'center',
    backgroundColor: darkColors.primary,
    borderRadius: radii.circular,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});
