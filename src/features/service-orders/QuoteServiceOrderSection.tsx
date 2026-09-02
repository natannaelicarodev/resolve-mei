import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, Card, InlineFeedback, Text } from '@/components/ui';
import { quotesQueryKey } from '@/features/quotes/hooks';
import { spacing } from '@/theme';
import { createServiceOrder } from './api';
import { serviceOrderErrorMessage, serviceOrderStatusLabels } from './domain';
import { serviceOrdersQueryKey, useServiceOrderForQuote } from './hooks';

export function QuoteServiceOrderSection({
  userId,
  businessId,
  quoteId,
  quoteStatus,
}: {
  userId: string;
  businessId: string;
  quoteId: string;
  quoteStatus: string;
}) {
  const queryClient = useQueryClient();
  const query = useServiceOrderForQuote(userId, businessId, quoteId);
  const mutation = useMutation({
    mutationFn: () => createServiceOrder(businessId, quoteId),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({
        queryKey: serviceOrdersQueryKey(userId, businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: quotesQueryKey(userId, businessId),
      });
      router.push({
        pathname: '/service-orders/[id]',
        params: { id: order.id },
      });
    },
  });
  if (quoteStatus !== 'approved' && !query.data) return null;
  return (
    <View style={styles.section}>
      <Text color="primary" style={styles.title} variant="caption">
        EXECUÇÃO DO SERVIÇO
      </Text>
      <Card style={styles.card}>
        {query.isLoading ? (
          <Text color="textSecondary">Consultando execução...</Text>
        ) : null}
        {query.isError ? (
          <>
            <InlineFeedback
              message="Não foi possível consultar a execução."
              variant="error"
            />
            <Button
              label="Tentar novamente"
              onPress={() => void query.refetch()}
              variant="secondary"
            />
          </>
        ) : null}
        {query.data ? (
          <>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text variant="label">Ordem de serviço</Text>
                <Text color="textSecondary" variant="caption">
                  Criada a partir deste orçamento
                </Text>
              </View>
              <Badge
                label={serviceOrderStatusLabels[query.data.status]}
                variant={
                  query.data.status === 'completed'
                    ? 'success'
                    : query.data.status === 'canceled'
                      ? 'danger'
                      : query.data.status === 'paused'
                        ? 'warning'
                        : 'info'
                }
              />
            </View>
            <Button
              label="Ver execução"
              onPress={() =>
                router.push({
                  pathname: '/service-orders/[id]',
                  params: { id: query.data!.id },
                })
              }
              variant="secondary"
            />
            {query.data.status === 'canceled' ? (
              <Button
                label="Criar nova ordem"
                loading={mutation.isPending}
                onPress={() => mutation.mutate()}
              />
            ) : null}
          </>
        ) : quoteStatus === 'approved' && !query.isLoading && !query.isError ? (
          <>
            <Text color="textSecondary">
              Crie a ordem agora e inicie a execução somente quando o trabalho
              começar.
            </Text>
            <Button
              label="Criar ordem de serviço"
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
            />
          </>
        ) : null}
        {mutation.isError ? (
          <InlineFeedback
            message={serviceOrderErrorMessage(mutation.error)}
            variant="error"
          />
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: {
    gap: spacing.md,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
});
