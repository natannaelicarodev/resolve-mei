import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Badge, IconButton, Text } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { getProfileInitial } from '@/features/profile/avatar';
import { radii, sizes, spacing, useTheme } from '@/theme';

interface HomeDashboardProps {
  firstName?: string;
  avatarUrl?: string;
  profileConfigured: boolean;
  hasContact: boolean;
  contactPendingField?: 'phone' | 'email';
  activeClientCount?: number;
  clientCountLoading?: boolean;
  clientCountError?: boolean;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function AppHeader({
  firstName,
  avatarUrl,
}: {
  firstName?: string;
  avatarUrl?: string;
}) {
  const { colors } = useTheme();
  const initial = getProfileInitial(firstName);

  return (
    <View style={styles.appHeader}>
      {avatarUrl ? (
        <Image
          accessibilityLabel={
            firstName ? `Imagem de ${firstName}` : 'Imagem do usuário'
          }
          source={{ uri: avatarUrl }}
          style={styles.userAvatar}
          testID="profile-image"
        />
      ) : (
        <View
          accessibilityLabel={
            firstName ? `Avatar de ${firstName}` : 'Avatar do usuário'
          }
          style={[styles.userAvatar, { backgroundColor: colors.primarySubtle }]}
          testID="profile-image-fallback"
        >
          <Text color="primary" variant="label">
            {initial}
          </Text>
        </View>
      )}
      <View style={styles.greeting}>
        <Text numberOfLines={1} variant="cardTitle">
          {firstName ? `Olá, ${firstName}` : 'Olá'}
        </Text>
        <Text color="textSecondary" variant="caption">
          Vamos organizar seu negócio?
        </Text>
      </View>
      <IconButton
        accessibilityLabel="Abrir configurações"
        icon={
          <MaterialCommunityIcons
            color={colors.textPrimary}
            name="cog-outline"
            size={22}
          />
        }
        onPress={() => router.push('/settings')}
      />
    </View>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} variant="cardTitle">
        {title}
      </Text>
      {badge ? <Badge label={badge} /> : null}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      accessible
      accessibilityLabel={
        disabled ? `${label}, indisponível nesta versão` : label
      }
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: colors.surfaceMuted }]}
    >
      <MaterialCommunityIcons color={colors.primary} name={icon} size={22} />
      <Text
        align="center"
        color="textSecondary"
        style={styles.quickActionLabel}
        variant="label"
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function QuickActionsGrid() {
  return (
    <View style={styles.section}>
      <SectionHeader badge="Em breve" title="Ações rápidas" />
      <View style={styles.quickGrid}>
        <QuickAction
          icon="account-plus-outline"
          label="Novo cliente"
          onPress={() => router.push('/clients/new')}
        />
        <QuickAction
          disabled
          icon="briefcase-plus-outline"
          label="Novo serviço"
        />
        <QuickAction
          disabled
          icon="file-document-edit-outline"
          label="Criar orçamento"
        />
      </View>
    </View>
  );
}

function SetupItem({
  id,
  label,
  targetSection,
  targetField,
  accessibilityHint,
}: {
  id: 'profile' | 'contact';
  label: string;
  targetSection: 'personal' | 'professional';
  targetField: 'first-required' | 'phone' | 'email';
  accessibilityHint: string;
}) {
  const { colors } = useTheme();

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      onPress={() =>
        router.push({
          pathname: '/profile',
          params: { section: targetSection, field: targetField },
        })
      }
      style={styles.setupItem}
      testID={`setup-${id}-pending`}
    >
      <View
        style={[styles.setupIcon, { backgroundColor: colors.backgroundSubtle }]}
      >
        <MaterialCommunityIcons
          accessibilityLabel="Pendente"
          color={colors.textSecondary}
          name="plus"
          size={18}
          testID={`setup-${id}-status-icon`}
        />
      </View>
      <Text style={styles.setupLabel} variant="label">
        {label}
      </Text>
      <View style={styles.setupAction}>
        <Text color="primary" variant="caption">
          Completar
        </Text>
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={20}
          testID={`setup-${id}-chevron`}
        />
      </View>
    </AnimatedPressable>
  );
}

interface SetupItemConfig {
  id: 'profile' | 'contact';
  label: string;
  targetSection: 'personal' | 'professional';
  targetField: 'first-required' | 'phone' | 'email';
  accessibilityHint: string;
}

function SetupChecklist({
  profileConfigured,
  hasContact,
  contactPendingField,
}: Pick<
  HomeDashboardProps,
  'profileConfigured' | 'hasContact' | 'contactPendingField'
>) {
  const { colors } = useTheme();
  const emailPending = contactPendingField === 'email';
  const setupItems: (SetupItemConfig & { completed: boolean })[] = [
    {
      accessibilityHint:
        'Abre os dados profissionais no primeiro campo obrigatório pendente.',
      completed: profileConfigured,
      id: 'profile',
      label: 'Completar perfil profissional',
      targetField: 'first-required',
      targetSection: 'professional',
    },
    {
      accessibilityHint: emailPending
        ? 'Abre os dados profissionais no campo de e-mail.'
        : 'Abre os dados pessoais no campo de telefone.',
      completed: hasContact,
      id: 'contact',
      label: emailPending ? 'Adicionar e-mail' : 'Adicionar telefone',
      targetField: emailPending ? 'email' : 'phone',
      targetSection: emailPending ? 'professional' : 'personal',
    },
  ];
  const pendingSetupItems = setupItems.filter((item) => !item.completed);

  if (pendingSetupItems.length === 0) return null;

  return (
    <FadeInView style={styles.section} testID="setup-section">
      <SectionHeader title="Prepare seu espaço" />
      <View
        style={[styles.setupList, { backgroundColor: colors.surface }]}
        testID="setup-list"
      >
        {pendingSetupItems.map((item, index) => (
          <View key={item.id}>
            {index > 0 ? (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            ) : null}
            <SetupItem
              accessibilityHint={item.accessibilityHint}
              id={item.id}
              label={item.label}
              targetField={item.targetField}
              targetSection={item.targetSection}
            />
          </View>
        ))}
      </View>
    </FadeInView>
  );
}

export function HomeDashboard({
  firstName,
  avatarUrl,
  profileConfigured,
  hasContact,
  contactPendingField,
  activeClientCount,
  clientCountLoading,
  clientCountError,
}: HomeDashboardProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView style={styles.content} testID="home-dashboard-content">
          <AppHeader avatarUrl={avatarUrl} firstName={firstName} />
          <QuickActionsGrid />
          <View style={styles.section}>
            <SectionHeader title="Clientes" />
            <AnimatedPressable
              accessibilityLabel="Abrir clientes"
              accessibilityRole="button"
              onPress={() => router.push('/clients')}
              style={[
                styles.clientSummary,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.clientSummaryCopy}>
                <Text color="textSecondary" variant="caption">
                  Clientes ativos
                </Text>
                <Text variant="sectionTitle">
                  {clientCountLoading
                    ? '...'
                    : clientCountError
                      ? 'Indisponível'
                      : String(activeClientCount ?? 0)}
                </Text>
              </View>
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="chevron-right"
                size={22}
              />
            </AnimatedPressable>
          </View>
          <SetupChecklist
            contactPendingField={contactPendingField}
            hasContact={hasContact}
            profileConfigured={profileConfigured}
          />
        </FadeInView>
      </ScrollView>
      <ProtectedBottomNavigation selected="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.md },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: spacing[5],
    paddingTop: spacing.md,
    width: '100%',
  },
  appHeader: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  userAvatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  greeting: { flex: 1, gap: 2, paddingHorizontal: spacing[3] },
  section: { gap: spacing[3] },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: { flex: 1, minWidth: 0 },
  quickGrid: { flexDirection: 'row', gap: spacing[3] },
  quickAction: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flex: 1,
    flexBasis: 0,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 104,
    minWidth: 0,
    padding: spacing.sm,
    position: 'relative',
  },
  quickActionLabel: { width: '100%' },
  setupList: {
    borderRadius: radii.medium,
    overflow: 'hidden',
  },
  setupItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 60,
    paddingHorizontal: spacing[4],
  },
  setupIcon: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  setupLabel: { flex: 1, minWidth: 0 },
  setupAction: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  clientSummary: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flexDirection: 'row',
    minHeight: 72,
    padding: spacing.md,
  },
  clientSummaryCopy: { flex: 1, gap: spacing.xs },
});
