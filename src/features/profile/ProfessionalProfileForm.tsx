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

export const emptyProfessionalFormValues: BusinessFormData = {
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
};

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
  const userId = user?.id ?? '';
  const business = useMyBusiness(userId);
  const validBusiness =
    business.data?.owner_id === userId ? business.data : undefined;

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
      {business.isError || (!business.isLoading && !validBusiness) ? (
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
      {validBusiness ? (
        <ProfessionalBusinessForm
          key={`${userId}:${validBusiness.id}`}
          business={validBusiness}
          focus={focus}
          onFocusTarget={onFocusTarget}
          userId={userId}
        />
      ) : null}
    </>
  );
}

function ProfessionalBusinessForm({
  business,
  focus,
  onFocusTarget,
  userId,
}: {
  business: Business;
  focus?: ProfessionalProfileFocus;
  onFocusTarget?: (target: TextInput | View | null) => void;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const mounted = useRef(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: businessToFormData(business),
  });
  const identity = `${userId}:${business.id}`;
  const focusField: BusinessFocusField | undefined =
    focus === 'first-required'
      ? resolveFirstRequiredBusinessField(business)
      : focus;

  useEffect(
    () => () => {
      mounted.current = false;
      cancelNavigation.current?.();
    },
    [],
  );

  const mutation = useMutation({
    mutationFn: async (variables: {
      data: BusinessFormData;
      expectedUserId: string;
      expectedBusinessId: string;
      identity: string;
    }) => {
      const updated = await updateExistingBusiness(
        variables.expectedUserId,
        variables.expectedBusinessId,
        variables.data,
      );
      if (!mounted.current) throw new Error('BUSINESS_SESSION_CHANGED');
      return updated;
    },
    onSuccess: (updatedBusiness, variables) => {
      if (
        !mounted.current ||
        variables.identity !== identity ||
        updatedBusiness.owner_id !== variables.expectedUserId ||
        updatedBusiness.id !== variables.expectedBusinessId
      )
        return;
      queryClient.setQueryData(
        businessQueryKey(variables.expectedUserId),
        updatedBusiness,
      );
      void queryClient.invalidateQueries({
        queryKey: businessQueryKey(variables.expectedUserId),
      });
      setShowSuccess(true);
      cancelNavigation.current?.();
      cancelNavigation.current = scheduleProfileRedirect(() => {
        router.replace('/home');
      });
    },
    onError: (error, variables) => {
      submissionLocked.current = false;
      if (!mounted.current || variables.identity !== identity) return;
      setError('root', { message: normalizeError(error).message });
    },
  });
  const submit = (data: BusinessFormData) => {
    if (submissionLocked.current || business.owner_id !== userId) return;
    submissionLocked.current = true;
    clearErrors('root');
    setShowSuccess(false);
    mutation.mutate({
      data,
      expectedUserId: userId,
      expectedBusinessId: business.id,
      identity,
    });
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: spacing.sm },
});
