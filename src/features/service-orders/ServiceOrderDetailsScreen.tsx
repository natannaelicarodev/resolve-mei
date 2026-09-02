import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Dialog,
  InlineFeedback,
  Input,
  Screen,
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { ServiceOrderAgendaSection } from '@/features/agenda/ServiceOrderAgendaSection';
import { ServiceEvidenceSection } from '@/features/evidence/ServiceEvidenceSection';
import { evidenceKey } from '@/features/evidence/hooks';
import { formatQuoteNumber } from '@/features/quotes/domain';
import { quotesQueryKey } from '@/features/quotes/hooks';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { useQuoteReceivable } from '@/features/receivables/hooks';
import { FadeInView } from '@/components/motion';
import { motion, spacing, useTheme } from '@/theme';
import { addServiceOrderNote, transitionServiceOrder } from './api';
import {
  isActiveServiceOrder,
  serviceOrderErrorMessage,
  serviceOrderEventLabels,
  serviceOrderStatusLabels,
  type ServiceOrderStatus,
} from './domain';
import { serviceOrdersQueryKey, useServiceOrder } from './hooks';

function formatMoment(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function ServiceOrderDetailsScreen({
  userId,
  businessId,
  orderId,
}: {
  userId: string;
  businessId: string;
  orderId: string;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const query = useServiceOrder(userId, businessId, orderId);
  const receivableQuery = useQuoteReceivable(
    userId,
    businessId,
    query.data?.quote.id ?? '',
    query.data?.quote.status === 'approved',
  );
  const [note, setNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelVisible, setCancelVisible] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenVisible, setReopenVisible] = useState(false);
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: serviceOrdersQueryKey(userId, businessId),
      }),
      queryClient.invalidateQueries({
        queryKey: quotesQueryKey(userId, businessId),
      }),
      queryClient.invalidateQueries({
        queryKey: evidenceKey(userId, businessId, orderId),
      }),
    ]);
  const transition = useMutation({
    mutationFn: ({
      expected,
      next,
      reason,
    }: {
      expected: ServiceOrderStatus;
      next: ServiceOrderStatus;
      reason?: string;
    }) => transitionServiceOrder(businessId, orderId, expected, next, reason),
    onSuccess: () => {
      setCancelVisible(false);
      setCancelReason('');
      setReopenVisible(false);
      setReopenReason('');
      void invalidate();
    },
  });
  const noteMutation = useMutation({
    mutationFn: (value: string) =>
      addServiceOrderNote(businessId, orderId, value),
    onSuccess: () => {
      setNote('');
      void invalidate();
    },
  });
  const header = (
    <ProtectedPageHeader
      alwaysUseBackFallback
      back
      backFallback="/quotes"
      dismissToBackFallback
      title="Execução do serviço"
    />
  );
  if (query.isLoading)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
        <SkeletonBlock label="Carregando execução" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
        <InlineFeedback
          message="Não foi possível carregar esta execução."
          variant="error"
        />
        <Button
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </Screen>
    );
  const { order, quote, events } = query.data;
  const active = isActiveServiceOrder(order.status);
  const busy = transition.isPending || noteMutation.isPending;
  const error = transition.error ?? noteMutation.error;
  return (
    <Screen
      contentContainerStyle={styles.content}
      safeAreaEdges={['top', 'bottom']}
    >
      {header}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.card} variant="summary">
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text color="textSecondary" variant="caption">
                ORDEM DE SERVIÇO
              </Text>
              <Text variant="sectionTitle">{quote.client_name_snapshot}</Text>
            </View>
            <Badge
              label={serviceOrderStatusLabels[order.status]}
              variant={
                order.status === 'completed'
                  ? 'success'
                  : order.status === 'canceled'
                    ? 'danger'
                    : order.status === 'paused'
                      ? 'warning'
                      : 'info'
              }
            />
          </View>
          <Text color="textSecondary" variant="caption">
            {order.started_at
              ? `Iniciada em ${formatMoment(order.started_at)}`
              : `Ordem criada em ${formatMoment(order.created_at)} · execução ainda não iniciada`}
          </Text>
          <Button
            label={`Ver orçamento #${formatQuoteNumber(quote.quote_number)}`}
            onPress={() =>
              router.push({
                pathname: '/quotes/[id]',
                params: { id: quote.id },
              })
            }
            variant="secondary"
          />
        </Card>
      </FadeInView>

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          ITENS CONTRATADOS
        </Text>
        {quote.items.map((item) => (
          <Card key={item.id}>
            <View style={styles.copy}>
              <Text variant="label">{item.name_snapshot}</Text>
              {item.description_snapshot ? (
                <Text color="textSecondary" variant="caption">
                  {item.description_snapshot}
                </Text>
              ) : null}
              <Text color="textSecondary" variant="caption">
                Quantidade: {item.quantity}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {receivableQuery.data ? (
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            SALDO DO ORÇAMENTO
          </Text>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text color="textSecondary" variant="caption">
                  Somente leitura
                </Text>
                <Text variant="sectionTitle">
                  {formatBigIntMoney(receivableQuery.data.balanceCents)}
                </Text>
              </View>
              <Badge
                label={receivableQuery.data.settled ? 'Quitado' : 'Em aberto'}
                variant={receivableQuery.data.settled ? 'success' : 'warning'}
              />
            </View>
            <Text color="textSecondary" variant="caption">
              Registre recebimentos somente nos detalhes do orçamento.
            </Text>
          </Card>
        </View>
      ) : null}

      <ServiceOrderAgendaSection
        businessId={businessId}
        orderId={orderId}
        orderStatus={order.status}
        userId={userId}
      />

      <ServiceEvidenceSection
        businessId={businessId}
        orderId={orderId}
        orderStatus={order.status}
        userId={userId}
      />

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          HISTÓRICO
        </Text>
        {/* Linha de tempo em vez de linhas separadas por borda: o histórico é
            uma sequência, e o traço contínuo com marcador comunica isso pelo
            mesmo espaço que os divisores ocupavam. */}
        <Card style={styles.timelineCard}>
          {events.map((event, index) => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                {/* Os eventos vêm em ordem crescente, então o estado atual da
                    ordem é o último — é ele que ganha destaque. */}
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor:
                        index === events.length - 1
                          ? colors.primary
                          : colors.borderStrong,
                    },
                  ]}
                />
                {index < events.length - 1 ? (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: colors.borderSubtle },
                    ]}
                  />
                ) : null}
              </View>
              <View
                style={[
                  styles.timelineCopy,
                  index === events.length - 1 && styles.timelineCopyLast,
                ]}
              >
                <Text variant="label">
                  {serviceOrderEventLabels[event.event_type]}
                </Text>
                <Text color="textMuted" variant="caption">
                  {formatMoment(event.created_at)}
                </Text>
                {event.note ? (
                  <Text color="textSecondary">{event.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </Card>
      </View>

      {active ? (
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            REGISTRAR OBSERVAÇÃO
          </Text>
          <Input
            label="Observação"
            maxLength={2000}
            multiline
            numberOfLines={4}
            onChangeText={setNote}
            placeholder="Descreva o andamento do serviço"
            showCounter
            style={styles.textArea}
            value={note}
          />
          <Button
            disabled={!note.trim() || busy}
            label="Adicionar ao histórico"
            loading={noteMutation.isPending}
            onPress={() => noteMutation.mutate(note)}
            variant="secondary"
          />
        </View>
      ) : null}

      {error ? (
        <InlineFeedback
          message={serviceOrderErrorMessage(error)}
          variant="error"
        />
      ) : null}
      {order.status === 'pending' || active ? (
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            AÇÕES DA EXECUÇÃO
          </Text>
          {order.status === 'pending' ? (
            <Button
              disabled={busy}
              label="Iniciar execução"
              onPress={() =>
                transition.mutate({
                  expected: order.status,
                  next: 'in_progress',
                })
              }
            />
          ) : order.status === 'in_progress' ? (
            <Button
              disabled={busy}
              label="Pausar serviço"
              onPress={() =>
                transition.mutate({ expected: order.status, next: 'paused' })
              }
              variant="secondary"
            />
          ) : (
            <Button
              disabled={busy}
              label="Retomar serviço"
              onPress={() =>
                transition.mutate({
                  expected: order.status,
                  next: 'in_progress',
                })
              }
            />
          )}
          {active ? (
            <Button
              disabled={busy}
              label="Concluir serviço"
              onPress={() =>
                transition.mutate({ expected: order.status, next: 'completed' })
              }
            />
          ) : null}
          <Button
            disabled={busy}
            label="Cancelar execução"
            onPress={() => setCancelVisible(true)}
            variant="danger"
          />
        </View>
      ) : order.status === 'completed' ? (
        <View style={styles.section}>
          <InlineFeedback
            message="O serviço foi concluído. Reabra apenas quando houver um ajuste na mesma entrega."
            variant="success"
          />
          <Button
            disabled={busy}
            label="Reabrir ordem"
            onPress={() => setReopenVisible(true)}
            variant="secondary"
          />
        </View>
      ) : (
        <InlineFeedback
          message="Esta execução está encerrada e seu histórico permanece somente para consulta."
          variant="info"
        />
      )}

      <Dialog
        description="O cancelamento encerra esta tentativa e não pode ser desfeito. O motivo ficará no histórico."
        onClose={() => !transition.isPending && setCancelVisible(false)}
        title="Cancelar execução?"
        visible={cancelVisible}
      >
        <Input
          error={
            cancelReason.length > 0 && cancelReason.trim().length < 2
              ? 'Informe pelo menos 2 caracteres.'
              : undefined
          }
          label="Motivo do cancelamento"
          maxLength={500}
          multiline
          onChangeText={setCancelReason}
          showCounter
          value={cancelReason}
        />
        <View style={styles.dialogActions}>
          <Button
            disabled={transition.isPending}
            label="Voltar"
            onPress={() => setCancelVisible(false)}
            variant="ghost"
          />
          <Button
            disabled={cancelReason.trim().length < 2}
            label="Confirmar cancelamento"
            loading={transition.isPending}
            onPress={() =>
              transition.mutate({
                expected: order.status,
                next: 'canceled',
                reason: cancelReason,
              })
            }
            variant="danger"
          />
        </View>
      </Dialog>
      <Dialog
        description="A ordem voltará para execução. A conclusão anterior continuará registrada no histórico."
        onClose={() => !transition.isPending && setReopenVisible(false)}
        title="Reabrir ordem?"
        visible={reopenVisible}
      >
        <Input
          error={
            reopenReason.length > 0 && reopenReason.trim().length < 2
              ? 'Informe pelo menos 2 caracteres.'
              : undefined
          }
          label="Motivo da reabertura"
          maxLength={500}
          multiline
          onChangeText={setReopenReason}
          showCounter
          value={reopenReason}
        />
        <View style={styles.dialogActions}>
          <Button
            disabled={transition.isPending}
            label="Voltar"
            onPress={() => setReopenVisible(false)}
            variant="ghost"
          />
          <Button
            disabled={reopenReason.trim().length < 2}
            label="Confirmar reabertura"
            loading={transition.isPending}
            onPress={() =>
              transition.mutate({
                expected: order.status,
                next: 'in_progress',
                reason: reopenReason,
              })
            }
          />
        </View>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: { gap: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  // O Card separa filhos por gap, o que abriria um vão que nenhum traço
  // cruza. Aqui o espaçamento é do próprio item, para o trilho ficar contínuo.
  timelineCard: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  // O trilho tem largura fixa para os marcadores alinharem em coluna, e o
  // traço se estica para preencher o que a cópia ao lado ocupar.
  timelineRail: { alignItems: 'center', width: 10 },
  // Centrado na primeira linha do título: (lineHeight 16 − 10) / 2.
  timelineDot: { borderRadius: 5, height: 10, marginTop: 3, width: 10 },
  timelineLine: { flex: 1, width: 2 },
  // O respiro entre eventos vem daqui, não do gap do Card: assim o trilho ao
  // lado atravessa o espaço em vez de ser cortado por ele.
  timelineCopy: { flex: 1, gap: 2, paddingBottom: spacing.lg },
  timelineCopyLast: { paddingBottom: 0 },
  textArea: {
    minHeight: 112,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
