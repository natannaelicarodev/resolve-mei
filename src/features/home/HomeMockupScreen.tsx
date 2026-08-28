import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion';
import { Badge, Icon, Skeleton, Text } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { getProfileInitial } from '@/features/profile/avatar';
import type { Quote } from '@/features/quotes/api';
import {
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from '@/features/quotes/domain';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import type { DashboardPeriod, HomeDashboardData } from './api';

const PERIODS = [
  { compact: 'Este mês', label: 'Este mês', value: 'month' },
  { compact: '3 meses', label: 'Últimos 3 meses', value: '3months' },
  { compact: '6 meses', label: 'Últimos 6 meses', value: '6months' },
  { compact: 'Este ano', label: 'Este ano', value: 'year' },
] as const;

export interface HomeMockupScreenProps {
  firstName?: string;
  avatarUrl?: string;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  dashboard?: HomeDashboardData;
  dashboardLoading?: boolean;
  dashboardError?: boolean;
  onRetry?: () => void;
  recentQuotes?: Quote[];
  recentQuotesLoading?: boolean;
}

function Header({
  firstName,
  avatarUrl,
}: Pick<HomeMockupScreenProps, 'firstName' | 'avatarUrl'>) {
  const { colors } = useTheme();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <View style={styles.header}>
      {avatarUrl ? (
        <Image
          accessibilityLabel={`Foto de ${firstName ?? 'perfil'}`}
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.primaryPressed]}
          style={styles.avatar}
        >
          <Text color="textOnPrimary" variant="label">
            {getProfileInitial(firstName)}
          </Text>
        </LinearGradient>
      )}
      <View style={styles.greeting}>
        <Text numberOfLines={1} style={styles.greetingTitle} variant="label">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text
          color="textMuted"
          numberOfLines={1}
          style={styles.greetingSubtitle}
          variant="caption"
        >
          Veja como está o seu negócio hoje
        </Text>
      </View>
      <AnimatedPressable
        accessibilityLabel="Abrir configurações"
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => router.push('/settings')}
        style={[
          styles.settings,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon color="textSecondary" name="settings" size="small" />
      </AnimatedPressable>
    </View>
  );
}

function PeriodPicker({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = PERIODS.find((item) => item.value === value) ?? PERIODS[0];
  return (
    <>
      <AnimatedPressable
        accessibilityLabel={`Período: ${selected.label}`}
        accessibilityRole="button"
        hitSlop={7}
        onPress={() => setOpen(true)}
        style={[styles.period, { backgroundColor: colors.surfacePressed }]}
      >
        <Text numberOfLines={1} style={styles.periodText} variant="status">
          {selected.compact}
        </Text>
        <Icon color="textSecondary" name="expand" size="small" />
      </AnimatedPressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.periodMenu,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            {PERIODS.map((item) => (
              <AnimatedPressable
                accessibilityRole="radio"
                accessibilityState={{ checked: item.value === value }}
                key={item.value}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={styles.periodOption}
              >
                <Text
                  color={item.value === value ? 'primary' : 'textPrimary'}
                  variant="label"
                >
                  {item.label}
                </Text>
              </AnimatedPressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function trendText(current: number, previous: number) {
  if (!previous)
    return current ? 'Sem base no período anterior' : 'Sem valores no período';
  const percent = Math.round(((current - previous) / previous) * 100);
  if (!percent) return 'Estável em relação ao período anterior';
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}% sobre o período anterior`;
}

function AreaChart({
  monthly,
  period,
}: {
  monthly: HomeDashboardData['monthly'];
  period: DashboardPeriod;
}) {
  const { colors } = useTheme();
  const width = 354;
  const height = 58;
  const maximum = Math.max(...monthly.map((item) => item.approvedCents), 1);
  const points = monthly.map((item, index) => ({
    x:
      monthly.length === 1 ? width / 2 : (index / (monthly.length - 1)) * width,
    y: 8 + (1 - item.approvedCents / maximum) * 38,
  }));
  const line = points.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1]!;
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const area = points.length
    ? `${line} L ${points.at(-1)?.x ?? 0} ${height} L ${points[0]?.x ?? 0} ${height} Z`
    : '';
  const periodLabel =
    period === 'month'
      ? 'neste mês'
      : period === 'year'
        ? 'neste ano'
        : `nos últimos ${period === '3months' ? 3 : 6} meses`;
  return (
    <View
      accessible
      accessibilityLabel={`Gráfico do valor aprovado ${periodLabel}`}
      style={styles.chartBlock}
    >
      <Svg
        accessibilityElementsHidden
        height={height}
        importantForAccessibility="no-hide-descendants"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        <Defs>
          <SvgLinearGradient id="homeArea" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.34} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path d={area} fill="url(#homeArea)" />
        <Path
          d={line}
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      </Svg>
      <Text
        align="center"
        color="textMuted"
        style={styles.chartCaption}
        variant="caption"
      >
        Valor aprovado {periodLabel}
      </Text>
    </View>
  );
}

function BalanceCard(
  props: Pick<
    HomeMockupScreenProps,
    | 'dashboard'
    | 'dashboardLoading'
    | 'dashboardError'
    | 'period'
    | 'onPeriodChange'
    | 'onRetry'
  >,
) {
  const { colors, resolvedTheme } = useTheme();
  const data = props.dashboard;
  return (
    <View
      style={[
        styles.balanceCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        getThemeShadows(resolvedTheme).floating,
      ]}
      testID="mockup-balance-card"
    >
      <View style={styles.balanceTop}>
        <Text color="textSecondary" variant="caption">
          Valor aprovado
        </Text>
        <PeriodPicker onChange={props.onPeriodChange} value={props.period} />
      </View>
      {props.dashboardLoading ? (
        <>
          <Skeleton height={38} width="65%" />
          <Skeleton height={70} />
        </>
      ) : props.dashboardError || !data ? (
        <AnimatedPressable
          accessibilityRole="button"
          onPress={props.onRetry}
          style={styles.retry}
        >
          <Text color="primary" variant="label">
            Tentar novamente
          </Text>
        </AnimatedPressable>
      ) : (
        <>
          <Text
            adjustsFontSizeToFit
            accessibilityLabel={`Valor aprovado: ${formatMoney(data.approvedCents)}`}
            minimumFontScale={0.72}
            numberOfLines={1}
            style={styles.heroValue}
          >
            {formatMoney(data.approvedCents)}
          </Text>
          <View
            style={[styles.trendPill, { backgroundColor: colors.accentSubtle }]}
          >
            <Icon
              color="accent"
              name={
                data.approvedCents >= data.previousApprovedCents
                  ? 'trendUp'
                  : 'trendDown'
              }
              size="small"
            />
            <Text
              color="accent"
              numberOfLines={1}
              style={styles.trendText}
              variant="status"
            >
              {trendText(data.approvedCents, data.previousApprovedCents)}
            </Text>
          </View>
          <AreaChart monthly={data.monthly} period={props.period} />
        </>
      )}
    </View>
  );
}

function Composition({
  data,
  loading,
}: {
  data?: HomeDashboardData;
  loading?: boolean;
}) {
  const { colors, resolvedTheme } = useTheme();
  const total = data ? data.approvedCents + data.negotiatingCents : 0;
  const approved = total ? Math.round((data!.approvedCents / total) * 100) : 0;
  return (
    <View
      style={[
        styles.composition,
        { backgroundColor: colors.surface, borderColor: colors.border },
        getThemeShadows(resolvedTheme).card,
      ]}
      testID="mockup-composition-card"
    >
      <Text variant="label">Composição do período</Text>
      {loading ? (
        <Skeleton height={7} />
      ) : (
        <View
          accessible
          accessibilityLabel={`${approved}% aprovado e ${total ? 100 - approved : 0}% em negociação`}
          style={[
            styles.compositionTrack,
            { backgroundColor: colors.surfacePressed },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryPressed]}
            style={[styles.compositionPart, { width: `${approved}%` }]}
          />
          <View
            style={[
              styles.compositionPart,
              {
                backgroundColor: colors.accent,
                width: `${total ? 100 - approved : 0}%`,
              },
            ]}
          />
        </View>
      )}
      <CompositionLine
        color={colors.primary}
        label="Aprovado"
        value={formatMoney(data?.approvedCents ?? 0)}
      />
      <CompositionLine
        color={colors.accent}
        label="Em negociação"
        value={formatMoney(data?.negotiatingCents ?? 0)}
      />
    </View>
  );
}

function CompositionLine({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.compositionLine}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text color="textSecondary" variant="caption">
        {label}
      </Text>
      <Text style={styles.compositionValue} variant="status">
        {value}
      </Text>
    </View>
  );
}

function QuickActions() {
  const { colors, resolvedTheme } = useTheme();
  const actions = [
    {
      label: 'Novo\norçamento',
      route: '/quotes/new',
      icon: 'file-document-plus-outline',
      primary: true,
    },
    {
      label: 'Novo\ncliente',
      route: '/clients/new',
      icon: 'account-plus-outline',
      primary: false,
    },
    {
      label: 'Novo\nserviço',
      route: '/services/new',
      icon: 'briefcase-plus-outline',
      primary: false,
    },
  ] as const;
  return (
    <View style={styles.section}>
      <Text variant="label">Ações rápidas</Text>
      <View style={styles.quickRow}>
        {actions.map((action) => (
          <AnimatedPressable
            accessibilityLabel={action.label.replace('\n', ' ')}
            accessibilityRole="button"
            key={action.route}
            onPress={() => router.push(action.route)}
            style={styles.quickAction}
          >
            {action.primary ? (
              <LinearGradient
                colors={[colors.primary, colors.primaryPressed]}
                style={[
                  styles.quickBadge,
                  getThemeShadows(resolvedTheme).floating,
                ]}
              >
                <MaterialCommunityIcons
                  color={colors.textOnPrimary}
                  name={action.icon}
                  size={22}
                  testID={`quick-action-icon-${action.route}`}
                />
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.quickBadge,
                  { backgroundColor: colors.primarySubtle },
                ]}
              >
                <MaterialCommunityIcons
                  color={colors.primary}
                  name={action.icon}
                  size={22}
                  testID={`quick-action-icon-${action.route}`}
                />
              </View>
            )}
            <Text
              align="center"
              color="textSecondary"
              style={styles.quickLabel}
              variant="status"
            >
              {action.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

function RecentQuotes({
  quotes,
  loading,
}: {
  quotes?: Quote[];
  loading?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text variant="label">Orçamentos recentes</Text>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/quotes')}
          style={styles.seeAll}
        >
          <Text color="primary" variant="status">
            Ver todos
          </Text>
        </AnimatedPressable>
      </View>
      {loading ? (
        <>
          <Skeleton height={66} />
          <Skeleton height={66} />
        </>
      ) : quotes?.length ? (
        quotes.slice(0, 2).map((quote, index) => {
          const display = getDisplayQuoteStatus(
            quote.status,
            quote.valid_until,
          );
          return (
            <AnimatedPressable
              accessibilityLabel={`${quote.client_name_snapshot}, orçamento ${formatQuoteNumber(quote.quote_number)}, ${quoteStatusLabels[display]}, ${formatMoney(quote.total_cents)}`}
              accessibilityRole="button"
              key={quote.id}
              onPress={() =>
                router.push({
                  pathname: '/quotes/[id]',
                  params: { id: quote.id },
                } as unknown as Href)
              }
              style={[
                styles.quoteRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <LinearGradient
                colors={
                  index % 2
                    ? [colors.accent, colors.accentCoral]
                    : [colors.primary, colors.primaryPressed]
                }
                style={styles.quoteAvatar}
              >
                <Text color="textOnPrimary" variant="label">
                  {getProfileInitial(quote.client_name_snapshot)}
                </Text>
              </LinearGradient>
              <View style={styles.quoteCopy}>
                <Text numberOfLines={1} variant="label">
                  {quote.client_name_snapshot} · #
                  {formatQuoteNumber(quote.quote_number)}
                </Text>
                <Text color="textMuted" variant="caption">
                  {formatMoney(quote.total_cents)}
                </Text>
              </View>
              <Badge
                label={quoteStatusLabels[display]}
                variant={
                  display === 'approved'
                    ? 'success'
                    : display === 'rejected' || display === 'canceled'
                      ? 'danger'
                      : 'warning'
                }
              />
              <Icon color="textMuted" name="forward" size="small" />
            </AnimatedPressable>
          );
        })
      ) : (
        <Text color="textSecondary" variant="caption">
          Seus orçamentos aparecerão aqui.
        </Text>
      )}
    </View>
  );
}

export function HomeMockupScreen(props: HomeMockupScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header avatarUrl={props.avatarUrl} firstName={props.firstName} />
        <BalanceCard
          dashboard={props.dashboard}
          dashboardError={props.dashboardError}
          dashboardLoading={props.dashboardLoading}
          onPeriodChange={props.onPeriodChange}
          onRetry={props.onRetry}
          period={props.period}
        />
        <Composition data={props.dashboard} loading={props.dashboardLoading} />
        <QuickActions />
        <RecentQuotes
          loading={props.recentQuotesLoading}
          quotes={props.recentQuotes}
        />
      </ScrollView>
      <ProtectedBottomNavigation selected="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 560,
    paddingBottom: 108,
    paddingHorizontal: 18,
    paddingTop: 8,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  greeting: { flex: 1, gap: 1, minWidth: 0, paddingHorizontal: 11 },
  greetingTitle: { fontSize: 15, lineHeight: 20 },
  greetingSubtitle: { fontSize: 11, lineHeight: 16 },
  settings: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  balanceCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  balanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  period: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 3,
    minHeight: 30,
    paddingHorizontal: 10,
  },
  periodText: { fontSize: 11 },
  heroValue: { fontSize: 30, fontWeight: '800', lineHeight: 36 },
  trendPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: { flexShrink: 1, fontSize: 11 },
  chartBlock: { marginHorizontal: -18, marginTop: 5 },
  chartCaption: { fontSize: 10, marginBottom: 12, marginTop: 2 },
  retry: { alignItems: 'center', minHeight: 88, justifyContent: 'center' },
  composition: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compositionTrack: {
    borderRadius: radii.pill,
    flexDirection: 'row',
    height: 7,
    overflow: 'hidden',
  },
  compositionPart: { height: '100%' },
  compositionLine: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  compositionValue: { marginLeft: 2 },
  dot: { borderRadius: 4, height: 7, width: 7 },
  section: { gap: 10, paddingTop: 6 },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seeAll: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minHeight: 88,
    paddingVertical: 2,
  },
  quickBadge: {
    alignItems: 'center',
    borderRadius: 17,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  quickLabel: { fontSize: 11, lineHeight: 14 },
  quoteRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quoteAvatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  quoteCopy: { flex: 1, minWidth: 0 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  periodMenu: {
    alignSelf: 'center',
    borderRadius: 16,
    maxWidth: 360,
    padding: 8,
    width: '100%',
  },
  periodOption: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
});
