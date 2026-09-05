import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  findNodeHandle,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FadeInView,
  StepTransition,
  SuccessTransition,
} from '@/components/motion';
import {
  Button,
  Card,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Input,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { radii, spacing, useTheme } from '@/theme';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { getMyProfile, profileQueryKey, updateMyProfile } from './api';
import { createAvatarSignedUrl, getProfileInitial } from './avatar';
import { scheduleProfileRedirect } from './navigation';
import { ProfessionalProfileForm } from './ProfessionalProfileForm';
import { PersonalImageField } from './PersonalImageField';
import type { ProfessionalProfileFocus } from './ProfessionalProfileForm';
import { profileSchema } from './schemas';
import type { ProfileFormData } from './schemas';

export { profileQueryKey } from './api';

type ProfileTab = 'personal' | 'professional';
type ProfileNavigation =
  | { tab: 'personal'; field: 'phone' }
  | { tab: 'professional'; field: ProfessionalProfileFocus };

export function parseProfileNavigation(
  section?: string,
  field?: string,
): ProfileNavigation | null {
  if (section === 'personal' && field === 'phone')
    return { tab: 'personal', field: 'phone' };
  if (
    section === 'professional' &&
    (field === 'first-required' || field === 'email')
  )
    return { tab: 'professional', field };
  return null;
}

const tabs = [
  { label: 'Dados pessoais', value: 'personal' },
  { label: 'Dados profissionais', value: 'professional' },
] as const;

function ProfileSkeleton() {
  return (
    <Card>
      <Skeleton height={20} width="55%" />
      <Skeleton height={56} />
      <Skeleton height={56} />
      <Skeleton height={52} />
    </Card>
  );
}

export function ProfileScreen() {
  const params =
    useLocalSearchParams<{ section?: string; field?: string }>() ?? {};
  const navigation = useMemo(
    () => parseProfileNavigation(params.section, params.field),
    [params.field, params.section],
  );
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const phoneRef = useRef<TextInput>(null);
  const contextualNavigationHandled = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset>();
  const [tab, setTab] = useState<ProfileTab>(
    () => navigation?.tab ?? 'personal',
  );
  const query = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: ({ signal }) => getMyProfile(userId, signal),
    enabled: Boolean(userId),
  });
  const image = useQuery({
    queryKey: [
      'private',
      userId,
      'profile-avatar',
      'signed',
      query.data?.avatar_path,
    ],
    queryFn: () => createAvatarSignedUrl(query.data?.avatar_path ?? ''),
    enabled: Boolean(userId && query.data?.avatar_path),
    staleTime: 4 * 60 * 1000,
  });
  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  });
  const discard = useUnsavedChangesGuard(isDirty || Boolean(selectedImage));
  useEffect(() => {
    if (query.data?.id === userId)
      reset({ fullName: query.data.full_name, phone: query.data.phone ?? '' });
  }, [query.data, reset, userId]);
  useEffect(() => {
    contextualNavigationHandled.current = false;
  }, [navigation]);

  const revealTarget = useCallback(
    (target: TextInput | View | null, focus: boolean) => {
      if (!target || contextualNavigationHandled.current) return;
      contextualNavigationHandled.current = true;
      requestAnimationFrame(() => {
        const handle = findNodeHandle(target);
        if (handle)
          scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
            handle,
            24,
            true,
          );
        if (focus && 'focus' in target && typeof target.focus === 'function')
          target.focus();
      });
    },
    [],
  );

  useEffect(() => {
    if (
      navigation?.tab === 'personal' &&
      navigation.field === 'phone' &&
      !query.isLoading
    )
      revealTarget(phoneRef.current, true);
  }, [navigation, query.isLoading, revealTarget, tab]);
  useEffect(
    () => () => {
      cancelNavigation.current?.();
    },
    [],
  );
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error('Missing user for profile image');
      return updateMyProfile(
        user.id,
        data,
        query.data?.avatar_path,
        selectedImage,
      );
    },
    onSuccess: (profile) => {
      if (profile.id !== userId) return;
      discard.allowNextNavigation();
      queryClient.setQueryData(profileQueryKey(userId), profile);
      void queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
      if (selectedImage) {
        void queryClient.invalidateQueries({
          queryKey: ['private', userId, 'profile-avatar'],
        });
        setSelectedImage(undefined);
      }
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
  const submit = (data: ProfileFormData) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    clearErrors('root');
    setShowSuccess(false);
    mutation.mutate(data);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.primary }]}
    >
      <StatusBar style="light" />
      <Screen
        background="subtle"
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.backgroundSubtle },
        ]}
        keyboardAvoiding
        safeAreaEdges={[]}
        scrollRef={scrollRef}
        style={{ backgroundColor: colors.primary }}
      >
        <View
          style={[
            styles.identityBand,
            { backgroundColor: colors.primary, width: windowWidth + 4 },
          ]}
        >
          <ProtectedPageHeader
            foregroundColor={colors.textInverse}
            title="Perfil"
            settings
          />
          <FadeInView style={styles.identity}>
            <View
              style={[
                styles.identityIcon,
                { backgroundColor: colors.textInverse },
              ]}
            >
              <Icon name="profile" rawColor={colors.primary} size="large" />
            </View>
            <View style={styles.identityCopy}>
              <Text
                numberOfLines={1}
                style={{ color: colors.textInverse }}
                variant="sectionTitle"
              >
                {query.data?.full_name || 'Seu perfil profissional'}
              </Text>
              <Text style={{ color: colors.textInverse }} variant="bodySmall">
                Seus dados aparecem nos documentos enviados aos clientes.
              </Text>
            </View>
          </FadeInView>
        </View>

        <Card style={styles.sectionSelector} variant="elevated">
          <SegmentedControl
            label="Seção do perfil"
            onChange={(value) => setTab(value)}
            options={tabs}
            value={tab}
          />
        </Card>

        <StepTransition
          direction={tab === 'personal' ? 'back' : 'forward'}
          step={tab}
        >
          <View style={styles.section}>
            {tab === 'personal' ? (
              query.isLoading ? (
                <ProfileSkeleton />
              ) : (
                <Card variant="elevated">
                  <Text variant="cardTitle">Dados pessoais</Text>
                  <PersonalImageField
                    currentUrl={image.data}
                    fallbackInitial={getProfileInitial(query.data?.full_name)}
                    disabled={
                      mutation.isPending || showSuccess || query.isLoading
                    }
                    onSelected={setSelectedImage}
                    selected={selectedImage}
                  />
                  <Controller
                    control={control}
                    name="fullName"
                    render={({ field }) => (
                      <Input
                        autoCapitalize="words"
                        error={errors.fullName?.message}
                        label="Nome completo"
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        returnKeyType="next"
                        value={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <Input
                        ref={phoneRef}
                        error={errors.phone?.message}
                        keyboardType="phone-pad"
                        label="Telefone pessoal"
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        returnKeyType="done"
                        value={field.value}
                      />
                    )}
                  />
                  {errors.root?.message ? (
                    <InlineFeedback
                      message={errors.root.message}
                      variant="error"
                    />
                  ) : null}
                  {showSuccess ? (
                    <SuccessTransition message="Dados pessoais atualizados com sucesso." />
                  ) : null}
                  <Button
                    disabled={mutation.isPending || showSuccess}
                    label="Salvar dados pessoais"
                    loading={mutation.isPending}
                    onPress={() => void handleSubmit(submit)()}
                  />
                </Card>
              )
            ) : (
              <ProfessionalProfileForm
                key={userId}
                focus={
                  navigation?.tab === 'professional'
                    ? navigation.field
                    : undefined
                }
                onFocusTarget={(target) => revealTarget(target, true)}
              />
            )}
          </View>
        </StepTransition>
        <ConfirmationDialog
          cancelLabel="Continuar editando"
          confirmLabel="Descartar alterações"
          description="As alterações feitas no perfil ainda não foram salvas."
          destructive
          onCancel={discard.cancelDiscard}
          onConfirm={discard.confirmDiscard}
          title="Descartar alterações?"
          visible={discard.visible}
        />
      </Screen>
      <ProtectedBottomNavigation selected="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  identityIcon: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  identityCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  sectionSelector: { marginTop: -40 },
  section: { gap: spacing.lg },
});
