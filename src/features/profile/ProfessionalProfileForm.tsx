import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, Text } from '@/components/ui';
import { updateExistingBusiness } from '@/features/business/api';
import type { Business } from '@/features/business/api';
import { BusinessFormFields } from '@/features/business/BusinessFormFields';
import { businessQueryKey, useMyBusiness } from '@/features/business/hooks';
import { createLogoSignedUrl } from '@/features/business/logo';
import { businessSchema } from '@/features/business/schemas';
import type { BusinessFormData } from '@/features/business/schemas';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
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

export function ProfessionalProfileForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const business = useMyBusiness(Boolean(user));
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const [selectedLogo, setSelectedLogo] = useState<ImagePickerAsset>();
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
  const logoUrl = useQuery({
    queryKey: ['business-logo', 'signed', business.data?.logo_path],
    queryFn: () => createLogoSignedUrl(business.data?.logo_path ?? ''),
    enabled: Boolean(business.data?.logo_path),
    staleTime: 4 * 60 * 1000,
  });

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
      return updateExistingBusiness(
        user.id,
        business.data.id,
        data,
        business.data.logo_path,
        selectedLogo,
      );
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
      <Text style={styles.heading} variant="title">
        Dados profissionais
      </Text>
      {business.isLoading ? (
        <Text>Carregando dados profissionais...</Text>
      ) : null}
      {business.isError || (!business.isLoading && !business.data) ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Não foi possível carregar os dados profissionais.
        </Text>
      ) : null}
      {business.data ? (
        <>
          <BusinessFormFields
            control={control}
            currentLogoUrl={logoUrl.data}
            disabled={mutation.isPending || showSuccess}
            onLogoSelected={setSelectedLogo}
            selectedLogo={selectedLogo}
            setValue={setValue}
          />
          {errors.root?.message ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errors.root.message}
            </Text>
          ) : null}
          {showSuccess ? (
            <Text
              accessible
              accessibilityLiveRegion="polite"
              style={styles.success}
            >
              Dados profissionais atualizados com sucesso.
            </Text>
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
  error: { color: colors.danger },
  success: { color: colors.primary },
});
