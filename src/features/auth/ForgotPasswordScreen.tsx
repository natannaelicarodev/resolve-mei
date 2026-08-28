import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { darkColors, radii, spacing, typography } from '@/theme';
import { requestPasswordReset } from './api';
import { forgotPasswordSchema } from './schemas';
import type { ForgotPasswordData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

export function ForgotPasswordScreen() {
  const [sentEmail, setSentEmail] = useState('');
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = async (data: ForgotPasswordData) => {
    try {
      await requestPasswordReset(data.email);
      setSentEmail(data.email.trim().toLowerCase());
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
          <View style={styles.header}>
            <AnimatedPressable
              accessibilityLabel="Voltar para entrar"
              accessibilityRole="button"
              onPress={() => router.replace('/sign-in')}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                color="#AEB3B8"
                name="chevron-left"
                size={28}
              />
            </AnimatedPressable>
            <Text style={styles.title}>Recuperar senha</Text>
          </View>

          {isSubmitSuccessful ? (
            <FadeInView style={styles.successContent}>
              <View style={styles.mailIcon}>
                <MaterialCommunityIcons
                  color="#31E39A"
                  name="email-outline"
                  size={34}
                />
              </View>
              <View style={styles.successCopy}>
                <Text style={styles.successTitle}>Verifique seu e-mail</Text>
                <Text style={styles.successMessage}>
                  Enviamos um link de redefinição para
                </Text>
                <Text style={styles.sentEmail}>{sentEmail}</Text>
              </View>
              <AnimatedPressable
                accessibilityLabel="Voltar para o login"
                accessibilityRole="button"
                containerStyle={styles.loginButtonContainer}
                onPress={() => router.replace('/sign-in')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonLabel}>Voltar para o login</Text>
              </AnimatedPressable>
            </FadeInView>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Informe seu e-mail e enviaremos um link para você criar uma nova
                senha.
              </Text>

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
                          returnKeyType="send"
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
                      <Text style={styles.errorTitle}>
                        Não foi possível enviar
                      </Text>
                      <Text style={styles.errorMessage}>
                        {errors.root.message}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <AnimatedPressable
                  accessibilityLabel="Enviar link"
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
                    {isSubmitting ? 'Enviando...' : 'Enviar link'}
                  </Text>
                </AnimatedPressable>
              </View>
            </>
          )}
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#14161A', flex: 1 },
  screen: { justifyContent: 'center', padding: spacing.xs },
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: {
    color: '#F2F2F0',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
  },
  subtitle: { color: '#BFC3C7', fontSize: 16, lineHeight: 23 },
  form: { gap: spacing.lg },
  fieldBlock: { gap: spacing.xs },
  label: {
    color: '#D4D6D9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  inputShell: {
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  inputShellError: { borderColor: darkColors.danger },
  input: {
    color: '#F2F2F0',
    minHeight: 54,
    paddingVertical: 0,
    ...typography.body,
  },
  fieldError: { color: darkColors.danger, fontSize: 12, lineHeight: 17 },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#301B1A',
    borderColor: '#69322E',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.sm,
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
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  successContent: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  mailIcon: {
    alignItems: 'center',
    backgroundColor: '#172821',
    borderColor: '#31E39A',
    borderRadius: 10,
    borderWidth: 2,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  successCopy: { alignItems: 'center', gap: spacing.xs },
  successTitle: {
    color: '#F2F2F0',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
    textAlign: 'center',
  },
  successMessage: {
    color: '#BFC3C7',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  sentEmail: {
    color: '#F2F2F0',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  loginButton: {
    alignItems: 'center',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 60,
    width: '100%',
  },
  loginButtonContainer: { marginTop: spacing.sm, width: '100%' },
  loginButtonLabel: {
    color: '#F2F2F0',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
});
