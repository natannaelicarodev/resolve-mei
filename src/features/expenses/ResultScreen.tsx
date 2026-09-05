import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Badge,
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
import { getThemeShadows, motion, spacing, useTheme } from '@/theme';
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

const NOTCH_RADIUS = 10;

// Borda serrilhada de recibo: uma fileira de círculos na cor de fundo da
// página, sobrepostos à base da faixa — cada círculo "morde" um semicírculo
// da faixa por baixo. Evita path SVG dinâmico, que não renderizava de forma
// confiável entre plataformas; círculos são `View`s comuns com borderRadius,
// muito mais previsíveis em RN.
function ReceiptEdge({
  bandColor,
  pageColor,
  width,
}: {
  bandColor: string;
  pageColor: string;
  width: number;
}) {
  const diameter = NOTCH_RADIUS * 2;
  // Arredonda para cima e soma uma mordida extra: as pontas ficam parcialmente
  // fora da largura visível em vez de sobrar um trecho reto de faixa antes da
  // primeira/depois da última — o excesso é cortado por `overflow: hidden`.
  const count = Math.max(1, Math.ceil(width / diameter)) + 1;
  return (
    <View
      style={[
        styles.edge,
        { backgroundColor: bandColor, height: NOTCH_RADIUS, width },
      ]}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.edgeNotch,
            {
              backgroundColor: pageColor,
              borderRadius: NOTCH_RADIUS,
              height: diameter,
              left: index * diameter - NOTCH_RADIUS,
              top: 0,
              width: diameter,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ResultScreen({
  userId,
  businessId,
  businessName,
}: {
  userId: string;
  businessId: string;
  businessName: string;
}) {
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const { width: windowWidth } = useWindowDimensions();
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
  const bandColor = colors.primary;
  const bandForeground = colors.textInverse;
  const profit = data ? BigInt(data.resultCents) >= 0n : true;
  return (
    <Screen
      contentContainerStyle={[
        styles.content,
        { backgroundColor: colors.background },
      ]}
      safeAreaEdges={['top', 'bottom']}
      safeAreaColor={bandColor}
      style={{ backgroundColor: bandColor }}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.band,
          { backgroundColor: bandColor, width: windowWidth + 4 },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitle}>
            <ProtectedPageHeader
              alwaysUseBackFallback
              back
              backFallback={'/expenses' as never}
              dismissToBackFallback
              foregroundColor={bandForeground}
              title="Resultado"
            />
          </View>
          <IconButton
            accessibilityLabel="Exportar para contador"
            icon={<Icon name="share" rawColor={bandForeground} />}
            onPress={() => setExportVisible(true)}
            style={styles.exportButton}
          />
        </View>
        <View style={styles.month}>
          <IconButton
            accessibilityLabel="Mês anterior"
            icon={<Icon name="previous" rawColor={bandForeground} />}
            onPress={() => setMonth(moveMonth(month, -1))}
          />
          <Text
            style={[styles.monthLabel, { color: bandForeground }]}
            variant="label"
          >
            {monthLabel(month)}
          </Text>
          <IconButton
            accessibilityLabel="Próximo mês"
            disabled={month >= currentMonth()}
            icon={<Icon name="forward" rawColor={bandForeground} />}
            onPress={() => setMonth(moveMonth(month, 1))}
          />
        </View>
        {data ? (
          <FadeInView
            distance={motion.distance.medium}
            scaleFrom={motion.enterScale}
          >
            <View style={styles.resultStage}>
              <Text style={{ color: bandForeground }} variant="bodySmall">
                Resultado líquido
              </Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                numberOfLines={1}
                style={{ color: bandForeground }}
                variant="display"
              >
                {formatBigIntMoney(data.resultCents)}
              </Text>
              <Badge
                icon={
                  <Icon
                    name={profit ? 'trendUp' : 'trendDown'}
                    rawColor={profit ? colors.success : colors.danger}
                    size="small"
                  />
                }
                label={profit ? 'Lucro' : 'Prejuízo'}
                variant={profit ? 'success' : 'danger'}
              />
            </View>
          </FadeInView>
        ) : (
          <View style={styles.resultStage}>
            <Text style={{ color: bandForeground }} variant="bodySmall">
              Resultado líquido
            </Text>
            <Text style={{ color: bandForeground }} variant="display">
              {formatBigIntMoney('0')}
            </Text>
          </View>
        )}
      </View>
      <ReceiptEdge
        bandColor={bandColor}
        pageColor={colors.background}
        width={windowWidth + 4}
      />
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
        <View style={styles.detailsGroup}>
          <Card style={[styles.card, shadows.raised]} variant="summary">
            <Text color="textSecondary" variant="caption">
              Detalhes
            </Text>
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
          </Card>
          <View style={styles.section}>
            <Text variant="sectionTitle">Despesas por categoria</Text>
            {data.byCategory.length ? (
              <Card style={styles.card}>
                {data.byCategory.map((item, index) => (
                  <View key={item.category}>
                    {index > 0 ? (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: colors.borderSubtle },
                        ]}
                      />
                    ) : null}
                    <View style={styles.row}>
                      <Text>{expenseCategoryLabels[item.category]}</Text>
                      <Text>{formatBigIntMoney(item.amountCents)}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            ) : (
              <EmptyState
                description="As despesas do período aparecerão agrupadas por categoria."
                icon="archive"
                title="Nenhuma despesa no período"
              />
            )}
          </View>
          {exportFeedback ? (
            <InlineFeedback
              message={exportFeedback.message}
              variant={exportFeedback.variant}
            />
          ) : null}
        </View>
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
  content: { gap: spacing.lg, paddingHorizontal: spacing.lg },
  edge: {
    alignSelf: 'center',
    marginTop: -spacing.lg,
    overflow: 'hidden',
  },
  edgeNotch: { position: 'absolute' },
  band: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: -spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row' },
  headerTitle: { flex: 1, minWidth: 0 },
  exportButton: { marginLeft: spacing.xs },
  month: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  monthLabel: { textTransform: 'capitalize' },
  resultStage: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  detailsGroup: { gap: spacing.lg, marginTop: -NOTCH_RADIUS },
  card: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  divider: { height: StyleSheet.hairlineWidth },
  section: { gap: spacing.md },
  exportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
