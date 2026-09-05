import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  IconButton,
  Icon,
  InlineFeedback,
  ListItem,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { formatQuoteNumber } from '@/features/quotes/domain';
import { formatDateForDisplay } from '@/features/quotes/date';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { getThemeShadows, motion, radii, spacing, useTheme } from '@/theme';
import {
  calendarGrid,
  calendarMonthLabel,
  currentCalendarMonth,
  moveCalendarMonth,
  type AgendaAppointment,
} from './domain';
import { useAgendaOverview } from './hooks';

type Urgency = 'overdue' | 'today' | 'due' | 'upcoming';
type StatusFilter = 'overdue' | 'today' | 'due' | 'upcoming';

const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: 'Atrasada',
  today: 'Hoje',
  due: 'Vence hoje',
  upcoming: 'Agendada',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Horário/data em um selo colorido por urgência: a mesma pista visual da
// referência (indicador à esquerda da linha), mas nunca só cor — cada linha
// também carrega um rótulo de texto (badge ou legenda) com a mesma informação.
function UrgencyMark({ urgency, label }: { urgency: Urgency; label: string }) {
  const { colors } = useTheme();
  const tone =
    urgency === 'overdue' || urgency === 'due'
      ? colors.warningSurface
      : urgency === 'today'
        ? colors.primarySubtle
        : colors.backgroundSubtle;
  const textTone =
    urgency === 'overdue' || urgency === 'due'
      ? colors.warning
      : urgency === 'today'
        ? colors.primary
        : colors.textSecondary;
  return (
    <View style={[styles.mark, { backgroundColor: tone }]}>
      <Text numberOfLines={1} style={{ color: textTone }} variant="caption">
        {label}
      </Text>
    </View>
  );
}

function AgendaGroup({ children }: { children: ReactNode[] }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      {children.map((child, index) => (
        <View key={index}>
          {index > 0 ? <Divider /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

type DayStatus = 'overdue' | 'today' | 'upcoming' | 'none';

const DAY_STATUS_RANK: Record<DayStatus, number> = {
  overdue: 3,
  today: 2,
  upcoming: 1,
  none: 0,
};

/**
 * Grade mensal fiel à referência: cada dia com atividade vira um círculo
 * cheio (não um ponto discreto), cor por status real disponível hoje —
 * atrasada, com visita hoje, ou com visita futura (vencimentos financeiros
 * só existem para o dia de hoje na API atual, então não geram um 4º tom).
 * Dias sem atividade recebem um círculo cinza sutil; dias fora do mês, uma
 * textura hachurada. Tocar um dia filtra a lista abaixo; tocar de novo limpa.
 */
function AgendaCalendar({
  month,
  onMonthChange,
  dayStatus,
  today,
  selectedDay,
  onSelectDay,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  dayStatus: Map<string, DayStatus>;
  today: string;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const grid = useMemo(() => calendarGrid(month), [month]);
  const statusColor: Record<Exclude<DayStatus, 'none'>, string> = {
    overdue: colors.danger,
    today: colors.primary,
    upcoming: colors.primarySubtle,
  };
  const statusForeground: Record<Exclude<DayStatus, 'none'>, string> = {
    overdue: colors.textInverse,
    today: colors.textInverse,
    upcoming: colors.primary,
  };
  return (
    <View
      style={[
        styles.calendar,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        shadows.raised,
      ]}
    >
      <View style={styles.calendarHeader}>
        <Text variant="cardTitle">Calendário</Text>
        <View style={styles.calendarNav}>
          <IconButton
            accessibilityLabel="Mês anterior"
            icon={<Icon color="textSecondary" name="previous" />}
            onPress={() => onMonthChange(moveCalendarMonth(month, -1))}
          />
          <Text style={styles.calendarMonthLabel} variant="label">
            {calendarMonthLabel(month)}
          </Text>
          <IconButton
            accessibilityLabel="Próximo mês"
            icon={<Icon color="textSecondary" name="forward" />}
            onPress={() => onMonthChange(moveCalendarMonth(month, 1))}
          />
        </View>
      </View>
      <View style={styles.calendarWeekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            color="textMuted"
            key={index}
            style={styles.calendarCell}
            variant="caption"
          >
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {grid.map((cell) => {
          const isSelected = cell.date === selectedDay;
          const status = dayStatus.get(cell.date) ?? 'none';
          if (!cell.inMonth) {
            return (
              <View key={cell.date} style={styles.calendarCell}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.calendarDay,
                    styles.calendarDayOutside,
                    { borderColor: colors.borderSubtle },
                  ]}
                >
                  <Text color="textMuted" numberOfLines={1} variant="caption">
                    {cell.day}
                  </Text>
                </View>
              </View>
            );
          }
          const filled = status !== 'none';
          const background = isSelected
            ? colors.textPrimary
            : filled
              ? statusColor[status]
              : colors.backgroundSubtle;
          const foreground = isSelected
            ? colors.textInverse
            : filled
              ? statusForeground[status]
              : colors.textPrimary;
          return (
            <View key={cell.date} style={styles.calendarCell}>
              <AnimatedPressable
                accessibilityLabel={`${cell.day}${status !== 'none' ? `, ${URGENCY_LABEL[status]}` : ''}${cell.date === today ? ', hoje' : ''}`}
                accessibilityRole="button"
                haptic="selection"
                onPress={() => onSelectDay(isSelected ? null : cell.date)}
                style={[styles.calendarDay, { backgroundColor: background }]}
              >
                <Text
                  numberOfLines={1}
                  style={{ color: foreground }}
                  variant="caption"
                >
                  {cell.day}
                </Text>
              </AnimatedPressable>
            </View>
          );
        })}
      </View>
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.primary }]}
          />
          <Text color="textSecondary" variant="caption">
            Hoje
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primarySubtle },
            ]}
          />
          <Text color="textSecondary" variant="caption">
            Agendada
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.danger }]}
          />
          <Text color="textSecondary" variant="caption">
            Atrasada
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AgendaScreen({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const query = useAgendaOverview(userId, businessId);
  const [month, setMonth] = useState(currentCalendarMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // null até o usuário escolher manualmente: a aba inicial é derivada dos
  // dados (primeira categoria com itens, na ordem de urgência), então a tela
  // nunca abre numa aba vazia enquanto outra tem pendências reais.
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  // Mesmo azul do cabeçalho da Home e da faixa de Despesas/Resultado. Só o
  // topo (`safeAreaEdges: ['top']`) recebe a cor da faixa — pintar o inset de
  // baixo também deixava uma segunda faixa sobrando entre o fim do conteúdo e
  // a `ProtectedBottomNavigation`, que já cobre essa área por conta própria.
  const bandColor = colors.primary;
  const bandForeground = colors.textInverse;
  const shell = (band: ReactNode, content: ReactNode) => (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Screen
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.background },
        ]}
        safeAreaColor={bandColor}
        safeAreaEdges={['top']}
        style={{ backgroundColor: bandColor }}
      >
        <StatusBar style="light" />
        <View
          style={[
            styles.band,
            { backgroundColor: bandColor, width: windowWidth + 4 },
          ]}
        >
          <ProtectedPageHeader
            foregroundColor={bandForeground}
            title="Agenda"
          />
          {band}
        </View>
        {content}
      </Screen>
      <ProtectedBottomNavigation selected="agenda" />
    </View>
  );
  if (query.isLoading)
    return shell(
      null,
      <>
        <Skeleton height={120} width="100%" />
        <Skeleton height={180} width="100%" />
      </>,
    );
  if (query.isError || !query.data)
    return shell(
      null,
      <>
        <InlineFeedback
          message="Não foi possível carregar sua agenda."
          variant="error"
        />
        <Button
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </>,
    );

  const { appointments, financialDueToday, today } = query.data;
  const overdue = appointments.filter((item) => item.overdue);
  const todayItems = appointments.filter((item) => item.scheduledOn === today);
  const upcoming = appointments.filter((item) => item.scheduledOn > today);
  const actionCount =
    overdue.length + todayItems.length + financialDueToday.length;
  const summaryParts = [
    overdue.length
      ? `${overdue.length} atrasada${overdue.length > 1 ? 's' : ''}`
      : null,
    todayItems.length ? `${todayItems.length} hoje` : null,
    financialDueToday.length
      ? `${financialDueToday.length} vencimento${financialDueToday.length > 1 ? 's' : ''}`
      : null,
  ].filter(Boolean);
  // Uma data pode ter mais de uma visita; a atrasada vence as demais, e a de
  // hoje vence uma futura — o dia mostra sempre a urgência mais alta que ele
  // carrega.
  const dayStatus = new Map<string, DayStatus>();
  for (const item of appointments) {
    const next: DayStatus = item.overdue
      ? 'overdue'
      : item.scheduledOn === today
        ? 'today'
        : 'upcoming';
    const current = dayStatus.get(item.scheduledOn);
    if (!current || DAY_STATUS_RANK[next] > DAY_STATUS_RANK[current])
      dayStatus.set(item.scheduledOn, next);
  }

  // Visitas futuras mostram a data (dado que decide se cabe na agenda);
  // atrasadas e de hoje mostram a hora (dado que decide a ordem do dia).
  const markLabel = (item: AgendaAppointment, urgency: Urgency) =>
    urgency === 'upcoming'
      ? formatDateForDisplay(item.scheduledOn)
      : (item.scheduledTime?.slice(0, 5) ?? '—');

  const appointmentRow = (item: AgendaAppointment, urgency: Urgency) => (
    <ListItem
      accessibilityLabel={`Visita de ${item.clientName}, ordem #${formatQuoteNumber(item.quoteNumber)}, ${URGENCY_LABEL[urgency]}, ${markLabel(item, urgency)}`}
      key={item.id}
      leading={
        <UrgencyMark label={markLabel(item, urgency)} urgency={urgency} />
      }
      onPress={() =>
        router.push({
          pathname: '/service-orders/[id]',
          params: { id: item.serviceOrderId },
        })
      }
      subtitle={`Ordem #${formatQuoteNumber(item.quoteNumber)}`}
      title={item.clientName}
      trailing={
        urgency === 'overdue' ? (
          <Badge label={URGENCY_LABEL.overdue} variant="warning" />
        ) : undefined
      }
    />
  );

  const dueRow = (item: (typeof financialDueToday)[number]) => (
    <ListItem
      accessibilityLabel={`Orçamento de ${item.clientName}, ${URGENCY_LABEL.due}, saldo ${formatBigIntMoney(item.balanceCents)}`}
      key={item.quoteId}
      leading={<UrgencyMark label="Hoje" urgency="due" />}
      onPress={() =>
        router.push({
          pathname: '/quotes/[id]',
          params: { id: item.quoteId },
        })
      }
      subtitle={`Orçamento #${formatQuoteNumber(item.quoteNumber)}`}
      title={item.clientName}
      trailing={
        <Text color="warning" variant="label">
          {formatBigIntMoney(item.balanceCents)}
        </Text>
      }
    />
  );

  // Um dia selecionado no calendário sobrepõe o filtro de status: mostra só
  // as visitas daquele dia, independente de urgência.
  const daySelection = selectedDay
    ? appointments.filter((item) => item.scheduledOn === selectedDay)
    : null;

  const filterOptions: { label: string; value: StatusFilter }[] = [
    { label: `Atrasadas (${overdue.length})`, value: 'overdue' },
    { label: `Hoje (${todayItems.length})`, value: 'today' },
    { label: `Vencimentos (${financialDueToday.length})`, value: 'due' },
    { label: `Próximas (${upcoming.length})`, value: 'upcoming' },
  ];
  const defaultFilter: StatusFilter = overdue.length
    ? 'overdue'
    : todayItems.length
      ? 'today'
      : financialDueToday.length
        ? 'due'
        : 'upcoming';
  const effectiveFilter = statusFilter ?? defaultFilter;

  const activeList =
    effectiveFilter === 'overdue'
      ? overdue.map((item) => appointmentRow(item, 'overdue'))
      : effectiveFilter === 'today'
        ? todayItems.map((item) => appointmentRow(item, 'today'))
        : effectiveFilter === 'due'
          ? financialDueToday.map((item) => dueRow(item))
          : upcoming.map((item) => appointmentRow(item, 'upcoming'));

  return shell(
    <FadeInView delay={motion.duration.fast}>
      <View style={styles.heading}>
        <Text style={{ color: bandForeground }} variant="pageTitle">
          Ações do dia
        </Text>
        <Text style={{ color: bandForeground }} variant="bodySmall">
          {actionCount ? summaryParts.join(' · ') : 'Nada pendente para hoje.'}
        </Text>
      </View>
    </FadeInView>,
    <>
      <AgendaCalendar
        dayStatus={dayStatus}
        month={month}
        onMonthChange={setMonth}
        onSelectDay={setSelectedDay}
        selectedDay={selectedDay}
        today={today}
      />

      {daySelection ? (
        <View style={styles.section}>
          <View style={styles.dayHeading}>
            <Text variant="sectionTitle">
              {formatDateForDisplay(selectedDay ?? '')}
            </Text>
            <Button
              label="Limpar"
              onPress={() => setSelectedDay(null)}
              variant="ghost"
            />
          </View>
          {daySelection.length ? (
            <AgendaGroup>
              {daySelection.map((item) =>
                appointmentRow(
                  item,
                  item.overdue
                    ? 'overdue'
                    : item.scheduledOn === today
                      ? 'today'
                      : 'upcoming',
                ),
              )}
            </AgendaGroup>
          ) : (
            <EmptyState
              description="Nenhuma visita agendada para este dia."
              icon="date"
              title="Dia livre"
            />
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <SegmentedControl
            label="Filtrar por urgência"
            onChange={setStatusFilter}
            options={filterOptions}
            scrollable
            value={effectiveFilter}
          />
          {activeList.length ? (
            <AgendaGroup>{activeList}</AgendaGroup>
          ) : (
            <InlineFeedback message="Nada nesta categoria." variant="success" />
          )}
        </View>
      )}
    </>,
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { gap: spacing.lg, paddingHorizontal: spacing.lg },
  band: {
    alignSelf: 'center',
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heading: { gap: spacing.xs },
  section: { gap: spacing.sm },
  dayHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  group: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  mark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  calendar: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarNav: { alignItems: 'center', flexDirection: 'row' },
  calendarMonthLabel: { textTransform: 'capitalize' },
  calendarWeekRow: { flexDirection: 'row' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { alignItems: 'center', width: `${100 / 7}%` },
  calendarDay: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginVertical: 2,
    width: '72%',
  },
  calendarDayOutside: {
    borderStyle: 'dashed',
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
});
