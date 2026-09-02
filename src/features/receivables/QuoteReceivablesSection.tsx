import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  DateInput,
  Dialog,
  InlineFeedback,
  MoneyInput,
  Text,
  Input,
} from '@/components/ui';
import {
  formatDateForDisplay,
  getTodayDatabaseDate,
  isValidCalendarDate,
  maskDateInput,
  parseDateForDatabase,
} from '@/features/quotes/date';
import { agendaQueryKey } from '@/features/agenda/hooks';
import { spacing, useTheme } from '@/theme';
import { recordFinancialEntry, setReceivableDueOn } from './api';
import {
  formatBigIntMoney,
  maskBigIntMoneyInput,
  moneyInputToCentsText,
  paymentMethodLabels,
  paymentMethods,
  receivableErrorMessage,
  type FinancialEntryType,
  type PaymentMethod,
} from './domain';
import { receivablesQueryKey, useQuoteReceivable } from './hooks';

function formatMoment(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function QuoteReceivablesSection({
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
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const query = useQuoteReceivable(
    userId,
    businessId,
    quoteId,
    quoteStatus === 'approved',
  );
  const [entryType, setEntryType] = useState<FinancialEntryType | null>(null);
  const [amount, setAmount] = useState('R$ 0,00');
  const [occurredOn, setOccurredOn] = useState(
    formatDateForDisplay(getTodayDatabaseDate()),
  );
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [note, setNote] = useState('');
  const [originalEntryId, setOriginalEntryId] = useState<string | null>(null);
  const [dueVisible, setDueVisible] = useState(false);
  const [dueOn, setDueOn] = useState('');
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: receivablesQueryKey(userId, businessId),
      }),
      queryClient.invalidateQueries({
        queryKey: agendaQueryKey(userId, businessId),
      }),
    ]);
  const resetEntry = () => {
    setEntryType(null);
    setAmount('R$ 0,00');
    setNote('');
    setOriginalEntryId(null);
    setOccurredOn(formatDateForDisplay(getTodayDatabaseDate()));
    setMethod('pix');
  };
  const entryMutation = useMutation({
    mutationFn: () =>
      recordFinancialEntry({
        businessId,
        quoteId,
        type: entryType!,
        amountCents: moneyInputToCentsText(amount),
        occurredOn: parseDateForDatabase(occurredOn)!,
        paymentMethod: method,
        note,
        originalEntryId: entryType === 'refund' ? originalEntryId : null,
      }),
    onSuccess: () => {
      resetEntry();
      void invalidate();
    },
  });
  const dueMutation = useMutation({
    mutationFn: () =>
      setReceivableDueOn(
        businessId,
        quoteId,
        dueOn ? parseDateForDatabase(dueOn) : null,
      ),
    onSuccess: () => {
      setDueVisible(false);
      void invalidate();
    },
  });
  const receiptEntries = useMemo(
    () => query.data?.entries.filter((entry) => entry.type === 'receipt') ?? [],
    [query.data?.entries],
  );
  if (quoteStatus !== 'approved') return null;
  if (query.isLoading)
    return (
      <View style={styles.section}>
        <Text color="primary" style={styles.title} variant="caption">
          RECEBIMENTOS
        </Text>
        <Text color="textSecondary">Calculando saldo...</Text>
      </View>
    );
  if (query.isError || !query.data)
    return (
      <View style={styles.section}>
        <Text color="primary" style={styles.title} variant="caption">
          RECEBIMENTOS
        </Text>
        <InlineFeedback
          message="Não foi possível calcular o saldo deste orçamento."
          variant="error"
        />
        <Button
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </View>
    );
  const receivable = query.data;
  const amountCents = BigInt(moneyInputToCentsText(amount));
  const dateValid =
    isValidCalendarDate(occurredOn) &&
    parseDateForDatabase(occurredOn)! <= getTodayDatabaseDate();
  const amountValid =
    amountCents > 0n &&
    (entryType === 'receipt'
      ? amountCents <= BigInt(receivable.balanceCents)
      : amountCents <=
        BigInt(receivable.receivedCents) - BigInt(receivable.refundedCents));
  const entryValid =
    amountValid &&
    dateValid &&
    (entryType !== 'refund' || note.trim().length >= 2);
  const dueValid = !dueOn || isValidCalendarDate(dueOn);
  return (
    <View style={styles.section}>
      <Text color="primary" style={styles.title} variant="caption">
        RECEBIMENTOS
      </Text>
      <Card style={styles.summary} variant="summary">
        <View style={styles.row}>
          <Text color="textSecondary">Total</Text>
          <Text>{formatBigIntMoney(receivable.totalCents)}</Text>
        </View>
        <View style={styles.row}>
          <Text color="textSecondary">Recebido líquido</Text>
          <Text>
            {formatBigIntMoney(
              BigInt(receivable.receivedCents) -
                BigInt(receivable.refundedCents),
            )}
          </Text>
        </View>
        <View style={[styles.balance, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.copy}>
            <Text variant="label">Saldo devedor</Text>
            <Text color="primary" variant="sectionTitle">
              {formatBigIntMoney(receivable.balanceCents)}
            </Text>
          </View>
          <Badge
            label={receivable.settled ? 'Quitado' : 'Em aberto'}
            variant={receivable.settled ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.row}>
          <Text color="textSecondary" variant="caption">
            {receivable.dueOn
              ? `Vencimento informativo: ${formatDateForDisplay(receivable.dueOn)}`
              : 'Sem vencimento informado'}
          </Text>
          <Button
            label={receivable.dueOn ? 'Alterar' : 'Definir'}
            onPress={() => {
              setDueOn(
                receivable.dueOn ? formatDateForDisplay(receivable.dueOn) : '',
              );
              setDueVisible(true);
            }}
            size="small"
            variant="ghost"
          />
        </View>
        <Button
          disabled={receivable.settled}
          label="Registrar recebimento"
          onPress={() => setEntryType('receipt')}
        />
        <Button
          disabled={
            BigInt(receivable.receivedCents) -
              BigInt(receivable.refundedCents) ===
            0n
          }
          label="Registrar estorno"
          onPress={() => setEntryType('refund')}
          variant="secondary"
        />
      </Card>

      {receivable.entries.length ? (
        <Card>
          {receivable.entries.map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.entry,
                index > 0 && {
                  borderTopColor: colors.borderSubtle,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text variant="label">
                    {entry.type === 'receipt' ? 'Recebimento' : 'Estorno'}
                  </Text>
                  <Text color="textMuted" variant="caption">
                    {formatDateForDisplay(entry.occurredOn)} ·{' '}
                    {paymentMethodLabels[entry.paymentMethod]}
                  </Text>
                </View>
                <Text
                  color={entry.type === 'receipt' ? 'success' : 'danger'}
                  variant="label"
                >
                  {entry.type === 'receipt' ? '+' : '−'}{' '}
                  {formatBigIntMoney(entry.amountCents)}
                </Text>
              </View>
              {entry.note ? (
                <Text color="textSecondary" variant="caption">
                  {entry.note}
                </Text>
              ) : null}
              <Text color="textMuted" variant="caption">
                Registrado em {formatMoment(entry.createdAt)}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <InlineFeedback
          message="Nenhum recebimento registrado. O saldo corresponde ao total aprovado."
          variant="info"
        />
      )}

      <Dialog
        description={
          entryType === 'refund'
            ? 'Este registro documenta uma devolução feita fora do aplicativo.'
            : 'Registre somente valores que já entraram de verdade.'
        }
        onClose={() => !entryMutation.isPending && resetEntry()}
        title={
          entryType === 'refund' ? 'Registrar estorno' : 'Registrar recebimento'
        }
        visible={entryType !== null}
      >
        <View style={styles.formContent}>
          <MoneyInput
            error={
              amountCents > 0n && !amountValid
                ? entryType === 'receipt'
                  ? 'O valor ultrapassa o saldo devedor.'
                  : 'O valor ultrapassa o recebido líquido.'
                : undefined
            }
            label="Valor"
            onChangeText={(value) => setAmount(maskBigIntMoneyInput(value))}
            value={amount}
          />
          <DateInput
            error={
              occurredOn.length === 10 && !dateValid
                ? 'Use uma data válida que não esteja no futuro.'
                : undefined
            }
            label="Data em que aconteceu"
            maxLength={10}
            onChangeText={(value) => setOccurredOn(maskDateInput(value))}
            value={occurredOn}
          />
          <View style={styles.field}>
            <Text variant="label">Forma</Text>
            <View style={styles.chips}>
              {paymentMethods.map((value) => (
                <Chip
                  key={value}
                  label={paymentMethodLabels[value]}
                  onPress={() => setMethod(value)}
                  selected={method === value}
                />
              ))}
            </View>
          </View>
          {entryType === 'refund' && receiptEntries.length ? (
            <View style={styles.field}>
              <Text variant="label">Recebimento original (opcional)</Text>
              <View style={styles.chips}>
                <Chip
                  label="Sem referência"
                  onPress={() => setOriginalEntryId(null)}
                  selected={!originalEntryId}
                />
                {receiptEntries.map((entry) => (
                  <Chip
                    key={entry.id}
                    label={`${formatDateForDisplay(entry.occurredOn)} · ${formatBigIntMoney(entry.amountCents)}`}
                    onPress={() => setOriginalEntryId(entry.id)}
                    selected={originalEntryId === entry.id}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <Input
            label={
              entryType === 'refund'
                ? 'Motivo do estorno'
                : 'Observação (opcional)'
            }
            maxLength={500}
            multiline
            onChangeText={setNote}
            showCounter
            value={note}
          />
          {entryMutation.isError ? (
            <InlineFeedback
              message={receivableErrorMessage(entryMutation.error)}
              variant="error"
            />
          ) : null}
          <View style={styles.actions}>
            <Button
              disabled={entryMutation.isPending}
              label="Voltar"
              onPress={resetEntry}
              variant="ghost"
            />
            <Button
              disabled={!entryValid}
              label="Confirmar registro"
              loading={entryMutation.isPending}
              onPress={() => entryMutation.mutate()}
              variant={entryType === 'refund' ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </Dialog>

      <Dialog
        description="A data é apenas informativa e não gera cobrança ou notificação."
        onClose={() => !dueMutation.isPending && setDueVisible(false)}
        title="Vencimento previsto"
        visible={dueVisible}
      >
        <DateInput
          error={
            dueOn.length > 0 && dueOn.length === 10 && !dueValid
              ? 'Informe uma data válida.'
              : undefined
          }
          helperText="Deixe vazio para remover o vencimento."
          label="Data prevista"
          maxLength={10}
          onChangeText={(value) => setDueOn(maskDateInput(value))}
          value={dueOn}
        />
        {dueMutation.isError ? (
          <InlineFeedback
            message="Não foi possível salvar o vencimento informativo."
            variant="error"
          />
        ) : null}
        <View style={styles.actions}>
          <Button
            disabled={dueMutation.isPending}
            label="Voltar"
            onPress={() => setDueVisible(false)}
            variant="ghost"
          />
          <Button
            disabled={!dueValid}
            label="Salvar vencimento"
            loading={dueMutation.isPending}
            onPress={() => dueMutation.mutate()}
          />
        </View>
      </Dialog>
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
  summary: {
    gap: spacing.md,
  },

  entry: { gap: spacing.xs, paddingVertical: spacing.md },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  balance: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  formContent: { gap: spacing.md, paddingBottom: spacing.xs },
});
