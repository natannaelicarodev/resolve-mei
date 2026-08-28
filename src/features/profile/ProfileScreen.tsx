import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  findNodeHandle,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedPressable,
  FadeInView,
  StepTransition,
  SuccessTransition,
} from '@/components/motion';
import {
  Button,
  Card,
  ConfirmationDialog,
  FormSection,
  InlineFeedback,
  Input,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { radii, spacing, useTheme } from '@/theme';
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

function ProfileMenuRow({
  danger = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.menuRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: danger
              ? colors.dangerSubtle
              : colors.primarySubtle,
          },
        ]}
      >
        <MaterialCommunityIcons
          color={danger ? colors.danger : colors.primary}
          name={icon}
          size={19}
        />
      </View>
      <Text
        color={danger ? 'danger' : 'textPrimary'}
        style={styles.menuLabel}
        variant="label"
      >
        {label}
      </Text>
      {!danger ? (
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={20}
        />
      ) : null}
    </AnimatedPressable>
  );
}

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
  const { user, signOut } = useAuth();
  const userId = user?.id ?? '';
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const phoneRef = useRef<TextInput>(null);
  const contextualNavigationHandled = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset>();
  const [editing, setEditing] = useState(() => Boolean(navigation));
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
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  });
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
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(undefined);
    try {
      await signOut();
      router.replace('/sign-in');
      void triggerHaptic('selection');
    } catch (error) {
      setLogoutError(normalizeError(error).message);
      setLoggingOut(false);
    }
  };

  if (!editing)
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <Screen safeAreaEdges={[]}>
          <View style={styles.profileHero} testID="profile-menu-identity">
            {image.data ? (
              <Image
                accessibilityLabel="Foto do perfil"
                source={{ uri: image.data }}
                style={styles.profileAvatar}
              />
            ) : (
              <View
                accessibilityLabel="Avatar do perfil"
                style={[
                  styles.profileAvatar,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text color="textOnPrimary" style={styles.profileInitial}>
                  {getProfileInitial(query.data?.full_name)}
                </Text>
              </View>
            )}
            <Text
              align="center"
              numberOfLines={2}
              style={styles.profileName}
              variant="cardTitle"
            >
              {query.data?.full_name || 'Seu perfil'}
            </Text>
            <Text
              align="center"
              color="textMuted"
              numberOfLines={1}
              style={styles.profileEmail}
              variant="caption"
            >
              {user?.email}
            </Text>
          </View>

          <View style={styles.menuSection}>
            <Text
              color="primary"
              style={styles.menuSectionTitle}
              variant="caption"
            >
              GERAL
            </Text>
            <ProfileMenuRow
              icon="account-outline"
              label="Dados pessoais"
              onPress={() => {
                setTab('personal');
                setEditing(true);
              }}
            />
            <ProfileMenuRow
              icon="briefcase-outline"
              label="Dados profissionais"
              onPress={() => {
                setTab('professional');
                setEditing(true);
              }}
            />
          </View>

          <View style={styles.menuSection}>
            <Text
              color="primary"
              style={styles.menuSectionTitle}
              variant="caption"
            >
              SEGURANÇA
            </Text>
            <ProfileMenuRow
              icon="lock-outline"
              label="Alterar senha"
              onPress={() => router.push('/forgot-password')}
            />
          </View>

          <View style={styles.menuSection}>
            <Text
              color="primary"
              style={styles.menuSectionTitle}
              variant="caption"
            >
              OUTROS
            </Text>
            <ProfileMenuRow
              icon="tune-variant"
              label="Configurações"
              onPress={() => router.push('/settings')}
            />
            {logoutError ? (
              <InlineFeedback message={logoutError} variant="error" />
            ) : null}
            <ProfileMenuRow
              danger
              icon="logout-variant"
              label="Sair da conta"
              onPress={() => setConfirmingLogout(true)}
            />
          </View>
        </Screen>
        <ConfirmationDialog
          confirmLabel="Sair da conta"
          description="Você precisará entrar novamente para acessar seus dados."
          destructive
          loading={loggingOut}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={() => {
            setConfirmingLogout(false);
            void logout();
          }}
          title="Sair da conta?"
          visible={confirmingLogout}
        />
        <ProtectedBottomNavigation selected="profile" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <Screen keyboardAvoiding safeAreaEdges={[]} scrollRef={scrollRef}>
        <ProtectedPageHeader title="Perfil" settings />
        <FadeInView
          style={[styles.identity, { backgroundColor: colors.primarySubtle }]}
          testID="profile-identity"
        >
          {image.data ? (
            <Image
              accessibilityLabel="Foto do perfil"
              source={{ uri: image.data }}
              style={styles.identityAvatar}
            />
          ) : (
            <View
              accessibilityLabel="Avatar do perfil"
              style={[
                styles.identityAvatar,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text color="primary" variant="pageTitle">
                {getProfileInitial(query.data?.full_name)}
              </Text>
            </View>
          )}
          <View style={styles.identityCopy}>
            <Text numberOfLines={2} variant="pageTitle">
              {query.data?.full_name || 'Seu perfil'}
            </Text>
            <Text color="textSecondary" numberOfLines={2}>
              {user?.email}
            </Text>
          </View>
        </FadeInView>

        <SegmentedControl
          label="Seção do perfil"
          onChange={(value) => setTab(value)}
          options={tabs}
          value={tab}
        />

        <StepTransition
          direction={tab === 'personal' ? 'back' : 'forward'}
          step={tab}
        >
          <View style={styles.section}>
            {tab === 'personal' ? (
              query.isLoading ? (
                <ProfileSkeleton />
              ) : (
                <Card>
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
        <FormSection
          description="Preferências do aplicativo e acesso neste dispositivo."
          title="Segurança e outros"
        >
          <Button
            label="Aparência e configurações"
            onPress={() => router.push('/settings')}
            variant="secondary"
          />
          {logoutError ? (
            <InlineFeedback message={logoutError} variant="error" />
          ) : null}
          <Button
            disabled={loggingOut}
            label="Sair da conta"
            loading={loggingOut}
            onPress={() => setConfirmingLogout(true)}
            variant="danger"
          />
        </FormSection>
        <ConfirmationDialog
          confirmLabel="Sair da conta"
          description="Você precisará entrar novamente para acessar seus dados."
          destructive
          loading={loggingOut}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={() => {
            setConfirmingLogout(false);
            void logout();
          }}
          title="Sair da conta?"
          visible={confirmingLogout}
        />
      </Screen>
      <ProtectedBottomNavigation selected="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  profileHero: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 14,
  },
  profileAvatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 64,
    justifyContent: 'center',
    marginBottom: 12,
    width: 64,
  },
  profileInitial: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  profileName: { fontSize: 16, lineHeight: 22 },
  profileEmail: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  menuSection: { gap: 8, paddingTop: 6 },
  menuSectionTitle: { fontSize: 10, lineHeight: 14 },
  menuRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  menuLabel: { flex: 1, fontSize: 12, lineHeight: 17 },
  identity: {
    alignItems: 'center',
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  identityAvatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  identityCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  section: { gap: spacing.lg },
});
