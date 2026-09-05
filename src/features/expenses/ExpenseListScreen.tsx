import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AnimatedPressable, FadeInView } from '@/components/motion';
import {
  Badge,
  Button,
  ConfirmationDialog,
  Divider,
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
import {
  getThemeShadows,
  motion,
  radii,
  sizes,
  spacing,
  useTheme,
} from '@/theme';
import {
  currentMonth,
  compactMonthLabel,
  expenseCategoryLabels,
  expenseErrorMessage,
  moveMonth,
  type ExpenseSummary,
  type ExpenseMonth,
} from './domain';
import { useExpenseMonth, useExpenseMutations } from './hooks';

function ExpenseInsights({
  data,
  onNewExpense,
  onOpenResult,
}: {
  data?: ExpenseMonth;
  onNewExpense: () => void;
  onOpenResult: () => void;
}) {
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const categories = data?.byCategory ?? [];
  const total = categories.reduce(
    (sum, item) => sum + Number(item.amountCents),
    0,
  );
  const expenses = data?.expenses ?? [];
  const receipts = expenses.reduce((sum, item) => sum + item.receiptCount, 0);
  const withReceiptCents = expenses.reduce(
    (sum, item) => sum + (item.receiptCount > 0 ? Number(item.amountCents) : 0),
    0,
  );
  const withoutReceiptCents = expenses.reduce(
    (sum, item) =>
      sum + (item.receiptCount === 0 ? Number(item.amountCents) : 0),
    0,
  );
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const ranked = [...categories].sort(
    (left, right) => Number(right.amountCents) - Number(left.amountCents),
  );
  const leader = ranked[0];
  const receiptSlices = [
    { amountCents: withReceiptCents, color: colors.primary },
    { amountCents: withoutReceiptCents, color: colors.accent },
  ];
  let offset = 0;

  return (
    <View style={styles.insightComposition}>
      <View
        style={[
          styles.insights,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderSubtle,
          },
          shadows.raised,
        ]}
      >
        <View style={styles.insightBody}>
          <View style={styles.financialBreakdown}>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.primary }]}
              />
              <Text color="textSecondary" variant="caption">
                Com comprovante
              </Text>
              <Text variant="cardTitle">
                {data ? formatBigIntMoney(String(withReceiptCents)) : '—'}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.accent }]}
              />
              <Text color="textSecondary" variant="caption">
                Sem comprovante
              </Text>
              <Text variant="cardTitle">
                {data ? formatBigIntMoney(String(withoutReceiptCents)) : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.chartCopy}>
            <View
              accessible
              accessibilityLabel={`Distribuição das despesas por comprovante. Com comprovante: ${formatBigIntMoney(String(withReceiptCents))}. Sem comprovante: ${formatBigIntMoney(String(withoutReceiptCents))}.`}
              accessibilityRole="image"
              style={styles.chart}
            >
              <Svg height={112} viewBox="0 0 112 112" width={112}>
                <Circle
                  cx="56"
                  cy="56"
                  fill="none"
                  r={radius}
                  stroke={colors.backgroundSubtle}
                  strokeWidth="18"
                />
                {receiptSlices.map((item, index) => {
                  const ratio = total > 0 ? item.amountCents / total : 0;
                  const dashOffset = -offset * circumference;
                  offset += ratio;
                  return (
                    <Circle
                      cx="56"
                      cy="56"
                      fill="none"
                      key={index}
                      r={radius}
                      rotation="-90"
                      origin="56, 56"
                      stroke={item.color}
                      strokeDasharray={`${ratio * circumference} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      strokeWidth="18"
                    />
                  );
                })}
              </Svg>
            </View>
            <Text color="textSecondary" variant="caption">
              Maior categoria
            </Text>
            <Text numberOfLines={2} variant="label">
              {leader ? expenseCategoryLabels[leader.category] : 'Sem gastos'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.metricTiles}>
        <View
          style={[styles.metricTile, { backgroundColor: colors.primarySubtle }]}
        >
          <View
            style={[
              styles.metricTileIcon,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Icon color="primary" name="archive" size="small" />
          </View>
          <View style={styles.metricTileCopy}>
            <Text variant="sectionTitle">{expenses.length}</Text>
            <Text color="textSecondary" numberOfLines={2} variant="caption">
              {expenses.length === 1
                ? 'lançamento registrado'
                : 'lançamentos registrados'}
            </Text>
          </View>
        </View>
        <View
          style={[styles.metricTile, { backgroundColor: colors.infoSurface }]}
        >
          <View
            style={[
              styles.metricTileIcon,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Icon color="info" name="quote" size="small" />
          </View>
          <View style={styles.metricTileCopy}>
            <Text variant="sectionTitle">{receipts}</Text>
            <Text color="textSecondary" numberOfLines={2} variant="caption">
              {receipts === 1 ? 'comprovante anexado' : 'comprovantes anexados'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.insightActions}>
        <AnimatedPressable
          accessibilityLabel="Nova despesa"
          accessibilityRole="button"
          haptic="selection"
          containerStyle={styles.insightHalf}
          onPress={onNewExpense}
          style={[styles.insightAction, { backgroundColor: colors.primary }]}
        >
          <Icon name="addCircle" rawColor={colors.textInverse} size="small" />
          <Text style={{ color: colors.textInverse }} variant="label">
            Nova despesa
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Ver resultado"
          accessibilityRole="button"
          haptic="selection"
          containerStyle={styles.insightHalf}
          onPress={onOpenResult}
          style={[
            styles.insightAction,
            styles.insightActionDivider,
            {
              backgroundColor: colors.primaryMuted,
              // O divisor na cor da borda separa as duas metades sem virar
              // mais uma linha ao redor do bloco.
              borderLeftColor: colors.borderSubtle,
            },
          ]}
        >
          <Icon color="primary" name="trendUp" size="small" />
          <Text color="primary" variant="label">
            Ver resultado
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function ExpenseRow({
  item,
  onDelete,
}: {
  item: ExpenseSummary;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const edit = () => router.push(`/expenses/${item.id}/edit` as never);
  return (
    <View style={styles.expenseItem}>
      <AnimatedPressable
        accessibilityLabel={`Editar ${item.description || expenseCategoryLabels[item.category]}, ${formatBigIntMoney(item.amountCents)}`}
        accessibilityRole="button"
        haptic="selection"
        onPress={edit}
        style={styles.expenseMain}
      >
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: colors.dangerSurface },
          ]}
        >
          <Icon color="danger" name="money" size="medium" />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} variant="label">
            {item.description || expenseCategoryLabels[item.category]}
          </Text>
          <Text color="textSecondary" numberOfLines={1} variant="caption">
            {item.description
              ? `${expenseCategoryLabels[item.category]} · ${formatDateForDisplay(item.occurredOn)}`
              : formatDateForDisplay(item.occurredOn)}
          </Text>
          {item.quoteNumber ? (
            <Text color="textMuted" numberOfLines={1} variant="caption">
              #{String(item.quoteNumber).padStart(6, '0')}
              {item.clientName ? ` · ${item.clientName}` : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.amountColumn}>
          <Text color="danger" numberOfLines={1} variant="label">
            {formatBigIntMoney(item.amountCents)}
          </Text>
          <Icon color="textMuted" name="forward" size="small" />
        </View>
      </AnimatedPressable>
      {item.recurring || item.receiptCount ? (
        <View style={styles.expenseMeta}>
          <View style={styles.badges}>
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
          <View style={styles.utilityActions}>
            {item.recurring ? (
              <IconButton
                accessibilityLabel="Duplicar despesa recorrente"
                icon={<Icon color="textSecondary" name="duplicate" />}
                onPress={() =>
                  router.push(`/expenses/new?duplicate=${item.id}` as never)
                }
              />
            ) : null}
            <IconButton
              accessibilityLabel="Excluir despesa"
              icon={<Icon color="danger" name="delete" />}
              onPress={onDelete}
            />
          </View>
        </View>
      ) : (
        <View style={styles.deleteOnly}>
          <IconButton
            accessibilityLabel="Excluir despesa"
            icon={<Icon color="danger" name="delete" />}
            onPress={onDelete}
          />
        </View>
      )}
    </View>
  );
}

export function ExpenseListScreen({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [month, setMonth] = useState(currentMonth());
  const [deleting, setDeleting] = useState<ExpenseSummary>();
  const query = useExpenseMonth(userId, businessId, month);
  const mutations = useExpenseMutations(userId, businessId);
  const canNext = month < currentMonth();
  // A faixa usa o mesmo azul do cabeçalho da Home nos dois temas: o azul
  // claro do tema light não separava a faixa do conteúdo, e o app perdia a
  // continuidade de identidade entre a Home e as telas financeiras.
  const bandColor = colors.primary;
  const bandForeground = colors.textInverse;
  return (
    <Screen
      contentContainerStyle={[
        styles.content,
        { backgroundColor: colors.background },
      ]}
      safeAreaEdges={['top', 'bottom']}
      safeAreaColor={bandColor}
      // O ScrollView acompanha a cor da faixa: pintá-lo com o fundo claro
      // deixava um fio dessa cor aparecendo na lateral, onde a margem negativa
      // da faixa e a borda da tela se encontram.
      style={{ backgroundColor: bandColor }}
    >
      {/* A faixa é escura nos dois temas, então os ícones da barra de status
          precisam ser claros — como na Home. */}
      <StatusBar style="light" />
      {/* +2px de folga em cada lado: arredondamento entre `useWindowDimensions`
          e a largura real de renderização no Android edge-to-edge deixava até
          1px de fresta na borda, expondo o fundo claro das camadas atrás do
          Stack. A folga garante que a faixa sempre exceda a tela. */}
      <View
        style={[
          styles.financialBand,
          { backgroundColor: bandColor, width: windowWidth + 4 },
        ]}
      >
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback="/home"
          dismissToBackFallback
          foregroundColor={bandForeground}
          title="Despesas"
        />
        <View style={styles.monthStage}>
          <View style={styles.summaryRow}>
            <View style={styles.monthTotal}>
              <Text style={{ color: bandForeground }} variant="bodySmall">
                Total registrado
              </Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                numberOfLines={1}
                style={{ color: bandForeground }}
                variant="display"
              >
                {query.data
                  ? formatBigIntMoney(query.data.expenseCents)
                  : formatBigIntMoney('0')}
              </Text>
            </View>
            <View style={styles.monthNavigation}>
              <IconButton
                accessibilityLabel="Mês anterior"
                icon={<Icon name="previous" rawColor={bandForeground} />}
                onPress={() => setMonth(moveMonth(month, -1))}
              />
              <Text
                style={[styles.monthTitle, { color: bandForeground }]}
                variant="label"
              >
                {compactMonthLabel(month)}
              </Text>
              <IconButton
                accessibilityLabel="Próximo mês"
                disabled={!canNext}
                icon={<Icon name="forward" rawColor={bandForeground} />}
                onPress={() => setMonth(moveMonth(month, 1))}
              />
            </View>
          </View>
          <View
            style={[styles.stageDivider, { backgroundColor: bandForeground }]}
          />
          <Text style={{ color: bandForeground }} variant="bodySmall">
            Acompanhe cada gasto e veja quanto realmente sobrou no resultado.
          </Text>
        </View>
      </View>
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <ExpenseInsights
          data={query.data}
          onNewExpense={() => router.push('/expenses/new' as never)}
          onOpenResult={() => router.push('/result' as never)}
        />
      </FadeInView>
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
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerHeading}>
            <View style={styles.copy}>
              <Text variant="sectionTitle">Movimentação do mês</Text>
              <Text color="textSecondary" variant="bodySmall">
                {query.data.expenses.length}{' '}
                {query.data.expenses.length === 1
                  ? 'lançamento'
                  : 'lançamentos'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.ledger,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {query.data.expenses.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Divider /> : null}
                <ExpenseRow item={item} onDelete={() => setDeleting(item)} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptySection}>
          <View style={styles.emptyHeading}>
            <Text variant="sectionTitle">Movimentação do mês</Text>
            <Text color="textSecondary">
              Este espaço ganha vida conforme você organiza seus gastos.
            </Text>
          </View>
          <View
            style={[
              styles.emptyJourney,
              {
                backgroundColor: colors.backgroundSubtle,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.emptyLead}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.primarySubtle },
                ]}
              >
                <Icon color="primary" name="archive" size="large" />
              </View>
              <View style={styles.copy}>
                <Text variant="cardTitle">Comece pelo primeiro gasto</Text>
                <Text color="textSecondary" variant="bodySmall">
                  Pode ser material, transporte, aluguel ou qualquer custo do
                  trabalho.
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.journeyDivider,
                { backgroundColor: colors.borderSubtle },
              ]}
            />
            <View style={styles.journeySteps}>
              <View style={styles.journeyStep}>
                <Icon color="primary" name="addCircle" size="small" />
                <Text variant="bodySmall">Registre o valor</Text>
              </View>
              <View style={styles.journeyStep}>
                <Icon color="primary" name="archive" size="small" />
                <Text variant="bodySmall">Guarde comprovantes</Text>
              </View>
              <View style={styles.journeyStep}>
                <Icon color="primary" name="trendUp" size="small" />
                <Text variant="bodySmall">Acompanhe o resultado</Text>
              </View>
            </View>
          </View>
        </View>
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
  // A largura vem de `useWindowDimensions`, não de margem negativa cancelando
  // o padding do container: arredondamento de subpixel entre valores opostos
  // (-24 vs +24) deixava um fio da cor de fundo do Stack visível na borda em
  // certas densidades de tela. Width explícita elimina essa dependência.
  financialBand: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: -spacing.md,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  monthStage: {
    gap: spacing.md,
    minHeight: 176,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  monthNavigation: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    justifyContent: 'flex-end',
    marginTop: -12,
  },
  summaryRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  monthTitle: {
    minWidth: 72,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  monthTotal: { flex: 1, gap: spacing.xs, minWidth: 0 },
  stageDivider: { height: StyleSheet.hairlineWidth, opacity: 0.28 },
  insightComposition: {
    gap: spacing.md,
    marginTop: -72,
    zIndex: 2,
  },
  insights: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  // As duas colunas têm alturas diferentes: com `flex-start` a rosca encostava
  // no topo enquanto a legenda respirava, e o card parecia torto. Centralizar
  // uma contra a outra alinha os dois blocos pelo eixo.
  insightBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  financialBreakdown: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  breakdownItem: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    position: 'relative',
  },
  legendDot: {
    borderRadius: radii.circular,
    height: 6,
    left: 0,
    position: 'absolute',
    top: 7,
    width: 6,
  },
  metricTiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricTile: {
    alignItems: 'center',
    borderRadius: radii.control,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  metricTileIcon: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  metricTileCopy: {
    flex: 1,
    gap: 0,
    minWidth: 0,
  },
  // Sem largura fixa: 120 para um gráfico de 112 deixava a rosca fora do
  // centro da própria coluna. O conteúdo define a largura, e o rótulo abaixo
  // pode quebrar sem empurrar o gráfico.
  chartCopy: {
    alignItems: 'center',
    gap: 2,
    maxWidth: 132,
  },
  // A margem separa o rótulo do gráfico sem afetar o espaçamento entre o
  // rótulo e o nome da categoria, que ficam juntos de propósito.
  chart: { height: 112, marginBottom: spacing.xs, width: 112 },
  // Par segmentado: um bloco só, ocupando a largura inteira, com o divisor
  // central separando as duas ações. Sem o divisor, dois retângulos colados
  // leem como um botão largo; com ele, fica claro que são dois.
  insightActions: {
    borderRadius: radii.control,
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
  },
  // O flex vive no container porque e ele que o AnimatedPressable mede; o
  // style interno vai para um Pressable comum.
  insightHalf: { flex: 1 },
  insightAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  insightActionDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  ledgerSection: { gap: spacing.md },
  ledgerHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  ledger: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  expenseItem: { paddingHorizontal: spacing.md },
  expenseMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 88,
    paddingVertical: spacing.md,
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  amountColumn: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  expenseMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  utilityActions: { flexDirection: 'row', gap: spacing.xs },
  deleteOnly: { alignItems: 'flex-end', paddingBottom: spacing.sm },
  emptySection: { gap: spacing.md },
  emptyHeading: { gap: spacing.xs },
  emptyJourney: {
    borderRadius: radii.largeCard,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  emptyLead: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  journeyDivider: { height: StyleSheet.hairlineWidth },
  journeySteps: { gap: spacing.md },
  journeyStep: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
});
