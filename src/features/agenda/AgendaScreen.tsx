import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, EmptyState, InlineFeedback, Screen, Skeleton, Text } from '@/components/ui';
import { ProtectedBottomNavigation, ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { formatQuoteNumber } from '@/features/quotes/domain';
import { formatDateForDisplay } from '@/features/quotes/date';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { spacing, useTheme } from '@/theme';
import type { AgendaAppointment } from './domain';
import { formatAppointmentDate } from './domain';
import { useAgendaOverview } from './hooks';

export function AgendaScreen({ userId, businessId }: { userId: string; businessId: string }) {
  const { colors } = useTheme();
  const query = useAgendaOverview(userId, businessId);
  const header = <ProtectedPageHeader title="Agenda e ações do dia" />;
  const shell=(content:ReactNode)=><View style={[styles.page,{backgroundColor:colors.background}]}><Screen contentContainerStyle={styles.content} safeAreaEdges={['top']}>{content}</Screen><ProtectedBottomNavigation selected="agenda"/></View>;
  if (query.isLoading)
    return shell(<>{header}<Skeleton height={120} width="100%" /><Skeleton height={180} width="100%" /></>);
  if (query.isError || !query.data)
    return shell(<>{header}<InlineFeedback message="Não foi possível carregar sua agenda." variant="error" /><Button label="Tentar novamente" onPress={() => void query.refetch()} variant="secondary" /></>);

  const { appointments, financialDueToday, today } = query.data;
  const overdue = appointments.filter((item) => item.overdue);
  const todayItems = appointments.filter((item) => item.scheduledOn === today);
  const upcoming = appointments.filter((item) => item.scheduledOn > today);
  const upcomingByDay = Object.entries(
    upcoming.reduce<Record<string, AgendaAppointment[]>>((groups, item) => {
      (groups[item.scheduledOn] ??= []).push(item);
      return groups;
    }, {}),
  );
  const actionCount = overdue.length + todayItems.length + financialDueToday.length;

  const AppointmentCard = ({ item }: { item: AgendaAppointment }) => (
    <Card style={[styles.card, item.overdue && { borderColor: colors.warning }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="cardTitle">{item.clientName}</Text>
          <Text color="textSecondary">Ordem do orçamento #{formatQuoteNumber(item.quoteNumber)}</Text>
          <Text color="textSecondary">{formatAppointmentDate(item.scheduledOn, item.scheduledTime)}</Text>
          {item.note ? <Text color="textMuted" variant="caption">{item.note}</Text> : null}
        </View>
        {item.overdue ? <Badge label="Atrasada" variant="warning" /> : null}
      </View>
      <Button label="Ver ordem de serviço" onPress={() => router.push({ pathname: '/service-orders/[id]', params: { id: item.serviceOrderId } })} variant="secondary" />
    </Card>
  );

  return shell(
    <>
      {header}
      <View style={styles.heading}>
        <Text variant="pageTitle">Ações do dia</Text>
        <Text color="textSecondary">{actionCount ? `${actionCount} ${actionCount === 1 ? 'item precisa' : 'itens precisam'} da sua atenção.` : 'Nada pendente para hoje.'}</Text>
      </View>

      {overdue.length ? <View style={styles.section}><Text color="warning" variant="sectionTitle">Atrasadas</Text>{overdue.map((item) => <AppointmentCard item={item} key={item.id} />)}</View> : null}
      {todayItems.length ? <View style={styles.section}><Text variant="sectionTitle">Visitas de hoje</Text>{todayItems.map((item) => <AppointmentCard item={item} key={item.id} />)}</View> : null}
      {financialDueToday.length ? (
        <View style={styles.section}>
          <Text variant="sectionTitle">Vencimentos de hoje</Text>
          {financialDueToday.map((item) => (
            <Card key={item.quoteId} style={styles.card}>
              <View style={styles.row}><View style={styles.copy}><Text variant="cardTitle">{item.clientName}</Text><Text color="textSecondary">Orçamento #{formatQuoteNumber(item.quoteNumber)}</Text><Text variant="sectionTitle">{formatBigIntMoney(item.balanceCents)}</Text></View><Badge label="Vence hoje" variant="warning" /></View>
              <Button label="Ver orçamento" onPress={() => router.push({ pathname: '/quotes/[id]', params: { id: item.quoteId } })} variant="secondary" />
            </Card>
          ))}
        </View>
      ) : null}
      {!actionCount ? <InlineFeedback message="Você não tem visitas atrasadas, visitas hoje ou recebimentos vencendo hoje." variant="success" /> : null}

      <View style={styles.section}>
        <Text variant="sectionTitle">Próximas visitas</Text>
        {upcomingByDay.length ? upcomingByDay.map(([date, items]) => (
          <View key={date} style={styles.dayGroup}>
            <Text color="textSecondary" variant="label">{formatDateForDisplay(date)}</Text>
            {items.map((item) => <AppointmentCard item={item} key={item.id} />)}
          </View>
        )) : (
          <EmptyState
            description="As visitas agendadas para os próximos dias aparecerão aqui."
            icon="date"
            title="Nenhuma próxima visita"
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  heading: { gap: spacing.xs },
  section: { gap: spacing.sm },
  card: { gap: spacing.md },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  dayGroup: { gap: spacing.sm },
});
