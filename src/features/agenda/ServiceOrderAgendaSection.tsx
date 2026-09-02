import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Dialog,
  InlineFeedback,
  Input,
  Text,
} from '@/components/ui';
import { DateInput } from '@/components/ui/patterns';
import {
  getTodayDatabaseDate,
  isValidCalendarDate,
  maskDateInput,
  parseDateForDatabase,
} from '@/features/quotes/date';
import type { ServiceOrderStatus } from '@/features/service-orders/domain';
import { spacing } from '@/theme';
import {
  agendaErrorMessage,
  appointmentStatusLabels,
  formatAppointmentDate,
  maskTimeInput,
  parseTimeForDatabase,
} from './domain';
import { useAppointmentMutations, useOrderAppointments } from './hooks';

export function ServiceOrderAgendaSection({
  userId,
  businessId,
  orderId,
  orderStatus,
}: {
  userId: string;
  businessId: string;
  orderId: string;
  orderStatus: ServiceOrderStatus;
}) {
  const query = useOrderAppointments(userId, businessId, orderId);
  const mutations = useAppointmentMutations(userId, businessId);
  const [formMode, setFormMode] = useState<'create' | 'reschedule' | null>(
    null,
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const appointments = query.data ?? [];
  const active = appointments.find((item) => item.status === 'scheduled');
  const history = appointments.filter((item) => item.status !== 'scheduled');
  const terminal = orderStatus === 'completed' || orderStatus === 'canceled';
  const busy =
    mutations.create.isPending ||
    mutations.reschedule.isPending ||
    mutations.resolve.isPending;
  const error =
    mutations.create.error ??
    mutations.reschedule.error ??
    mutations.resolve.error;
  const parsedDate = parseDateForDatabase(date);
  const parsedTime = parseTimeForDatabase(time);
  const formValid =
    isValidCalendarDate(date) &&
    Boolean(parsedDate && parsedDate >= getTodayDatabaseDate()) &&
    parsedTime !== undefined;

  const resetForm = () => {
    setFormMode(null);
    setDate('');
    setTime('');
    setNote('');
  };
  const submit = () => {
    if (!formValid || !parsedDate || parsedTime === undefined) return;
    const common = {
      businessId,
      scheduledOn: parsedDate,
      scheduledTime: parsedTime,
      note,
    };
    if (formMode === 'reschedule' && active) {
      mutations.reschedule.mutate(
        { ...common, appointmentId: active.id },
        { onSuccess: resetForm },
      );
    } else {
      mutations.create.mutate({ ...common, orderId }, { onSuccess: resetForm });
    }
  };

  return (
    <View style={styles.section}>
      <Text color="primary" style={styles.sectionTitle} variant="caption">
        AGENDAMENTO
      </Text>
      {query.isError ? (
        <InlineFeedback
          message="Não foi possível carregar os agendamentos."
          variant="error"
        />
      ) : (
        <Card style={styles.card}>
          {active ? (
            <>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text variant="sectionTitle">
                    {formatAppointmentDate(
                      active.scheduled_on,
                      active.scheduled_time,
                    )}
                  </Text>
                  {active.note ? (
                    <Text color="textSecondary">{active.note}</Text>
                  ) : null}
                </View>
                <Badge
                  label={
                    active.scheduled_on < getTodayDatabaseDate()
                      ? 'Atrasada'
                      : 'Agendada'
                  }
                  variant={
                    active.scheduled_on < getTodayDatabaseDate()
                      ? 'warning'
                      : 'info'
                  }
                />
              </View>
              <Button
                disabled={busy || terminal}
                label="Remarcar"
                onPress={() => setFormMode('reschedule')}
                variant="secondary"
              />
              <Button
                disabled={busy}
                label="Marcar como realizada"
                loading={mutations.resolve.isPending}
                onPress={() =>
                  mutations.resolve.mutate({
                    businessId,
                    appointmentId: active.id,
                    status: 'completed',
                  })
                }
              />
              <Button
                disabled={busy}
                label="Cancelar agendamento"
                onPress={() => setCancelVisible(true)}
                variant="danger"
              />
            </>
          ) : (
            <>
              <Text color="textSecondary">
                {terminal
                  ? 'Esta ordem encerrada não pode receber um novo agendamento.'
                  : 'Nenhuma visita agendada para esta ordem.'}
              </Text>
              {!terminal ? (
                <Button
                  disabled={busy}
                  label="Agendar visita"
                  onPress={() => setFormMode('create')}
                />
              ) : null}
            </>
          )}
          {history.length ? (
            <View style={styles.history}>
              <Text color="textSecondary" variant="label">
                Histórico de visitas
              </Text>
              {history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text variant="label">
                    {appointmentStatusLabels[item.status]}
                  </Text>
                  <Text color="textMuted" variant="caption">
                    {formatAppointmentDate(
                      item.scheduled_on,
                      item.scheduled_time,
                    )}
                  </Text>
                  {item.resolution_note ? (
                    <Text color="textSecondary" variant="caption">
                      {item.resolution_note}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      )}
      {error ? (
        <InlineFeedback message={agendaErrorMessage(error)} variant="error" />
      ) : null}

      <Dialog
        description="A data deve ser hoje ou futura. O horário é opcional."
        onClose={() => !busy && resetForm()}
        title={formMode === 'reschedule' ? 'Remarcar visita' : 'Agendar visita'}
        visible={formMode !== null}
      >
        <DateInput
          error={
            date.length === 10 &&
            (!parsedDate || parsedDate < getTodayDatabaseDate())
              ? 'Escolha hoje ou uma data futura.'
              : undefined
          }
          label="Data"
          onChangeText={(value) => setDate(maskDateInput(value))}
          value={date}
        />
        <Input
          error={
            time.length === 5 && parsedTime === undefined
              ? 'Informe um horário válido.'
              : undefined
          }
          keyboardType="number-pad"
          label="Horário (opcional)"
          onChangeText={(value) => setTime(maskTimeInput(value))}
          placeholder="HH:MM"
          value={time}
        />
        <Input
          label="Observação (opcional)"
          maxLength={500}
          onChangeText={setNote}
          showCounter
          value={note}
        />
        <View style={styles.actions}>
          <Button
            disabled={busy}
            label="Voltar"
            onPress={resetForm}
            variant="ghost"
          />
          <Button
            disabled={!formValid || busy}
            label={
              formMode === 'reschedule'
                ? 'Confirmar remarcação'
                : 'Confirmar agendamento'
            }
            loading={busy}
            onPress={submit}
          />
        </View>
      </Dialog>

      <Dialog
        description="A ordem de serviço continuará no mesmo estado."
        onClose={() => !busy && setCancelVisible(false)}
        title="Cancelar agendamento?"
        visible={cancelVisible}
      >
        <Input
          label="Motivo (opcional)"
          maxLength={500}
          onChangeText={setCancelNote}
          showCounter
          value={cancelNote}
        />
        <View style={styles.actions}>
          <Button
            disabled={busy}
            label="Voltar"
            onPress={() => setCancelVisible(false)}
            variant="ghost"
          />
          <Button
            label="Confirmar cancelamento"
            loading={mutations.resolve.isPending}
            onPress={() =>
              active &&
              mutations.resolve.mutate(
                {
                  businessId,
                  appointmentId: active.id,
                  status: 'canceled',
                  note: cancelNote,
                },
                {
                  onSuccess: () => {
                    setCancelVisible(false);
                    setCancelNote('');
                  },
                },
              )
            }
            variant="danger"
          />
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: {
    gap: spacing.md,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  history: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  historyItem: { gap: spacing.xs },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
