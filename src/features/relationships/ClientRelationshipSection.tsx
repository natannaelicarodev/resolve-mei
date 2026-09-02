import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  InlineFeedback,
  InlineLoading,
  Input,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { serviceOrderStatusLabels } from '@/features/service-orders/domain';
import { spacing } from '@/theme';
import {
  expectedReturnOptions,
  expectedReturnValue,
  relationshipOrderCompletionLabel,
  type RelationshipOrder,
} from './domain';
import { useRelationshipMutations, useRelationshipOverview } from './hooks';
import { MessageDialog } from './MessageDialog';

export function ClientRelationshipSection({
  userId,
  businessId,
  businessName,
  client,
}: {
  userId: string;
  businessId: string;
  businessName: string;
  client: { id: string; name: string; phone: string | null };
}) {
  const query = useRelationshipOverview(userId, businessId, client.id);
  const mutations = useRelationshipMutations(userId, businessId);
  const [recurringOverride, setRecurring] = useState<boolean | null>(null);
  const [priorityOverride, setPriority] = useState<boolean | null>(null);
  const [noteOrder, setNoteOrder] = useState<RelationshipOrder>();
  const [satisfaction, setSatisfaction] = useState('');
  const [observation, setObservation] = useState('');
  const [message, setMessage] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnValue, setReturnValue] = useState('default');
  if (query.isLoading)
    return <InlineLoading label="Carregando relacionamento" />;
  if (query.isError || !query.data)
    return (
      <InlineFeedback
        variant="error"
        message="Não foi possível carregar o histórico do cliente."
      />
    );
  const data = query.data;
  const recurring = recurringOverride ?? data.profile.recurring;
  const priority = priorityOverride ?? data.profile.priority;
  const openNote = (order: RelationshipOrder) => {
    setNoteOrder(order);
    setSatisfaction(order.satisfaction?.toString() ?? '');
    setObservation(order.observation ?? '');
  };
  const openReturnInterval = () => {
    setReturnValue(data.profile.expectedReturnDays?.toString() ?? 'default');
    setReturnDialog(true);
  };
  return (
    <View style={styles.section}>
      <Card>
        <Text variant="cardTitle">Relacionamento</Text>
        <Checkbox
          label="Recorrente"
          checked={recurring}
          onChange={setRecurring}
        />
        <Checkbox
          label="Prioritário"
          checked={priority}
          onChange={setPriority}
        />
        <Button
          label="Salvar marcações"
          size="small"
          loading={mutations.profile.isPending}
          onPress={() =>
            mutations.profile.mutate({
              clientId: client.id,
              recurring,
              priority,
            })
          }
        />
      </Card>
      <Card>
        <Text variant="cardTitle">Histórico consolidado</Text>
        {/* Recebido e último atendimento subiram para o resumo do topo da
            tela; repeti-los aqui só faria a rolagem dizer duas vezes. */}
        <Text color="textSecondary">
          Retorno esperado: a cada {data.profile.effectiveReturnDays} dias
          {data.profile.usesBusinessDefault ? ' · Padrão do negócio' : ''}
        </Text>
        <Button
          label="Alterar intervalo de retorno"
          size="small"
          variant="secondary"
          onPress={openReturnInterval}
        />
        <Text color="textSecondary">
          {data.quotes.length} orçamento(s) · {data.orders.length} ordem(ns)
        </Text>
        {data.lastCompletedAt ? (
          <Button
            label="Preparar mensagem"
            size="small"
            variant="secondary"
            onPress={() => setMessage(true)}
          />
        ) : null}
      </Card>
      {data.orders.map((order) => (
        <Card key={order.id}>
          <View style={styles.row}>
            <Text style={styles.grow}>
              Ordem · {serviceOrderStatusLabels[order.status]}
            </Text>
            {order.satisfaction ? (
              <Badge label={`${order.satisfaction}/5`} variant="success" />
            ) : null}
          </View>
          <Text color="textSecondary" variant="caption">
            {relationshipOrderCompletionLabel(order)}
          </Text>
          {order.lastCompletedAt ? (
            <>
              {order.observation ? <Text>{order.observation}</Text> : null}
              <Button
                label={order.noteUpdatedAt ? 'Editar nota' : 'Registrar nota'}
                size="small"
                variant="secondary"
                onPress={() => openNote(order)}
              />
            </>
          ) : null}
        </Card>
      ))}
      {mutations.profile.isError ||
      mutations.note.isError ||
      mutations.returnInterval.isError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível salvar o relacionamento."
        />
      ) : null}
      <Dialog
        visible={returnDialog}
        title="Intervalo esperado de retorno"
        description="Escolha o ciclo deste cliente ou mantenha o prazo padrão do negócio."
        onClose={() => setReturnDialog(false)}
      >
        <SegmentedControl
          scrollable
          label="Prazo"
          value={returnValue}
          options={[
            { label: 'Padrão do negócio', value: 'default' },
            ...expectedReturnOptions.map((days) => ({
              label: `${days} dias`,
              value: String(days),
            })),
          ]}
          onChange={setReturnValue}
        />
        <View style={styles.actions}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setReturnDialog(false)}
          />
          <Button
            label="Salvar"
            loading={mutations.returnInterval.isPending}
            onPress={() =>
              mutations.returnInterval.mutate(
                { clientId: client.id, days: expectedReturnValue(returnValue) },
                { onSuccess: () => setReturnDialog(false) },
              )
            }
          />
        </View>
      </Dialog>
      <Dialog
        visible={Boolean(noteOrder)}
        title="Nota de relacionamento"
        description="Uso interno. O cliente não verá esta informação."
        onClose={() => setNoteOrder(undefined)}
      >
        <SegmentedControl
          label="Satisfação"
          value={satisfaction}
          options={[1, 2, 3, 4, 5].map((x) => ({
            label: String(x),
            value: String(x),
          }))}
          onChange={setSatisfaction}
        />
        <Input
          label="Observação"
          multiline
          maxLength={2000}
          showCounter
          value={observation}
          onChangeText={setObservation}
          style={styles.note}
        />
        <View style={styles.actions}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setNoteOrder(undefined)}
          />
          <Button
            label="Salvar"
            disabled={!satisfaction && !observation.trim()}
            loading={mutations.note.isPending}
            onPress={() =>
              noteOrder &&
              mutations.note.mutate(
                {
                  orderId: noteOrder.id,
                  satisfaction: satisfaction ? Number(satisfaction) : null,
                  observation,
                },
                { onSuccess: () => setNoteOrder(undefined) },
              )
            }
          />
        </View>
      </Dialog>
      {data.lastCompletedAt ? (
        <MessageDialog
          visible={message}
          onClose={() => setMessage(false)}
          clientName={client.name}
          businessName={businessName}
          lastCompletedAt={data.lastCompletedAt}
          phone={client.phone}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  note: { minHeight: 100, textAlignVertical: 'top' },
});
