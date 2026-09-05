import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Icon,
  Screen,
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { FadeInView } from '@/components/motion';
import { motion, radii, spacing, useTheme } from '@/theme';
import { setServiceStatus } from './api';
import { formatDuration, formatPriceCents } from './format';
import { servicesQueryKey, useService } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

export function ServiceDetailsScreen({
  businessId,
  serviceId,
}: {
  businessId: string;
  serviceId: string;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const query = useService(userId, businessId, serviceId);
  const queryClient = useQueryClient();
  const [statusConfirmationVisible, setStatusConfirmationVisible] =
    useState(false);
  const status = useMutation({
    mutationFn: (next: 'active' | 'inactive') =>
      setServiceStatus(businessId, serviceId, next),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        [...servicesQueryKey(userId, businessId), 'detail', serviceId],
        saved,
      );
      void queryClient.invalidateQueries({
        queryKey: servicesQueryKey(userId, businessId),
      });
    },
  });
  const identityBand = (
    <View
      style={[
        styles.identityBand,
        { backgroundColor: colors.primary, width: windowWidth + 4 },
      ]}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/services"
        dismissToBackFallback
        foregroundColor={colors.textInverse}
        title="Detalhes do serviço"
      />
      <Text style={{ color: colors.textInverse }} variant="bodySmall">
        Preço, duração e informações para manter seu catálogo organizado.
      </Text>
    </View>
  );
  if (query.isLoading)
    return (
      <Screen
        background="subtle"
        contentContainerStyle={styles.content}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        style={{ backgroundColor: colors.primary }}
      >
        <StatusBar style="light" />
        {identityBand}
        <SkeletonBlock label="Carregando serviço" />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen
        background="subtle"
        contentContainerStyle={styles.content}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        style={{ backgroundColor: colors.primary }}
      >
        <StatusBar style="light" />
        {identityBand}
        <InlineFeedback
          message="Não foi possível carregar este serviço."
          variant="error"
        />
        <Button
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </Screen>
    );
  if (!query.data)
    return (
      <Screen
        background="subtle"
        contentContainerStyle={styles.content}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        style={{ backgroundColor: colors.primary }}
      >
        <StatusBar style="light" />
        {identityBand}
        <InlineFeedback
          message="Este serviço não foi encontrado."
          variant="info"
        />
        <Button
          label="Voltar para serviços"
          onPress={() => router.dismissTo('/services')}
          variant="secondary"
        />
      </Screen>
    );
  const service = query.data;
  const duration = formatDuration(service.estimated_duration_minutes);
  const nextStatus = service.status === 'active' ? 'inactive' : 'active';
  return (
    <Screen
      background="subtle"
      contentContainerStyle={[
        styles.content,
        { backgroundColor: colors.backgroundSubtle },
      ]}
      safeAreaColor={colors.primary}
      safeAreaEdges={['top', 'bottom']}
      style={{ backgroundColor: colors.primary }}
    >
      <StatusBar style="light" />
      {identityBand}
      {/* O preço é a informação central de um serviço, e como `Detail` genérico
          pesava igual à descrição. Aqui ele ganha a escala monetária. */}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.summary} variant="elevated">
          <View style={styles.heading}>
            <View
              style={[
                styles.serviceIcon,
                { backgroundColor: colors.primarySubtle },
              ]}
            >
              <Icon color="primary" name="service" size="large" />
            </View>
            <View style={styles.headingCopy}>
              <Text color="textSecondary" variant="caption">
                SERVIÇO
              </Text>
              <Text variant="sectionTitle">{service.name}</Text>
            </View>
            {service.status === 'active' ? null : (
              <Badge label="Inativo" variant="neutral" />
            )}
          </View>
          <Text
            accessibilityLabel={`Preço: ${formatPriceCents(service.price_cents)}`}
            color="primary"
            variant="financial"
          >
            {formatPriceCents(service.price_cents)}
          </Text>
          {duration ? (
            <View
              style={[
                styles.durationTile,
                { backgroundColor: colors.backgroundSubtle },
              ]}
            >
              <Icon color="primary" name="duration" size="small" />
              <View style={styles.durationCopy}>
                <Text color="textSecondary" variant="caption">
                  Duração estimada
                </Text>
                <Text variant="label">{duration}</Text>
              </View>
            </View>
          ) : null}
        </Card>
      </FadeInView>
      {/* A duração subiu para o resumo; aqui resta o que não cabe numa linha. */}
      {service.description ? (
        <Card variant="elevated">
          <Text variant="cardTitle">Descrição</Text>
          <Text>{service.description}</Text>
        </Card>
      ) : null}
      {status.isError ? (
        <InlineFeedback
          message="Não foi possível alterar o status do serviço."
          variant="error"
        />
      ) : null}
      <View style={styles.footerActions}>
        <Button
          haptic="selection"
          icon={<Icon name="edit" rawColor={colors.textInverse} size="small" />}
          label="Editar serviço"
          onPress={() =>
            router.push({
              pathname: '/services/[id]/edit',
              params: { id: service.id },
            })
          }
        />
        <Button
          disabled={status.isPending}
          label={
            service.status === 'active' ? 'Inativar serviço' : 'Ativar serviço'
          }
          loading={status.isPending}
          onPress={() => setStatusConfirmationVisible(true)}
          variant={service.status === 'active' ? 'danger' : 'secondary'}
        />
      </View>
      <ConfirmationDialog
        confirmLabel={nextStatus === 'inactive' ? 'Inativar' : 'Ativar'}
        description={`Confirma a alteração de status de ${service.name}?`}
        destructive={nextStatus === 'inactive'}
        loading={status.isPending}
        onCancel={() => setStatusConfirmationVisible(false)}
        onConfirm={() => {
          status.mutate(nextStatus);
          setStatusConfirmationVisible(false);
        }}
        title={`${nextStatus === 'inactive' ? 'Inativar' : 'Ativar'} serviço`}
        visible={statusConfirmationVisible}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: -spacing.md,
    minHeight: 168,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  summary: { gap: spacing.md, marginTop: -64 },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  serviceIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  durationTile: {
    alignItems: 'center',
    borderRadius: radii.control,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    padding: spacing.md,
  },
  durationCopy: { flex: 1, gap: 2, minWidth: 0 },
  footerActions: { gap: spacing.sm },
});
