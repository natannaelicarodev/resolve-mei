import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { radii, spacing, useTheme } from '@/theme';
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
  const { user } = useAuth();
  const { colors } = useTheme();
  const userId = user?.id ?? '';
  const query = useService(userId, businessId, serviceId);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const queryClient = useQueryClient();
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
  const header = (
    <ProtectedPageHeader
      alwaysUseBackFallback
      back
      backFallback="/services"
      dismissToBackFallback
      title="Detalhes do serviço"
    />
  );
  if (query.isLoading)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
        <Text accessibilityLiveRegion="polite">Carregando serviço...</Text>
      </Screen>
    );
  if (query.isError)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
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
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
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
  const deactivating = nextStatus === 'inactive';
  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      safeAreaEdges={['top', 'bottom']}
    >
      {header}
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.heroIcon, { backgroundColor: colors.primarySubtle }]}
        >
          <Icon color="primary" name="service" />
        </View>
        <View style={styles.headingCopy}>
          <Text variant="cardTitle">{service.name}</Text>
          <Text color="textSecondary" variant="caption">
            Serviço cadastrado
          </Text>
        </View>
        <Badge
          label={service.status === 'active' ? 'Ativo' : 'Inativo'}
          variant={service.status === 'active' ? 'success' : 'neutral'}
        />
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          INFORMAÇÕES GERAIS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Icon color="primary" name="money" size="small" />
              <View>
                <Text color="textMuted" variant="caption">
                  Preço
                </Text>
                <Text variant="label">
                  {formatPriceCents(service.price_cents)}
                </Text>
              </View>
            </View>
            {duration ? (
              <View style={styles.metric}>
                <Icon color="primary" name="duration" size="small" />
                <View>
                  <Text color="textMuted" variant="caption">
                    Duração
                  </Text>
                  <Text variant="label">{duration}</Text>
                </View>
              </View>
            ) : null}
          </View>
          {service.description ? (
            <View
              style={[styles.description, { borderTopColor: colors.border }]}
            >
              <Text color="textMuted" variant="caption">
                Descrição
              </Text>
              <Text>{service.description}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {status.isError ? (
        <InlineFeedback
          message="Não foi possível alterar o status do serviço."
          variant="error"
        />
      ) : null}
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          AÇÕES
        </Text>
        <Button
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
          onPress={() => setConfirmingStatus(true)}
          variant={service.status === 'active' ? 'danger' : 'secondary'}
        />
      </View>
      <ConfirmationDialog
        confirmLabel={deactivating ? 'Inativar serviço' : 'Ativar serviço'}
        description={`Confirma a alteração de status de ${service.name}?`}
        destructive={deactivating}
        loading={status.isPending}
        onCancel={() => setConfirmingStatus(false)}
        onConfirm={() => {
          setConfirmingStatus(false);
          status.mutate(nextStatus);
        }}
        title={`${deactivating ? 'Inativar' : 'Ativar'} serviço`}
        visible={confirmingStatus}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  hero: {
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headingCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: { borderRadius: radii.medium, borderWidth: 1, padding: spacing.md },
  metricRow: { flexDirection: 'row', gap: spacing.lg },
  metric: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  description: {
    borderTopWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
});
