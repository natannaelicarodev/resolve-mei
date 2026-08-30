import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { requestPasswordReset } from './api';
import { forgotPasswordSchema } from './schemas';
import type { ForgotPasswordData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  border: 'rgba(255,255,255,0.07)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
  danger: '#FF6B6B',
  dangerSoft: '#240D0F',
} as const;

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
      void triggerHaptic('success');
    } catch (error) {
      void triggerHaptic('error');
      setError('root', { message: normalizeError(error).message });
    }
  };

  if (isSubmitSuccessful) {
    return <RecoverySentState email={sentEmail} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.screen}
        scroll={false}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={20} distance={8} style={styles.topBar}>
          <AnimatedPressable
            accessibilityLabel="Voltar para entrar"
            accessibilityRole="button"
            onPress={() => router.replace('/sign-in')}
            style={styles.backButton}
          >
            <ArrowLeft color={palette.text} size={20} strokeWidth={1.8} />
          </AnimatedPressable>
          <Text style={styles.topLabel}>RECUPERAR ACESSO</Text>
        </FadeInView>

        <FadeInView delay={60} distance={10} style={styles.heading}>
          <Text style={styles.title}>Vamos recuperar sua conta.</Text>
          <Text style={styles.subtitle}>
            Informe o e-mail usado no cadastro. Enviaremos as instruções para
            criar uma nova senha.
          </Text>
        </FadeInView>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <RecoveryEmailField
                error={errors.email?.message}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                onSubmit={() => void handleSubmit(submit)()}
                value={field.value}
              />
            )}
          />

          <View style={styles.securityNote}>
            <View style={styles.securityIcon}>
              <ShieldCheck
                color={palette.primary}
                size={17}
                strokeWidth={1.8}
              />
            </View>
            <Text style={styles.securityText}>
              O link é individual e expira automaticamente por segurança.
            </Text>
          </View>

          {errors.root?.message ? (
            <View
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.errorBox}
            >
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>
                  Não conseguimos enviar o link
                </Text>
                <Text style={styles.errorMessage}>{errors.root.message}</Text>
              </View>
            </View>
          ) : null}

          <AnimatedPressable
            accessibilityLabel="Enviar link"
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#07110E" size="small" />
            ) : (
              <Text style={styles.primaryLabel}>Enviar link seguro</Text>
            )}
          </AnimatedPressable>
        </View>

        <FadeInView delay={150} distance={8} style={styles.loginFooter}>
          <Text style={styles.loginPrompt}>Lembrou sua senha?</Text>
          <AnimatedPressable
            accessibilityRole="link"
            onPress={() => router.replace('/sign-in')}
            style={styles.loginLinkButton}
          >
            <Text style={styles.loginLink}>Voltar para entrar</Text>
          </AnimatedPressable>
        </FadeInView>
      </Screen>
    </View>
  );
}

type RecoveryEmailFieldProps = {
  error?: string;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  value: string;
};

function RecoveryEmailField({
  error,
  onBlur,
  onChangeText,
  onSubmit,
  value,
}: RecoveryEmailFieldProps) {
  const [focusProgress] = useState(() => new Animated.Value(0));

  const animateFocus = (toValue: 0 | 1) => {
    focusProgress.stopAnimation();
    Animated.timing(focusProgress, {
      duration: 140,
      toValue,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.fieldBlock}>
      <Animated.Text
        style={[
          styles.label,
          {
            color: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.textSecondary, palette.primary],
            }),
          },
        ]}
      >
        E-mail
      </Animated.Text>
      <Animated.View
        style={[
          styles.inputShell,
          {
            backgroundColor: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.surface, '#121212'],
            }),
            borderColor: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.border, 'rgba(69,230,176,0.72)'],
            }),
          },
          error && styles.inputShellError,
        ]}
      >
        <Mail color={palette.textMuted} size={19} strokeWidth={1.8} />
        <TextInput
          accessibilityHint={error}
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          blurOnSubmit={false}
          keyboardType="email-address"
          onBlur={() => {
            animateFocus(0);
            onBlur();
          }}
          onChangeText={onChangeText}
          onFocus={() => animateFocus(1)}
          onSubmitEditing={onSubmit}
          placeholder="voce@exemplo.com"
          placeholderTextColor={palette.textMuted}
          returnKeyType="send"
          selectionColor={palette.primary}
          style={styles.input}
          textContentType="emailAddress"
          value={value}
        />
      </Animated.View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function RecoverySentState({ email }: { email: string }) {
  return (
    <View style={styles.root}>
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.sentScreen}
      >
        <FadeInView style={styles.sentLegacyCard}>
          <View style={styles.sentIcon}>
            <Mail color={palette.primary} size={30} strokeWidth={1.8} />
          </View>
          <Text align="center" style={styles.sentTitle}>
            Verifique seu e-mail
          </Text>
          <Text align="center" style={styles.sentMessage}>
            Enviamos um link de redefinição para
          </Text>
          <Text align="center" style={styles.sentEmail}>
            {email}
          </Text>
          <AnimatedPressable
            accessibilityLabel="Voltar para o login"
            accessibilityRole="button"
            onPress={() => router.replace('/sign-in')}
            style={styles.sentButton}
          >
            <Text style={styles.sentButtonLabel}>Voltar para o login</Text>
          </AnimatedPressable>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  screen: {
    gap: 30,
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  topLabel: {
    color: palette.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    lineHeight: 14,
  },
  heading: { gap: 10 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 33,
    letterSpacing: -1.15,
    lineHeight: 40,
    maxWidth: 355,
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 350,
  },
  form: { gap: 19 },
  fieldBlock: { gap: 7 },
  label: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 56,
    paddingHorizontal: 15,
  },
  inputShellError: { borderColor: palette.danger },
  input: {
    color: palette.text,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    minHeight: 54,
    paddingVertical: 0,
  },
  fieldError: {
    color: palette.danger,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  securityNote: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 13,
  },
  securityIcon: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 11,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  securityText: {
    color: palette.textMuted,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: palette.dangerSoft,
    borderColor: 'rgba(255,107,107,0.24)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 13,
  },
  errorIcon: {
    alignItems: 'center',
    borderColor: palette.danger,
    borderRadius: 9,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  errorIconText: {
    color: palette.danger,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 15,
  },
  errorCopy: { flex: 1, gap: 3 },
  errorTitle: {
    color: '#FF9999',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  errorMessage: {
    color: '#D7A6A6',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryLabel: {
    color: '#07110E',
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  loginFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 48,
  },
  loginPrompt: {
    color: palette.textMuted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  loginLinkButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 3,
  },
  loginLink: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 19,
  },
  sentScreen: { justifyContent: 'center', paddingHorizontal: 20 },
  sentLegacyCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  sentIcon: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 20,
    height: 72,
    justifyContent: 'center',
    marginBottom: 6,
    width: 72,
  },
  sentTitle: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    lineHeight: 30,
  },
  sentMessage: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  sentEmail: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  sentButton: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 52,
    width: '100%',
  },
  sentButtonLabel: {
    color: palette.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
});
