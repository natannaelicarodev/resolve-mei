import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { darkColors, radii, spacing, typography } from '@/theme';
import { signIn } from './api';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

export function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = async (data: SignInData) => {
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      setError('root', { message: normalizeError(error).message });
    }
  };

  return (
    <View style={styles.root}>
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.screen}
        keyboardAvoiding
      >
        <FadeInView style={styles.card}>
          <View style={styles.heading}>
            <Text style={styles.title}>Bem vindo de volta!</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.subtitle}
          >
            Entre para continuar organizando seu negócio.
          </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>E-mail</Text>
                  <View
                    style={[
                      styles.inputShell,
                      errors.email?.message && styles.inputShellError,
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="E-mail"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder="seuemail@exemplo.com"
                      placeholderTextColor="#858A90"
                      returnKeyType="next"
                      selectionColor="#2DD4BF"
                      style={styles.input}
                      value={field.value}
                    />
                  </View>
                  {errors.email?.message ? (
                    <Text style={styles.fieldError}>
                      {errors.email.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Senha</Text>
                  <View
                    style={[
                      styles.inputShell,
                      errors.password?.message && styles.inputShellError,
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="Senha"
                      autoComplete="current-password"
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder="Sua senha"
                      placeholderTextColor="#858A90"
                      returnKeyType="done"
                      secureTextEntry={!showPassword}
                      selectionColor="#2DD4BF"
                      style={styles.input}
                      value={field.value}
                    />
                    <AnimatedPressable
                      accessibilityLabel={
                        showPassword ? 'Ocultar senha' : 'Mostrar senha'
                      }
                      accessibilityRole="button"
                      hitSlop={4}
                      onPress={() => setShowPassword((current) => !current)}
                      style={styles.eyeButton}
                    >
                      <MaterialCommunityIcons
                        color="#858A90"
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                      />
                    </AnimatedPressable>
                  </View>
                  {errors.password?.message ? (
                    <Text style={styles.fieldError}>
                      {errors.password.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Link
              accessibilityRole="link"
              href="/forgot-password"
              style={styles.forgot}
            >
              Esqueci minha senha
            </Link>

            {errors.root?.message ? (
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.errorBox}
              >
                <MaterialCommunityIcons
                  color={darkColors.danger}
                  name="alert-circle-outline"
                  size={20}
                />
                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>Não foi possível entrar</Text>
                  <Text style={styles.errorMessage}>{errors.root.message}</Text>
                </View>
              </View>
            ) : null}

            <AnimatedPressable
              accessibilityLabel="Entrar"
              accessibilityRole="button"
              accessibilityState={{
                busy: isSubmitting,
                disabled: isSubmitting,
              }}
              disabled={isSubmitting}
              onPress={() => void handleSubmit(submit)()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryLabel}>
                {isSubmitting ? 'Aguarde...' : 'Entrar'}
              </Text>
            </AnimatedPressable>
          </View>

          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>Não tem conta?</Text>
            <Link href="/sign-up" style={styles.signUpLink}>
              Criar conta
            </Link>
          </View>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#14161A', flex: 1 },
  screen: {
    justifyContent: 'center',
    padding: spacing.sm,
  },
  card: {
    backgroundColor: '#14161A',
    borderColor: '#20242A',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  heading: { gap: spacing.xs },
  title: {
    color: '#F2F2F0',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: { color: '#B2B5BA', fontSize: 14, lineHeight: 22 },
  form: { gap: spacing.md },
  fieldBlock: { gap: spacing.xs },
  label: {
    color: '#D4D6D9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    overflow: 'hidden',
    paddingLeft: spacing.md,
  },
  inputShellError: { borderColor: darkColors.danger },
  input: {
    color: '#F2F2F0',
    flex: 1,
    minHeight: 54,
    paddingRight: spacing.md,
    paddingVertical: 0,
    ...typography.body,
  },
  eyeButton: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  fieldError: {
    color: darkColors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  forgot: {
    alignSelf: 'flex-start',
    color: '#2DD4BF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    paddingVertical: spacing.xs,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#301B1A',
    borderColor: '#69322E',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorCopy: { flex: 1, gap: 2 },
  errorTitle: {
    color: darkColors.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  errorMessage: { color: '#E0B7B3', fontSize: 12, lineHeight: 17 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 60,
  },
  primaryLabel: {
    color: '#101416',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  signUpRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  signUpPrompt: { color: '#868B91', fontSize: 15, lineHeight: 22 },
  signUpLink: {
    color: '#2DD4BF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
});
