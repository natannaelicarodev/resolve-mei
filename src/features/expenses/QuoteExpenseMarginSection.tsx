import { StyleSheet, View } from 'react-native';
import { Card, InlineFeedback, Text } from '@/components/ui';
import { formatDateForDisplay } from '@/features/quotes/date';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { spacing, useTheme } from '@/theme';
import { expenseCategoryLabels } from './domain';
import { useQuoteExpenseMargin } from './hooks';
export function QuoteExpenseMarginSection({
  userId,
  businessId,
  quoteId,
}: {
  userId: string;
  businessId: string;
  quoteId: string;
}) {
  const { colors } = useTheme();
  const query = useQuoteExpenseMargin(userId, businessId, quoteId);
  if (query.isLoading)
    return <Text color="textSecondary">Calculando margem...</Text>;
  if (query.isError)
    return (
      <InlineFeedback
        message="Não foi possível carregar as despesas vinculadas."
        variant="error"
      />
    );
  if (!query.data?.hasExpenses) return null;
  const data = query.data;
  return (
    <View style={styles.section}>
      <Text color="primary" style={styles.title} variant="caption">
        DESPESAS E MARGEM
      </Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text color="textSecondary">Recebido líquido</Text>
          <Text>{formatBigIntMoney(data.receivedCents)}</Text>
        </View>
        <View style={styles.row}>
          <Text color="textSecondary">Despesas vinculadas</Text>
          <Text color="danger">{formatBigIntMoney(data.expenseCents)}</Text>
        </View>
        <View style={[styles.total, { borderTopColor: colors.borderSubtle }]}>
          <Text variant="label">Margem acumulada</Text>
          <Text
            color={BigInt(data.marginCents) >= 0n ? 'success' : 'danger'}
            variant="sectionTitle"
          >
            {formatBigIntMoney(data.marginCents)}
          </Text>
        </View>
        {data.expenses.map((item) => (
          <View
            key={item.id}
            style={[styles.expense, { borderTopColor: colors.borderSubtle }]}
          >
            <View>
              <Text variant="label">
                {item.description || expenseCategoryLabels[item.category]}
              </Text>
              <Text color="textSecondary" variant="caption">
                {expenseCategoryLabels[item.category]} ·{' '}
                {formatDateForDisplay(item.occurredOn)}
              </Text>
            </View>
            <Text>{formatBigIntMoney(item.amountCents)}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  total: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  expense: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
});
