import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import type { TextInput, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Button, Card, InlineFeedback, Skeleton, Text } from '@/components/ui';
import { updateExistingBusiness } from '@/features/business/api';
import type { Business } from '@/features/business/api';
import { BusinessFormFields } from '@/features/business/BusinessFormFields';
import type { BusinessFocusField } from '@/features/business/BusinessFormFields';
import { businessQueryKey, useMyBusiness } from '@/features/business/hooks';
import { businessSchema } from '@/features/business/schemas';
import type { BusinessFormData } from '@/features/business/schemas';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { spacing } from '@/theme';
import { formatDocument } from '@/utils/documents';
import { scheduleProfileRedirect } from './navigation';

export function businessToFormData(business: Business): BusinessFormData {
  return {
    businessName: business.business_name,
    documentType: business.document_type,
    documentNumber: formatDocument(
      business.document_number ?? '',
      business.document_type,
    ),
    professionalPhone: business.professional_phone,
    email: business.email,
    street: business.street,
    number: business.number,
    complement: business.complement ?? '',
    neighborhood: business.neighborhood,
    city: business.city,
    state: business.state as BusinessFormData['state'],
    postalCode: business.postal_code,
    pixKey: business.pix_key ?? '',
  };
}

export type ProfessionalProfileFocus = 'first-required' | 'email';

export function resolveFirstRequiredBusinessField(
  business: Business,
): BusinessFocusField {
  const required: [BusinessFocusField, string | null | undefined][] = [
    ['businessName', business.business_name],
    ['documentNumber', business.document_number],
    ['professionalPhone', business.professional_phone],
    ['email', business.email],
    ['street', business.street],
    ['number', business.number],
    ['neighborhood', business.neighborhood],
    ['city', business.city],
    ['state', business.state],
    ['postalCode', business.postal_code],
  ];
  return required.find(([, value]) => !value?.trim())?.[0] ?? 'businessName';
}

export function ProfessionalProfileForm({
  focus,
  onFocusTarget,
}: {
  focus?: ProfessionalProfileFocus;
  onFocusTarget?: (target: TextInput | View | null) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const business = useMyBusiness(Boolean(user));
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      documentType: 'cpf',
      documentNumber: '',
      professionalPhone: '',
      email: '',
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
  const focusField: BusinessFocusField | undefined = business.data
    ? focus === 'first-required'
      ? resolveFirstRequiredBusinessField(business.data)
      : focus
    : undefined;

  useEffect(() => {
    if (business.data) reset(businessToFormData(business.data));
  }, [business.data, reset]);
  useEffect(
    () => () => {
      cancelNavigation.current?.();
    },
    [],
  );

  const mutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!user || !business.data) throw new Error('Missing business');
      return updateExistingBusiness(user.id, business.data.id, data);
    },
    onSuccess: (updatedBusiness) => {
      queryClient.setQueryData(businessQueryKey, updatedBusiness);
      void queryClient.invalidateQueries({ queryKey: businessQueryKey });
      setShowSuccess(true);
      cancelNavigation.current?.();
      cancelNavigation.current = scheduleProfileRedirect(() => {
        router.replace('/home');
      });
    },
    onError: (error) => {
      submissionLocked.current = false;
      setError('root', { message: normalizeError(error).message });
    },
  });
  const submit = (data: BusinessFormData) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    clearErrors('root');
    setShowSuccess(false);
    mutation.mutate(data);
  };

  return (
    <>
      <Text style={styles.heading} variant="cardTitle">
        Dados profissionais
      </Text>
      {business.isLoading ? (
        <Card>
          <Skeleton height={20} width="45%" />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={52} />
        </Card>
      ) : null}
      {business.isError || (!business.isLoading && !business.data) ? (
        <Card variant="danger">
          <InlineFeedback
            message="Não foi possível carregar os dados profissionais."
            variant="error"
          />
          <Button
            label="Tentar novamente"
            onPress={() => void business.refetch?.()}
            variant="secondary"
          />
        </Card>
      ) : null}
      {business.data ? (
        <>
          <BusinessFormFields
            control={control}
            disabled={mutation.isPending || showSuccess}
            focusField={focusField}
            onFocusTarget={onFocusTarget}
            setValue={setValue}
          />
          {errors.root?.message ? (
            <InlineFeedback message={errors.root.message} variant="error" />
          ) : null}
          {showSuccess ? (
            <SuccessTransition message="Dados profissionais atualizados com sucesso." />
          ) : null}
          <Button
            disabled={mutation.isPending || showSuccess}
            label="Salvar dados profissionais"
            loading={mutation.isPending}
            onPress={() => void handleSubmit(submit)()}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: spacing.sm },
});
