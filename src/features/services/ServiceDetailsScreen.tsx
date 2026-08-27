import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { spacing } from '@/theme';
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
    <Screen safeAreaEdges={['top', 'bottom']}>
      {header}
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text variant="sectionTitle">{service.name}</Text>
          <Text
            accessibilityLabel={`Preço: ${formatPriceCents(service.price_cents)}`}
            color="primary"
            variant="cardTitle"
          >
            {formatPriceCents(service.price_cents)}
          </Text>
        </View>
        <Badge
          label={service.status === 'active' ? 'Ativo' : 'Inativo'}
          variant={service.status === 'active' ? 'success' : 'neutral'}
        />
      </View>
      {service.description || duration ? (
        <Card>
          <Text variant="cardTitle">Informações</Text>
          {service.description ? <Text>{service.description}</Text> : null}
          {duration ? (
            <View style={styles.detail}>
              <Text color="textSecondary" variant="caption">
                Duração estimada
              </Text>
              <Text>{duration}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}
      {status.isError ? (
        <InlineFeedback
          message="Não foi possível alterar o status do serviço."
          variant="error"
        />
      ) : null}
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
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  detail: { gap: 2 },
});
