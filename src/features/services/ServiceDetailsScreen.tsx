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
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { FadeInView } from '@/components/motion';
import { motion, spacing } from '@/theme';
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
        <SkeletonBlock label="Carregando serviço" />
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
  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      {header}
      {/* O preço é a informação central de um serviço, e como `Detail` genérico
          pesava igual à descrição. Aqui ele ganha a escala monetária. */}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.summary} variant="summary">
          <View style={styles.heading}>
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
            <Text color="textSecondary" variant="bodySmall">
              Duração estimada: {duration}
            </Text>
          ) : null}
        </Card>
      </FadeInView>
      {/* A duração subiu para o resumo; aqui resta o que não cabe numa linha. */}
      {service.description ? (
        <Card>
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
        onPress={() => setStatusConfirmationVisible(true)}
        variant={service.status === 'active' ? 'danger' : 'secondary'}
      />
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
  summary: { gap: spacing.sm },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  detail: { gap: 2 },
});
