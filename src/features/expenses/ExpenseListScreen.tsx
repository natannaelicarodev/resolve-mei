import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  EmptyState,
  Icon,
  IconButton,
  InlineFeedback,
  Screen,
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { formatDateForDisplay } from '@/features/quotes/date';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { spacing } from '@/theme';
import {
  currentMonth,
  expenseCategoryLabels,
  expenseErrorMessage,
  monthLabel,
  moveMonth,
  type ExpenseSummary,
} from './domain';
import { useExpenseMonth, useExpenseMutations } from './hooks';

export function ExpenseListScreen({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}) {
  const [month, setMonth] = useState(currentMonth());
  const [deleting, setDeleting] = useState<ExpenseSummary>();
  const query = useExpenseMonth(userId, businessId, month);
  const mutations = useExpenseMutations(userId, businessId);
  const canNext = month < currentMonth();
  return (
    <Screen
      contentContainerStyle={styles.content}
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/home"
        dismissToBackFallback
        title="Despesas"
      />
      <View style={styles.month}>
        <IconButton
          accessibilityLabel="Mês anterior"
          icon={<Icon color="textSecondary" name="previous" />}
          onPress={() => setMonth(moveMonth(month, -1))}
        />
        {/* O total fica junto do mês porque é o motivo de trocar de mês:
            antes, somá-lo exigia rolar a lista inteira ou sair da tela. */}
        <View style={styles.monthCopy}>
          <Text style={styles.monthTitle} variant="cardTitle">
            {monthLabel(month)}
          </Text>
          <Text color="danger" variant="monetaryValue">
            {query.data
              ? formatBigIntMoney(query.data.expenseCents)
              : formatBigIntMoney('0')}
          </Text>
        </View>
        <IconButton
          accessibilityLabel="Próximo mês"
          disabled={!canNext}
          icon={<Icon color="textSecondary" name="forward" />}
          onPress={() => setMonth(moveMonth(month, 1))}
        />
      </View>
      <View style={styles.actions}>
        <Button
          label="Resultado"
          onPress={() => router.push('/result' as never)}
          variant="secondary"
        />
        <Button
          label="Nova despesa"
          onPress={() => router.push('/expenses/new' as never)}
        />
      </View>
      {query.isLoading ? (
        <SkeletonBlock label="Carregando despesas" />
      ) : query.isError ? (
        <>
          <InlineFeedback
            message="Não foi possível carregar as despesas."
            variant="error"
          />
          <Button
            label="Tentar novamente"
            onPress={() => void query.refetch()}
            variant="secondary"
          />
        </>
      ) : query.data?.expenses.length ? (
        query.data.expenses.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text variant="label">
                  {item.description || expenseCategoryLabels[item.category]}
                </Text>
                <Text color="textSecondary" variant="caption">
                  {expenseCategoryLabels[item.category]} ·{' '}
                  {formatDateForDisplay(item.occurredOn)}
                </Text>
                {item.quoteNumber ? (
                  <Text color="textSecondary" variant="caption">
                    Orçamento #{String(item.quoteNumber).padStart(6, '0')} ·{' '}
                    {item.clientName}
                  </Text>
                ) : null}
              </View>
              <Text color="danger" variant="cardTitle">
                {formatBigIntMoney(item.amountCents)}
              </Text>
            </View>
            {item.recurring || item.receiptCount ? (
              <View style={styles.row}>
                {item.recurring ? (
                  <Badge label="Recorrente" variant="info" />
                ) : null}
                {item.receiptCount ? (
                  <Badge
                    label={`${item.receiptCount} comprovante${item.receiptCount > 1 ? 's' : ''}`}
                    variant="neutral"
                  />
                ) : null}
              </View>
            ) : null}
            {/* As ações continuam na linha porque excluir só existe aqui — a
                tela de edição não oferece exclusão. O que muda é o peso:
                botões pequenos em vez de blocos de altura cheia, que somavam
                mais altura que a própria despesa. */}
            <View style={styles.actions}>
              <Button
                label="Editar"
                onPress={() =>
                  router.push(`/expenses/${item.id}/edit` as never)
                }
                size="small"
                variant="secondary"
              />
              {item.recurring ? (
                <Button
                  label="Duplicar"
                  onPress={() =>
                    router.push(`/expenses/new?duplicate=${item.id}` as never)
                  }
                  size="small"
                  variant="ghost"
                />
              ) : null}
              <Button
                label="Excluir"
                onPress={() => setDeleting(item)}
                size="small"
                variant="danger"
              />
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          description="As despesas lançadas neste mês aparecerão aqui."
          icon="archive"
          title="Nenhuma despesa registrada"
        />
      )}
      {mutations.remove.isError ? (
        <InlineFeedback
          message={expenseErrorMessage(mutations.remove.error)}
          variant="error"
        />
      ) : null}
      <ConfirmationDialog
        cancelLabel="Voltar"
        confirmLabel="Excluir despesa"
        description="A despesa deixará de entrar no resultado e seus comprovantes serão removidos."
        destructive
        loading={mutations.remove.isPending}
        onCancel={() => setDeleting(undefined)}
        onConfirm={() =>
          deleting &&
          mutations.remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(undefined),
          })
        }
        title="Excluir despesa?"
        visible={Boolean(deleting)}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  month: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthCopy: { alignItems: 'center', flex: 1, gap: 2 },
  monthTitle: { textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { gap: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
});
