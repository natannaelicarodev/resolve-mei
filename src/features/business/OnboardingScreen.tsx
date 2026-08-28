import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';

import { AnimatedPressable, StepTransition } from '@/components/motion';
import { InlineFeedback, Screen, Text } from '@/components/ui';
import { WelcomeAmbientBackground } from '@/features/auth/WelcomeScreen';
import { triggerHaptic } from '@/lib/haptics';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { DarkThemeScope, radii, spacing, typography } from '@/theme';
import { formatDocument } from '@/utils/documents';
import { completeOnboarding } from './api';
import type { BusinessFormSection } from './BusinessFormFields';
import { businessQueryKey } from './hooks';
import { businessSchema } from './schemas';
import type { BusinessFormData } from './schemas';

interface OnboardingStep {
  title: string;
  description: string;
  section?: BusinessFormSection;
  fields: readonly FieldPath<BusinessFormData>[];
}

const steps: readonly [OnboardingStep, ...OnboardingStep[]] = [
  {
    title: 'Conte sobre seu negócio',
    description: 'Isso ajuda a personalizar sua experiência no ResolveMEI.',
    section: 'business',
    fields: ['businessName', 'documentType', 'documentNumber'],
  },
  {
    title: 'Contato',
    description: 'Onde seus clientes poderão falar com você.',
    section: 'contact',
    fields: ['professionalPhone', 'email'],
  },
  {
    title: 'Endereço',
    description: 'Informações usadas nos seus documentos.',
    section: 'address',
    fields: ['street', 'number', 'neighborhood', 'city', 'state', 'postalCode'],
  },
  {
    title: 'Detalhes opcionais',
    description: 'Você pode adicionar uma chave Pix agora ou depois.',
    section: 'details',
    fields: ['pixKey'],
  },
  {
    title: 'Tudo certo?',
    description: 'Revise os dados antes de concluir seu perfil.',
    fields: [],
  },
] as const;

function BusinessIdentityFields({
  control,
  setValue,
}: {
  control: Control<BusinessFormData>;
  setValue: UseFormSetValue<BusinessFormData>;
}) {
  const documentType = useWatch({ control, name: 'documentType' });
  return (
    <View style={styles.identityFields}>
      <Controller
        control={control}
        name="businessName"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Nome do negócio</Text>
            <TextInput
              accessibilityLabel="Nome do negócio"
              autoCapitalize="words"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Ex.: Serviços do Natan"
              placeholderTextColor="#858A90"
              returnKeyType="next"
              selectionColor="#2DD4BF"
              style={[styles.input, fieldState.error && styles.inputError]}
              value={field.value}
            />
            {fieldState.error?.message ? (
              <Text style={styles.fieldError}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Você atua como</Text>
        <View accessibilityRole="radiogroup" style={styles.documentSelector}>
          {(['cpf', 'cnpj'] as const).map((value) => {
            const selected = documentType === value;
            return (
              <AnimatedPressable
                accessibilityLabel={
                  value === 'cpf' ? 'Pessoa física' : 'Pessoa jurídica'
                }
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, selected }}
                containerStyle={styles.documentOptionContainer}
                disableScale
                key={value}
                onPress={() => {
                  void triggerHaptic('selection');
                  setValue('documentType', value);
                  setValue('documentNumber', '');
                }}
                style={[
                  styles.documentOption,
                  selected && styles.documentOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.documentOptionLabel,
                    selected && styles.documentOptionLabelSelected,
                  ]}
                >
                  {value === 'cpf' ? 'Pessoa física' : 'Pessoa jurídica'}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
      <Controller
        control={control}
        name="documentNumber"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{documentType.toUpperCase()}</Text>
            <TextInput
              accessibilityLabel={`Número do ${documentType.toUpperCase()}`}
              keyboardType="number-pad"
              maxLength={documentType === 'cpf' ? 14 : 18}
              onBlur={field.onBlur}
              onChangeText={(value) =>
                field.onChange(formatDocument(value, documentType))
              }
              placeholder={
                documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'
              }
              placeholderTextColor="#858A90"
              returnKeyType="done"
              selectionColor="#2DD4BF"
              style={[styles.input, fieldState.error && styles.inputError]}
              value={field.value}
            />
            {fieldState.error?.message ? (
              <Text style={styles.fieldError}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

function ContactFields({
  control,
  disabled,
}: {
  control: Control<BusinessFormData>;
  disabled: boolean;
}) {
  return (
    <View style={styles.contactFields}>
      <Controller
        control={control}
        name="professionalPhone"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Telefone profissional</Text>
            <TextInput
              accessibilityLabel="Telefone profissional"
              accessibilityState={{ disabled }}
              editable={!disabled}
              keyboardType="phone-pad"
              maxLength={15}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#858A90"
              returnKeyType="next"
              selectionColor="#2DD4BF"
              style={[styles.input, fieldState.error && styles.inputError]}
              value={field.value}
            />
            {fieldState.error?.message ? (
              <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
                {fieldState.error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>E-mail profissional</Text>
            <TextInput
              accessibilityLabel="E-mail profissional"
              accessibilityState={{ disabled }}
              autoCapitalize="none"
              autoComplete="email"
              editable={!disabled}
              keyboardType="email-address"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#858A90"
              returnKeyType="done"
              selectionColor="#2DD4BF"
              style={[styles.input, fieldState.error && styles.inputError]}
              value={field.value}
            />
            {fieldState.error?.message ? (
              <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
                {fieldState.error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

interface OnboardingFieldProps {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  control: Control<BusinessFormData>;
  disabled: boolean;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  maxLength?: number;
  name: FieldPath<BusinessFormData>;
  placeholder: string;
  returnKeyType?: TextInputProps['returnKeyType'];
}

function OnboardingField({
  autoCapitalize,
  autoComplete,
  control,
  disabled,
  keyboardType,
  label,
  maxLength,
  name,
  placeholder,
  returnKeyType = 'next',
}: OnboardingFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            editable={!disabled}
            keyboardType={keyboardType}
            maxLength={maxLength}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder={placeholder}
            placeholderTextColor="#858A90"
            returnKeyType={returnKeyType}
            selectionColor="#2DD4BF"
            style={[styles.input, fieldState.error && styles.inputError]}
            value={field.value}
          />
          {fieldState.error?.message ? (
            <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
              {fieldState.error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

function AddressFields({
  control,
  disabled,
}: {
  control: Control<BusinessFormData>;
  disabled: boolean;
}) {
  return (
    <View style={styles.formFields}>
      <OnboardingField
        autoComplete="street-address"
        control={control}
        disabled={disabled}
        label="Rua"
        name="street"
        placeholder="Ex.: Rua das Flores"
      />
      <View style={styles.fieldRow}>
        <View style={styles.fieldColumn}>
          <OnboardingField
            control={control}
            disabled={disabled}
            keyboardType="number-pad"
            label="Número"
            name="number"
            placeholder="123"
          />
        </View>
        <View style={styles.fieldColumn}>
          <OnboardingField
            control={control}
            disabled={disabled}
            label="Complemento"
            name="complement"
            placeholder="Sala, bloco..."
          />
        </View>
      </View>
      <OnboardingField
        control={control}
        disabled={disabled}
        label="Bairro"
        name="neighborhood"
        placeholder="Ex.: Centro"
      />
      <View style={styles.fieldRow}>
        <View style={styles.cityColumn}>
          <OnboardingField
            control={control}
            disabled={disabled}
            label="Cidade"
            name="city"
            placeholder="Sua cidade"
          />
        </View>
        <View style={styles.stateColumn}>
          <OnboardingField
            autoCapitalize="characters"
            control={control}
            disabled={disabled}
            label="UF"
            maxLength={2}
            name="state"
            placeholder="SP"
          />
        </View>
      </View>
      <OnboardingField
        autoComplete="postal-code"
        control={control}
        disabled={disabled}
        keyboardType="number-pad"
        label="CEP"
        maxLength={9}
        name="postalCode"
        placeholder="00000-000"
        returnKeyType="done"
      />
    </View>
  );
}

function OptionalDetailsFields({
  control,
  disabled,
}: {
  control: Control<BusinessFormData>;
  disabled: boolean;
}) {
  return (
    <View style={styles.formFields}>
      <OnboardingField
        autoCapitalize="none"
        control={control}
        disabled={disabled}
        label="Chave Pix"
        name="pixKey"
        placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
        returnKeyType="done"
      />
      <View style={styles.helperPanel}>
        <Text style={styles.helperTitle}>Este campo é opcional</Text>
        <Text style={styles.helperText}>
          A chave poderá aparecer nos seus orçamentos e ser alterada depois nas
          configurações profissionais.
        </Text>
      </View>
    </View>
  );
}

function ReviewFields({ values }: { values: Partial<BusinessFormData> }) {
  const document = values.documentNumber || 'Não informado';
  const contact = values.professionalPhone || values.email || 'Não informado';
  const address = [values.street, values.number, values.city, values.state]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.reviewPanel}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewMark} />
        <View style={styles.reviewHeaderCopy}>
          <Text style={styles.reviewTitle}>{values.businessName}</Text>
          <Text style={styles.reviewSubtitle}>Perfil pronto para concluir</Text>
        </View>
      </View>
      <View style={styles.reviewDivider} />
      <View style={styles.reviewRows}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>
            {values.documentType?.toUpperCase() || 'Documento'}
          </Text>
          <Text style={styles.reviewValue}>{document}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Contato</Text>
          <Text style={styles.reviewValue}>{contact}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Endereço</Text>
          <Text style={styles.reviewValue}>{address || 'Não informado'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Chave Pix</Text>
          <Text style={styles.reviewValue}>
            {values.pixKey || 'Adicionar depois'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      documentType: 'cpf',
      documentNumber: '',
      professionalPhone: '',
      email: user?.email ?? '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      postalCode: '',
      pixKey: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!user) throw new Error('Missing user');
      return completeOnboarding(user.id, data);
    },
    onSuccess: (completedBusiness) => {
      void triggerHaptic('success');
      if (user) {
        queryClient.setQueryData(businessQueryKey(user.id), completedBusiness);
      }
      router.replace('/welcome');
    },
    onError: (error) =>
      setError('root', { message: normalizeError(error).message }),
  });
  const current = steps[step] ?? steps[0];
  const goNext = async () => {
    const valid = await trigger(current.fields, { shouldFocus: true });
    if (!valid) return;
    Keyboard.dismiss();
    setDirection('forward');
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };
  const goBack = () => {
    setDirection('back');
    setStep((value) => Math.max(0, value - 1));
    Keyboard.dismiss();
  };
  const values = useWatch({ control });

  return (
    <DarkThemeScope>
      <View style={styles.root}>
        <WelcomeAmbientBackground dark />
        <Screen
          background="transparent"
          contentContainerStyle={styles.screen}
          keyboardAvoiding
        >
          <View style={styles.card}>
            <View
              accessibilityLabel={`${Math.round(((step + 1) / steps.length) * 100)}% concluído`}
              accessibilityRole="progressbar"
              style={styles.progressRow}
            >
              {steps.map((item, index) => (
                <View
                  key={item.title}
                  style={[
                    styles.progressSegment,
                    index <= step && styles.progressSegmentComplete,
                  ]}
                />
              ))}
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.description}>{current.description}</Text>
            </View>

            <StepTransition direction={direction} step={step}>
              {step === 0 ? (
                <BusinessIdentityFields control={control} setValue={setValue} />
              ) : current.section === 'contact' ? (
                <ContactFields
                  control={control}
                  disabled={mutation.isPending}
                />
              ) : current.section === 'address' ? (
                <AddressFields
                  control={control}
                  disabled={mutation.isPending}
                />
              ) : current.section === 'details' ? (
                <OptionalDetailsFields
                  control={control}
                  disabled={mutation.isPending}
                />
              ) : (
                <ReviewFields values={values} />
              )}
            </StepTransition>

            {errors.root?.message ? (
              <InlineFeedback message={errors.root.message} variant="error" />
            ) : null}
            <View style={styles.actions}>
              {step > 0 ? (
                <AnimatedPressable
                  accessibilityLabel="Voltar"
                  accessibilityRole="button"
                  disabled={mutation.isPending}
                  onPress={goBack}
                  style={styles.backAction}
                >
                  <Text style={styles.backActionLabel}>Voltar</Text>
                </AnimatedPressable>
              ) : null}
              <AnimatedPressable
                accessibilityLabel={
                  step < steps.length - 1 ? 'Continuar' : 'Concluir perfil'
                }
                accessibilityRole="button"
                accessibilityState={{
                  busy: mutation.isPending,
                  disabled: mutation.isPending,
                }}
                disabled={mutation.isPending}
                onPress={
                  step < steps.length - 1
                    ? () => void goNext()
                    : () => void handleSubmit((data) => mutation.mutate(data))()
                }
                style={styles.primaryAction}
              >
                <Text style={styles.primaryActionLabel}>
                  {mutation.isPending
                    ? 'Aguarde...'
                    : step < steps.length - 1
                      ? 'Continuar'
                      : 'Concluir perfil'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </Screen>
      </View>
    </DarkThemeScope>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#14161A', flex: 1 },
  screen: { justifyContent: 'center', padding: spacing.sm },
  card: {
    backgroundColor: '#14161A',
    borderColor: '#20242A',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  header: { gap: spacing.sm },
  title: {
    color: '#F2F2F0',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 32,
  },
  description: { color: '#BFC3C7', fontSize: 15, lineHeight: 22 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSegment: {
    backgroundColor: '#343941',
    borderRadius: radii.pill,
    flex: 1,
    height: 5,
  },
  progressSegmentComplete: { backgroundColor: '#2DD4BF' },
  identityFields: { gap: spacing.md },
  contactFields: { gap: spacing.md },
  formFields: { gap: spacing.md },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  fieldColumn: { flex: 1 },
  cityColumn: { flex: 2 },
  stateColumn: { flex: 1 },
  fieldBlock: { gap: spacing.xs },
  fieldLabel: {
    color: '#D4D6D9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    color: '#F2F2F0',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    ...typography.body,
  },
  inputError: { borderColor: '#FF9187' },
  fieldError: { color: '#FF9187', fontSize: 12, lineHeight: 17 },
  helperPanel: {
    backgroundColor: '#192624',
    borderColor: '#28423E',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  helperTitle: { color: '#74E4D4', fontSize: 13, fontWeight: '700' },
  helperText: { color: '#BFC3C7', fontSize: 13, lineHeight: 19 },
  reviewPanel: {
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  reviewHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  reviewMark: {
    backgroundColor: '#2DD4BF',
    borderRadius: radii.pill,
    height: 40,
    width: 4,
  },
  reviewHeaderCopy: { flex: 1, gap: 2 },
  reviewTitle: { color: '#F2F2F0', fontSize: 18, fontWeight: '800' },
  reviewSubtitle: { color: '#74E4D4', fontSize: 12, lineHeight: 17 },
  reviewDivider: { backgroundColor: '#343941', height: 1 },
  reviewRows: { gap: spacing.md },
  reviewRow: { gap: 3 },
  reviewLabel: {
    color: '#8D949B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewValue: { color: '#F2F2F0', fontSize: 14, lineHeight: 20 },
  documentSelector: {
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  documentOptionContainer: { flex: 1 },
  documentOption: {
    alignItems: 'center',
    borderRadius: 5,
    justifyContent: 'center',
    minHeight: 48,
  },
  documentOptionSelected: { backgroundColor: '#2DD4BF' },
  documentOptionLabel: {
    color: '#BFC3C7',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  documentOptionLabelSelected: { color: '#101416' },
  actions: { gap: spacing.sm },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 60,
  },
  primaryActionLabel: {
    color: '#101416',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  backAction: {
    alignItems: 'center',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  backActionLabel: { color: '#F2F2F0', fontSize: 15, fontWeight: '700' },
});
