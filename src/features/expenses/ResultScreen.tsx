import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  InlineFeedback,
  Screen,
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { FadeInView } from '@/components/motion';
import { motion, spacing, useTheme } from '@/theme';
import {
  currentMonth,
  expenseCategoryLabels,
  monthLabel,
  moveMonth,
} from './domain';
import { useExpenseMonth } from './hooks';
import {
  exportMonthlyResult,
  type MonthlyExportSelection,
} from './monthlyExport';
export function ResultScreen({
  userId,
  businessId,
  businessName,
}: {
  userId: string;
  businessId: string;
  businessName: string;
}) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const [exportVisible, setExportVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    message: string;
    variant: 'success' | 'error';
  }>();
  const [selection, setSelection] = useState<MonthlyExportSelection>({
    receipts: true,
    expenses: true,
    summary: true,
  });
  const query = useExpenseMonth(userId, businessId, month);
  const data = query.data;
  const identity = `${userId}:${businessId}:${month}`;
  const currentIdentity = useRef(identity);
  const exportGeneration = useRef(0);
  useEffect(() => {
    currentIdentity.current = identity;
  }, [identity]);
  const selected =
    selection.receipts || selection.expenses || selection.summary;
  const cancelExport = () => {
    exportGeneration.current += 1;
    setExporting(false);
    setExportVisible(false);
  };
  const runExport = async () => {
    if (!data || !selected || exporting) return;
    const expected = identity;
    const generation = exportGeneration.current + 1;
    exportGeneration.current = generation;
    const isCurrent = () =>
      currentIdentity.current === expected &&
      exportGeneration.current === generation;
    setExporting(true);
    setExportFeedback(undefined);
    try {
      await exportMonthlyResult({
        data,
        businessName,
        userId,
        selection,
        isCurrent,
      });
      if (!isCurrent()) return;
      setExportVisible(false);
      setExportFeedback({
        message: 'Exportação concluída.',
        variant: 'success',
      });
    } catch (error) {
      if (!isCurrent()) return;
      const message = error instanceof Error ? error.message : String(error);
      setExportFeedback({
        message: /SESSION_CHANGED|IDENTITY_CHANGED/.test(message)
          ? 'A conta ou o período mudou. Gere os arquivos novamente.'
          : 'Não foi possível gerar os arquivos.',
        variant: 'error',
      });
    } finally {
      if (isCurrent()) setExporting(false);
    }
  };
  return (
    <Screen
      contentContainerStyle={styles.content}
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback={'/expenses' as never}
        dismissToBackFallback
        title="Resultado"
      />
      <View style={styles.month}>
        <IconButton
          accessibilityLabel="Mês anterior"
          icon={<Icon color="textSecondary" name="previous" />}
          onPress={() => setMonth(moveMonth(month, -1))}
        />
        <Text style={styles.label} variant="cardTitle">
          {monthLabel(month)}
        </Text>
        <IconButton
          accessibilityLabel="Próximo mês"
          disabled={month >= currentMonth()}
          icon={<Icon color="textSecondary" name="forward" />}
          onPress={() => setMonth(moveMonth(month, 1))}
        />
      </View>
      <Button
        label="Exportar"
        variant="secondary"
        disabled={!data || query.isLoading}
        onPress={() => setExportVisible(true)}
      />
      {exportFeedback ? (
        <InlineFeedback
          message={exportFeedback.message}
          variant={exportFeedback.variant}
        />
      ) : null}
      {query.isLoading ? (
        <SkeletonBlock label="Calculando resultado" lines={2} />
      ) : query.isError || !data ? (
        <>
          <InlineFeedback
            message="Não foi possível calcular o resultado."
            variant="error"
          />
          <Button
            label="Tentar novamente"
            onPress={() => void query.refetch()}
          />
        </>
      ) : (
        <>
          <FadeInView distance={motion.distance.medium} scaleFrom={motion.enterScale}>
            <Card style={styles.card} variant="summary">
            <View style={styles.row}>
              <Text color="textSecondary">Recebido líquido</Text>
              <Text color="success" variant="label">
                {formatBigIntMoney(data.receivedCents)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text color="textSecondary">Despesas</Text>
              <Text color="danger" variant="label">
                {formatBigIntMoney(data.expenseCents)}
              </Text>
            </View>
            <View
              style={[styles.total, { borderTopColor: colors.borderSubtle }]}
            >
              <Text variant="label">Resultado líquido</Text>
              <Text
                color={BigInt(data.resultCents) >= 0n ? 'success' : 'danger'}
                variant="sectionTitle"
              >
                {formatBigIntMoney(data.resultCents)}
              </Text>
            </View>
            </Card>
          </FadeInView>
          <View style={styles.section}>
            <Text variant="sectionTitle">Despesas por categoria</Text>
            {data.byCategory.length ? (
              data.byCategory.map((item) => (
                <View key={item.category} style={styles.row}>
                  <Text>{expenseCategoryLabels[item.category]}</Text>
                  <Text>{formatBigIntMoney(item.amountCents)}</Text>
                </View>
              ))
            ) : (
              <EmptyState
                description="As despesas do período aparecerão agrupadas por categoria."
                icon="archive"
                title="Nenhuma despesa no período"
              />
            )}
          </View>
        </>
      )}
      <Dialog
        visible={exportVisible}
        title="Exportar para contador"
        description="Escolha os arquivos. Ao selecionar todos, o compartilhamento será aberto uma vez para cada arquivo."
        onClose={cancelExport}
      >
        <Checkbox
          label="Recebimentos e estornos (CSV)"
          checked={selection.receipts}
          onChange={(value) =>
            setSelection((current) => ({ ...current, receipts: value }))
          }
        />
        <Checkbox
          label="Despesas (CSV)"
          checked={selection.expenses}
          onChange={(value) =>
            setSelection((current) => ({ ...current, expenses: value }))
          }
        />
        <Checkbox
          label="Resumo mensal (PDF)"
          checked={selection.summary}
          onChange={(value) =>
            setSelection((current) => ({ ...current, summary: value }))
          }
        />
        <View style={styles.exportActions}>
          <Button
            label={exporting ? 'Fechar' : 'Cancelar'}
            variant="ghost"
            onPress={cancelExport}
          />
          <Button
            label="Gerar e compartilhar"
            disabled={!selected || exporting}
            loading={exporting}
            onPress={() => void runExport()}
          />
        </View>
      </Dialog>
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
  label: { textTransform: 'capitalize' },
  card: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  total: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  section: { gap: spacing.md },
  exportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
