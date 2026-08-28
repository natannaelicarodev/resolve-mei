import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path, Svg, Text as SvgText } from 'react-native-svg';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Skeleton, Text } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { getProfileInitial } from '@/features/profile/avatar';
import type { Quote } from '@/features/quotes/api';
import { formatDateForDisplay } from '@/features/quotes/date';
import { formatMoney, formatQuoteNumber } from '@/features/quotes/domain';
import type { DashboardPeriod, HomeDashboardData } from './api';

const PERIODS = [
  { compact: 'Este mês', label: 'Este mês', value: 'month' },
  { compact: '3 meses', label: 'Últimos 3 meses', value: '3months' },
  { compact: '6 meses', label: 'Últimos 6 meses', value: '6months' },
  { compact: 'Este ano', label: 'Este ano', value: 'year' },
] as const;

const HOME = {
  background: '#14161A',
  card: '#1E2126',
  border: '#2C3037',
  muted: '#6E7076',
  teal: '#2DD4BF',
  tealDark: '#163B36',
  blue: '#3488F6',
  purple: '#B05CFF',
  green: '#28D17C',
} as const;

const CARD_SHADOW = {
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.40), 0 6px 18px rgba(0, 0, 0, 0.35)',
  elevation: 5,
} as const;

const ELEVATED_SHADOW = {
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.50), 0 14px 28px rgba(0, 0, 0, 0.40)',
  elevation: 8,
} as const;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function useAnimatedNumber(target: number, duration = 700, active = true) {
  const reducedMotion = useReducedMotion();
  const showImmediately = reducedMotion || process.env.NODE_ENV === 'test';
  const [value] = useState(() => new Animated.Value(target));
  const [displayValue, setDisplayValue] = useState(active ? target : 0);

  useEffect(() => {
    if (!active) {
      value.setValue(0);
      return;
    }
    if (showImmediately) {
      value.setValue(target);
      return;
    }
    value.stopAnimation();
    value.setValue(0);
    const subscription = value.addListener(({ value: next }) =>
      setDisplayValue(Math.round(next)),
    );
    const animation = Animated.timing(value, {
      duration,
      easing: Easing.out(Easing.cubic),
      toValue: target,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      value.removeListener(subscription);
    };
  }, [active, duration, showImmediately, target, value]);

  return showImmediately ? (active ? target : 0) : displayValue;
}

// `nativeDriver` must stay false for callers that interpolate this value into
// a non-transform/opacity prop (SVG strokeDasharray, layout width, etc.) -
// only opacity/transform consumers can safely opt into the UI thread.
function useRevealProgress(
  active: boolean,
  delay = 0,
  duration = 700,
  nativeDriver = false,
) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(active ? 1 : 0));
  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const animation = Animated.timing(progress, {
      delay: reducedMotion ? 0 : delay,
      duration: reducedMotion ? 1 : duration,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [active, delay, duration, nativeDriver, progress, reducedMotion]);
  return progress;
}

function VisibilityTrigger({
  children,
  onVisible,
  scrollY,
  testID,
  viewportHeight,
}: {
  children: ReactNode;
  onVisible: () => void;
  scrollY: Animated.Value;
  testID?: string;
  viewportHeight: number;
}) {
  const topRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const revealedRef = useRef(false);

  const revealIfVisible = useCallback(
    (offset: number) => {
      if (
        revealedRef.current ||
        topRef.current === null ||
        topRef.current > offset + viewportHeight * 0.78
      )
        return;
      revealedRef.current = true;
      onVisible();
    },
    [onVisible, viewportHeight],
  );

  useEffect(() => {
    const subscription = scrollY.addListener(({ value }) => {
      scrollOffsetRef.current = value;
      revealIfVisible(value);
    });
    revealIfVisible(scrollOffsetRef.current);
    return () => scrollY.removeListener(subscription);
  }, [revealIfVisible, scrollY]);

  const handleLayout = (event: LayoutChangeEvent) => {
    topRef.current = event.nativeEvent.layout.y;
    revealIfVisible(scrollOffsetRef.current);
  };

  return (
    <View onLayout={handleLayout} testID={testID}>
      {children}
    </View>
  );
}

function formatDashboardMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}

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
  serviceCount?: number;
}

function Header({
  firstName,
  avatarUrl,
}: Pick<HomeMockupScreenProps, 'firstName' | 'avatarUrl'>) {
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
          testID="profile-image"
        />
      ) : (
        <View
          style={[styles.avatar, styles.avatarFallback]}
          testID="profile-image-fallback"
        >
          <Text style={styles.avatarInitial} variant="label">
            {getProfileInitial(firstName)}
          </Text>
        </View>
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
          Painel do seu negócio
        </Text>
      </View>
      <AnimatedPressable
        accessibilityLabel="Abrir configurações"
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => router.push('/settings')}
        style={[
          styles.settings,
          { backgroundColor: HOME.card, borderColor: HOME.border },
        ]}
      >
        <MaterialCommunityIcons color="#B9BEC5" name="tune-variant" size={21} />
      </AnimatedPressable>
    </View>
  );
}

function PeriodPicker({
  displayLabel,
  value,
  onChange,
}: {
  displayLabel?: string;
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = PERIODS.find((item) => item.value === value) ?? PERIODS[0];
  return (
    <>
      <AnimatedPressable
        accessibilityLabel={`Período: ${selected.label}`}
        accessibilityRole="button"
        hitSlop={7}
        onPress={() => setOpen(true)}
        style={styles.periodChip}
      >
        <Text numberOfLines={1} style={styles.periodChipText} variant="status">
          {displayLabel ?? selected.compact}
        </Text>
      </AnimatedPressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.72)' }]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.periodMenu}
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
                  style={
                    item.value === value ? styles.periodOptionActive : undefined
                  }
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
    return current ? 'SEM BASE NO MÊS ANTERIOR' : 'SEM VALORES NO PERÍODO';
  const percent = Math.round(((current - previous) / previous) * 100);
  if (!percent) return 'ESTÁVEL VS. MÊS ANTERIOR';
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}% VS. MÊS ANTERIOR`;
}

function AreaChart({
  monthly,
  period,
}: {
  monthly: HomeDashboardData['monthly'];
  period: DashboardPeriod;
}) {
  // BACKLOG(perf): this drives strokeDashoffset (SVG), which the classic
  // Animated API can't run on the native/UI thread - stays JS-driven.
  // Migrating to react-native-reanimated's useAnimatedProps (already a
  // project dependency) would move it off the JS thread entirely, same as
  // the ranking bar's width fill in RankingRow below. Left out of the
  // 2026-08-28 Home performance pass since neither showed evidence of
  // being the actual jank source (see AnimatedApprovedValue et al.) - do
  // this only if profiling shows it's still needed.
  const reducedMotion = useReducedMotion();
  const [drawProgress] = useState(() => new Animated.Value(0));
  const width = 340;
  const height = 130;
  const maximum = Math.max(...monthly.map((item) => item.approvedCents), 1);
  const points = monthly.map((item, index) => ({
    x: monthly.length === 1 ? 285 : 10 + (index / (monthly.length - 1)) * 275,
    y: 15 + (1 - item.approvedCents / maximum) * 83,
  }));
  const line = points.reduce(
    (path, point, index) =>
      `${path}${index ? ' L' : 'M'} ${point.x} ${point.y}`,
    '',
  );
  const periodLabel =
    period === 'month'
      ? 'neste mês'
      : period === 'year'
        ? 'neste ano'
        : `nos últimos ${period === '3months' ? 3 : 6} meses`;
  useEffect(() => {
    drawProgress.setValue(reducedMotion ? 1 : 0);
    const animation = Animated.timing(drawProgress, {
      delay: reducedMotion ? 0 : 120,
      duration: reducedMotion ? 1 : 850,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [drawProgress, monthly, reducedMotion]);
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
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        {[10, 45, 80, 105].map((y) => (
          <Path
            d={`M 0 ${y} L ${width} ${y}`}
            key={y}
            stroke="#2B3036"
            strokeWidth={1}
          />
        ))}
        <AnimatedPath
          d={line}
          fill="none"
          stroke={HOME.teal}
          strokeDasharray="420 420"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [420, 0],
          })}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
        {points.map((point, index) => (
          <Circle
            cx={point.x}
            cy={point.y}
            fill={HOME.card}
            key={`${point.x}:${point.y}`}
            r={index === points.length - 1 ? 4.5 : 3.5}
            stroke={HOME.teal}
            strokeWidth={2.4}
          />
        ))}
        {monthly.map((item, index) => (
          <SvgText
            fill={HOME.muted}
            fontFamily="Poppins_400Regular"
            fontSize={8.5}
            key={`${item.month}:label`}
            textAnchor="middle"
            x={points[index]?.x ?? 0}
            y={124}
          >
            {new Intl.DateTimeFormat('pt-BR', { month: 'short' })
              .format(new Date(`${item.month}T12:00:00`))
              .replace('.', '')
              .toUpperCase()}
          </SvgText>
        ))}
        {points.length ? (
          <SvgText
            fill="#F2F2F0"
            fontFamily="Poppins_700Bold"
            fontSize={8.5}
            textAnchor="middle"
            x={points.at(-1)?.x ?? 0}
            y={Math.max(8, (points.at(-1)?.y ?? 15) - 8)}
          >
            {formatDashboardMoney(monthly.at(-1)?.approvedCents ?? 0)}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

// Isolated so the per-frame updates driving the count-up animation only
// re-render this small value, not the whole BalanceCard (period picker,
// trend pill, Intl formatting, etc.).
function AnimatedApprovedValue({
  approvedCents,
  hidden,
}: {
  approvedCents: number;
  hidden: boolean;
}) {
  const animatedApprovedCents = useAnimatedNumber(approvedCents, 900);
  return (
    <Text
      adjustsFontSizeToFit
      accessibilityLabel={`Valor aprovado: ${formatMoney(approvedCents)}`}
      minimumFontScale={0.72}
      numberOfLines={1}
      style={styles.heroValue}
    >
      {hidden ? 'R$ ••••••' : formatDashboardMoney(animatedApprovedCents)}
    </Text>
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
  const data = props.dashboard;
  const [valuesHidden, setValuesHidden] = useState(false);
  const periodDate = data?.periodEnd
    ? new Date(new Date(`${data.periodEnd}T12:00:00`).getTime() - 86_400_000)
    : new Date();
  const periodLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
    .format(periodDate)
    .replace('.', '')
    .replace(' de ', ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
  return (
    <View
      style={[
        styles.balanceCard,
        { backgroundColor: HOME.card, borderColor: HOME.border },
      ]}
      testID="mockup-balance-card"
    >
      <View style={styles.balanceTop}>
        <View style={styles.balanceHeading}>
          <Text style={styles.panelLabel} variant="label">
            Balanço estimado
          </Text>
        </View>
        <View style={styles.balanceControls}>
          <AnimatedPressable
            accessibilityLabel={
              valuesHidden ? 'Mostrar valores' : 'Ocultar valores'
            }
            accessibilityRole="button"
            onPress={() => setValuesHidden((hidden) => !hidden)}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              color={HOME.muted}
              name={valuesHidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
            />
          </AnimatedPressable>
          <PeriodPicker
            displayLabel={periodLabel}
            onChange={props.onPeriodChange}
            value={props.period}
          />
        </View>
      </View>
      <Text color="textMuted" style={styles.approvedLabel} variant="caption">
        Aprovado
      </Text>
      {props.dashboardLoading ? (
        <>
          <Skeleton height={38} width="62%" />
          <View style={styles.skeletonTrendRow}>
            <Skeleton height={12} radius={3} width={18} />
            <Skeleton height={9} width={126} />
          </View>
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
          <AnimatedApprovedValue
            approvedCents={data.approvedCents}
            hidden={valuesHidden}
          />
          <View style={styles.trendPill}>
            <MaterialCommunityIcons
              color={
                data.approvedCents >= data.previousApprovedCents
                  ? HOME.teal
                  : '#E5484D'
              }
              name={
                data.approvedCents >= data.previousApprovedCents
                  ? 'trending-up'
                  : 'trending-down'
              }
              size={17}
            />
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    data.approvedCents >= data.previousApprovedCents
                      ? HOME.teal
                      : '#E5484D',
                },
              ]}
              numberOfLines={1}
              variant="status"
            >
              {trendText(data.approvedCents, data.previousApprovedCents)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// Isolated for the same reason as AnimatedApprovedValue: each count-up should
// only re-render its own tiny value, not the whole metrics block (grid,
// deltas, and the four OperationStat tiles below it).
function AnimatedTicketValue({ ticket }: { ticket: number }) {
  const animatedTicket = useAnimatedNumber(ticket);
  return (
    <Text style={styles.metricValue} variant="label">
      {formatDashboardMoney(animatedTicket)}
    </Text>
  );
}

function AnimatedApprovalRateValue({ rate }: { rate: number }) {
  const animatedApprovalRate = useAnimatedNumber(rate);
  return (
    <Text style={styles.metricValue} variant="label">
      {animatedApprovalRate}%
    </Text>
  );
}

function OperationalMetrics({
  data,
  serviceCount,
}: {
  data?: HomeDashboardData;
  serviceCount?: number;
}) {
  const approvalRate = data?.quoteCount
    ? Math.round((data.approvedCount / data.quoteCount) * 100)
    : 0;
  const currentTicket = data?.approvedCount
    ? Math.round(data.approvedCents / data.approvedCount)
    : 0;
  const previousTicket = data?.previousApprovedCount
    ? Math.round(data.previousApprovedCents / data.previousApprovedCount)
    : 0;
  const ticketChange = previousTicket
    ? Math.round(((currentTicket - previousTicket) / previousTicket) * 100)
    : null;
  const previousApprovalRate = data?.previousQuoteCount
    ? Math.round((data.previousApprovedCount / data.previousQuoteCount) * 100)
    : null;
  const approvalChange =
    previousApprovalRate === null ? null : approvalRate - previousApprovalRate;

  const renderDelta = (value: number | null) => {
    if (value === null)
      return (
        <Text style={styles.metricNoPeriod} variant="status">
          Sem período anterior
        </Text>
      );
    const positive = value >= 0;
    const color = positive ? HOME.green : '#FF4D55';
    return (
      <View style={styles.metricDelta}>
        <MaterialCommunityIcons
          color={color}
          name={positive ? 'trending-up' : 'trending-down'}
          size={14}
        />
        <Text style={[styles.metricPercentage, { color }]} variant="status">
          {positive ? '+' : '−'}
          {Math.abs(value)}%
        </Text>
      </View>
    );
  };
  return (
    <View style={styles.operationalBlock}>
      <View style={styles.metricGrid}>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: HOME.card, borderColor: HOME.border },
          ]}
        >
          <Text color="textMuted" style={styles.metricLabel} variant="caption">
            Ticket médio
          </Text>
          <AnimatedTicketValue ticket={currentTicket} />
          {renderDelta(ticketChange)}
        </View>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: HOME.card, borderColor: HOME.border },
          ]}
        >
          <Text color="textMuted" style={styles.metricLabel} variant="caption">
            Taxa de aprovação
          </Text>
          <AnimatedApprovalRateValue rate={approvalRate} />
          {renderDelta(approvalChange)}
        </View>
      </View>
      <View style={styles.operationStrip} testID="mockup-composition-card">
        {[
          {
            color: '#45A8FF',
            icon: 'account-outline',
            label: 'Clientes',
            value: data?.clients.total ?? 0,
          },
          {
            color: '#2DD4BF',
            icon: 'briefcase-outline',
            label: 'Serviços',
            value: serviceCount ?? data?.services.length ?? 0,
          },
          {
            color: '#52D58A',
            icon: 'check-circle-outline',
            label: 'Aprovados',
            value: data?.approvedCount ?? 0,
          },
          {
            color: '#B48AF1',
            icon: 'clock-outline',
            label: 'Pendentes',
            value: data?.openCount ?? 0,
          },
        ].map((item) => (
          <OperationStat item={item} key={item.label} />
        ))}
      </View>
    </View>
  );
}

function OperationStat({
  item,
}: {
  item: { color: string; icon: string; label: string; value: number };
}) {
  const animatedValue = useAnimatedNumber(item.value, 600);
  return (
    <View
      accessible
      accessibilityLabel={`${item.label}: ${item.value}`}
      style={styles.operationItem}
    >
      <View
        style={[styles.operationIcon, { backgroundColor: `${item.color}1A` }]}
      >
        <MaterialCommunityIcons
          color={item.color}
          name={item.icon as never}
          size={17}
        />
      </View>
      <Text style={styles.operationValue} variant="label">
        {animatedValue}
      </Text>
      <Text color="textMuted" style={styles.operationLabel} variant="caption">
        {item.label}
      </Text>
    </View>
  );
}

function RevenueCard({
  data,
  period,
}: {
  data?: HomeDashboardData;
  period: DashboardPeriod;
}) {
  return (
    <View
      style={[
        styles.dashboardCard,
        { backgroundColor: HOME.card, borderColor: HOME.border },
      ]}
    >
      <View style={styles.dashboardCardHeader}>
        <View>
          <Text style={styles.dashboardTitle} variant="label">
            Faturamento
          </Text>
          <Text
            color="textMuted"
            style={styles.dashboardEyebrow}
            variant="caption"
          >
            ÚLTIMOS 6 MESES
          </Text>
        </View>
        <Text style={styles.dashboardHeaderValue} variant="label">
          {formatDashboardMoney(data?.approvedCents ?? 0)}
        </Text>
      </View>
      {data?.monthly.length ? (
        <AreaChart monthly={data.monthly} period={period} />
      ) : (
        <Text color="textMuted" variant="caption">
          O histórico aparecerá após o primeiro orçamento aprovado.
        </Text>
      )}
    </View>
  );
}

function ServiceRevenue({
  active,
  data,
}: {
  active: boolean;
  data?: HomeDashboardData;
}) {
  const services = data?.services.slice(0, 3) ?? [];
  const total = services.reduce((sum, service) => sum + service.totalCents, 0);
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const palette = ['#2DD4BF', '#45A8FF', '#28D17C'];
  return (
    <View
      style={[
        styles.dashboardCard,
        { backgroundColor: HOME.card, borderColor: HOME.border },
      ]}
    >
      <View style={styles.dashboardCardHeader}>
        <View>
          <Text style={styles.dashboardTitle} variant="label">
            Receita por serviço
          </Text>
          <Text
            color="textMuted"
            style={styles.dashboardEyebrow}
            variant="caption"
          >
            DISTRIBUIÇÃO DO PERÍODO
          </Text>
        </View>
        <Text style={styles.dashboardHeaderValue} variant="label">
          {formatDashboardMoney(total)}
        </Text>
      </View>
      {services.length ? (
        <View style={styles.serviceRevenueBody}>
          <View style={styles.serviceDonut}>
            <Svg height={80} viewBox="0 0 80 80" width={80}>
              <Circle
                cx={40}
                cy={40}
                fill="none"
                r={radius}
                stroke="#30343A"
                strokeWidth={14}
              />
              {services.map((service, index) => {
                const length = total
                  ? (service.totalCents / total) * circumference
                  : 0;
                const dashOffset = total
                  ? -services
                      .slice(0, index)
                      .reduce(
                        (sum, item) =>
                          sum + (item.totalCents / total) * circumference,
                        0,
                      )
                  : 0;
                return (
                  <AnimatedDonutSegment
                    active={active}
                    circumference={circumference}
                    color={palette[index] ?? HOME.teal}
                    dashOffset={dashOffset}
                    delay={index * 190}
                    key={`${service.serviceId}:${service.name}`}
                    length={length}
                    radius={radius}
                  />
                );
              })}
            </Svg>
          </View>
          <View style={styles.serviceRevenueList}>
            {services.map((service, index) => {
              const percentage = total
                ? Math.round((service.totalCents / total) * 100)
                : 0;
              return (
                <ServiceRevenueStat
                  active={active}
                  color={palette[index] ?? HOME.teal}
                  index={index}
                  key={`${service.name}:revenue`}
                  name={service.name}
                  percentage={percentage}
                  totalCents={service.totalCents}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <Text color="textMuted" variant="caption">
          Os serviços aparecerão conforme forem adicionados aos orçamentos.
        </Text>
      )}
    </View>
  );
}

function AnimatedDonutSegment({
  active,
  circumference,
  color,
  dashOffset,
  delay,
  length,
  radius,
}: {
  active: boolean;
  circumference: number;
  color: string;
  dashOffset: number;
  delay: number;
  length: number;
  radius: number;
}) {
  // BACKLOG(perf): strokeDasharray can't run on the native/UI thread via the
  // classic Animated API - see the AreaChart drawProgress note above.
  const progress = useRevealProgress(active, delay, 720);
  return (
    <AnimatedCircle
      cx={40}
      cy={40}
      fill="none"
      origin="40, 40"
      r={radius}
      rotation={-90}
      stroke={color}
      strokeDasharray={
        progress.interpolate({
          inputRange: [0, 1],
          outputRange: [
            `0 ${circumference}`,
            `${length} ${circumference - length}`,
          ],
        }) as never
      }
      strokeDashoffset={dashOffset}
      strokeWidth={14}
    />
  );
}

function ServiceRevenueStat({
  active,
  color,
  index,
  name,
  percentage,
  totalCents,
}: {
  active: boolean;
  color: string;
  index: number;
  name: string;
  percentage: number;
  totalCents: number;
}) {
  const progress = useRevealProgress(active, 100 + index * 70, 480, true);
  const animatedPercentage = useAnimatedNumber(percentage, 620, active);
  const animatedCents = useAnimatedNumber(totalCents, 720, active);
  return (
    <Animated.View
      style={[
        styles.serviceRevenueRow,
        {
          opacity: progress,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.serviceDot, { backgroundColor: color }]} />
      <Text
        numberOfLines={1}
        style={styles.serviceRevenueName}
        variant="caption"
      >
        {name}
      </Text>
      <Text
        style={[styles.servicePercentage, { color }]}
        testID={`service-percentage-${index}`}
        variant="status"
      >
        {animatedPercentage}%
      </Text>
      <Text style={styles.serviceRevenueValue} variant="status">
        {formatDashboardMoney(animatedCents)}
      </Text>
    </Animated.View>
  );
}

function ServiceRanking({
  active,
  data,
}: {
  active: boolean;
  data?: HomeDashboardData;
}) {
  const services = data?.services.slice(0, 4) ?? [];
  const maximum = Math.max(...services.map((service) => service.quoteCount), 1);
  const palette = ['#2DD4BF', '#45A8FF', '#28D17C', '#F0A742'];
  return (
    <View
      style={[
        styles.dashboardCard,
        { backgroundColor: HOME.card, borderColor: HOME.border },
      ]}
    >
      <Text style={styles.dashboardTitle} variant="label">
        Serviços mais orçados
      </Text>
      <Text color="textMuted" style={styles.dashboardEyebrow} variant="caption">
        POR QUANTIDADE
      </Text>
      <View style={styles.rankingList}>
        {services.length ? (
          services.map((service, index) => (
            <ServiceRankingStat
              active={active}
              color={palette[index] ?? HOME.teal}
              index={index}
              key={`${service.name}:ranking`}
              maximum={maximum}
              name={service.name}
              quoteCount={service.quoteCount}
            />
          ))
        ) : (
          <Text color="textMuted" variant="caption">
            Nenhum serviço orçado neste período.
          </Text>
        )}
      </View>
    </View>
  );
}

function ServiceRankingStat({
  active,
  color,
  index,
  maximum,
  name,
  quoteCount,
}: {
  active: boolean;
  color: string;
  index: number;
  maximum: number;
  name: string;
  quoteCount: number;
}) {
  // BACKLOG(perf): width can't run on the native/UI thread via the classic
  // Animated API - see the AreaChart drawProgress note above for the
  // Reanimated migration this would need.
  const progress = useRevealProgress(active, index * 110, 680);
  const animatedCount = useAnimatedNumber(quoteCount, 650, active);
  return (
    <View style={styles.rankingRow}>
      <View style={styles.rankingLabelRow}>
        <Text numberOfLines={1} style={styles.rankingName} variant="caption">
          {name}
        </Text>
        <Text variant="status">{animatedCount}</Text>
      </View>
      <View style={styles.rankingTrack}>
        <Animated.View
          style={[
            styles.rankingFill,
            {
              backgroundColor: color,
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${(quoteCount / maximum) * 100}%`],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function QuickActions() {
  const actions = [
    {
      color: HOME.teal,
      label: 'Orçamento',
      route: '/quotes/new',
      icon: 'file-document-plus-outline',
    },
    {
      color: HOME.blue,
      label: 'Cliente',
      route: '/clients/new',
      icon: 'account-plus-outline',
    },
    {
      color: HOME.purple,
      label: 'Serviço',
      route: '/services/new',
      icon: 'briefcase-plus-outline',
    },
  ] as const;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} variant="label">
        Ações rápidas
      </Text>
      <View style={styles.quickRow}>
        {actions.map((action) => (
          <AnimatedPressable
            accessibilityLabel={action.label}
            accessibilityRole="button"
            containerStyle={styles.quickActionContainer}
            key={action.route}
            onPress={() => router.push(action.route)}
            style={styles.quickAction}
          >
            <View style={[styles.quickBadge, { borderColor: action.color }]}>
              <MaterialCommunityIcons
                color={action.color}
                name={action.icon}
                size={24}
                testID={`quick-action-icon-${action.route}`}
              />
            </View>
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
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle} variant="label">
          Últimos orçamentos aprovados
        </Text>
      </View>
      {loading ? (
        [0, 1].map((item) => (
          <View key={item} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
            </View>
            <View style={[styles.quoteRow, styles.quoteSkeleton]}>
              <Skeleton height={14} width="58%" />
              <Skeleton height={10} width="42%" />
            </View>
          </View>
        ))
      ) : quotes?.filter((quote) => quote.status === 'approved').length ? (
        quotes
          .filter((quote) => quote.status === 'approved')
          .slice(0, 3)
          .map((quote) => {
            return (
              <View key={quote.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>
                <AnimatedPressable
                  accessibilityLabel={`${quote.client_name_snapshot}, orçamento ${formatQuoteNumber(quote.quote_number)}, aprovado, ${formatMoney(quote.total_cents)}`}
                  accessibilityRole="button"
                  containerStyle={styles.quoteContainer}
                  onPress={() =>
                    router.push({
                      pathname: '/quotes/[id]',
                      params: { id: quote.id },
                    } as unknown as Href)
                  }
                  style={[
                    styles.quoteRow,
                    {
                      backgroundColor: HOME.card,
                      borderColor: HOME.border,
                    },
                  ]}
                >
                  <View style={styles.quoteCopy}>
                    <Text numberOfLines={1} variant="label">
                      {quote.client_name_snapshot} · #
                      {formatQuoteNumber(quote.quote_number)}
                    </Text>
                    <Text color="textMuted" variant="caption">
                      {formatDateForDisplay(quote.issued_on)} · ORÇAMENTO
                      APROVADO
                    </Text>
                  </View>
                  <Text style={styles.quoteAmount} variant="label">
                    +{formatDashboardMoney(quote.total_cents)}
                  </Text>
                </AnimatedPressable>
              </View>
            );
          })
      ) : (
        <Text color="textSecondary" variant="caption">
          Seus orçamentos aprovados aparecerão aqui.
        </Text>
      )}
    </View>
  );
}

function HomeDashboardSkeleton() {
  return (
    <View
      accessibilityLabel="Carregando indicadores do painel"
      accessibilityLiveRegion="polite"
      style={styles.dashboardLoading}
    >
      <View style={styles.skeletonMetricGrid}>
        {[0, 1].map((item) => (
          <View key={item} style={styles.skeletonMetricCard}>
            <Skeleton height={9} width="56%" />
            <Skeleton height={20} width="72%" />
            <Skeleton height={8} width="38%" />
          </View>
        ))}
      </View>
      <View style={styles.skeletonOperationStrip}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={styles.skeletonOperationCard}>
            <Skeleton height={28} radius={8} width={28} />
            <Skeleton height={13} width={18} />
            <Skeleton height={7} width="70%" />
          </View>
        ))}
      </View>
      {[158, 132, 142].map((height, index) => (
        <View key={height} style={[styles.skeletonChartCard, { height }]}>
          <View style={styles.skeletonCardHeader}>
            <View style={styles.skeletonHeaderCopy}>
              <Skeleton height={12} width="68%" />
              <Skeleton height={7} width="48%" />
            </View>
            <Skeleton height={14} width={72} />
          </View>
          {index === 0 ? (
            <View style={styles.skeletonChartLines}>
              {[0, 1, 2].map((line) => (
                <Skeleton height={1} key={line} />
              ))}
              <Skeleton height={3} radius={2} width="78%" />
            </View>
          ) : (
            <View style={styles.skeletonChartBody}>
              <Skeleton height={72} radius={36} width={72} />
              <View style={styles.skeletonLegend}>
                <Skeleton height={9} />
                <Skeleton height={9} width="88%" />
                <Skeleton height={9} width="70%" />
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export function HomeMockupScreen(props: HomeMockupScreenProps) {
  const { height: viewportHeight } = useWindowDimensions();
  const [scrollY] = useState(() => new Animated.Value(0));
  const [serviceRevenueVisible, setServiceRevenueVisible] = useState(false);
  const [serviceRankingVisible, setServiceRankingVisible] = useState(false);
  const showServiceRevenue = useCallback(
    () => setServiceRevenueVisible(true),
    [],
  );
  const showServiceRanking = useCallback(
    () => setServiceRankingVisible(true),
    [],
  );
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: HOME.background }]}
    >
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        onScroll={(event) =>
          scrollY.setValue(event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="home-scroll"
      >
        <FadeInView delay={0} distance={8}>
          <Header avatarUrl={props.avatarUrl} firstName={props.firstName} />
        </FadeInView>
        <FadeInView delay={40} distance={10}>
          <BalanceCard
            dashboard={props.dashboard}
            dashboardError={props.dashboardError}
            dashboardLoading={props.dashboardLoading}
            onPeriodChange={props.onPeriodChange}
            onRetry={props.onRetry}
            period={props.period}
          />
        </FadeInView>
        {props.dashboardLoading ? (
          <HomeDashboardSkeleton />
        ) : props.dashboard ? (
          <>
            <FadeInView delay={80} distance={10}>
              <OperationalMetrics
                data={props.dashboard}
                serviceCount={props.serviceCount}
              />
            </FadeInView>
            <FadeInView delay={130} distance={12}>
              <RevenueCard data={props.dashboard} period={props.period} />
            </FadeInView>
            <VisibilityTrigger
              onVisible={showServiceRevenue}
              scrollY={scrollY}
              testID="service-revenue-visibility"
              viewportHeight={viewportHeight}
            >
              <FadeInView delay={180} distance={12}>
                <ServiceRevenue
                  active={serviceRevenueVisible}
                  data={props.dashboard}
                />
              </FadeInView>
            </VisibilityTrigger>
            <VisibilityTrigger
              onVisible={showServiceRanking}
              scrollY={scrollY}
              testID="service-ranking-visibility"
              viewportHeight={viewportHeight}
            >
              <FadeInView delay={230} distance={12}>
                <ServiceRanking
                  active={serviceRankingVisible}
                  data={props.dashboard}
                />
              </FadeInView>
            </VisibilityTrigger>
          </>
        ) : null}
        <FadeInView delay={280} distance={10}>
          <QuickActions />
        </FadeInView>
        <FadeInView delay={330} distance={10}>
          <RecentQuotes
            loading={props.recentQuotesLoading}
            quotes={props.recentQuotes}
          />
        </FadeInView>
      </Animated.ScrollView>
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
    paddingBottom: 18,
    paddingHorizontal: 2,
    paddingTop: 10,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 7,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarFallback: {
    backgroundColor: '#172527',
    borderColor: HOME.teal,
    borderWidth: 1,
  },
  avatarInitial: {
    color: HOME.teal,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  greeting: { flex: 1, gap: 1, minWidth: 0, paddingHorizontal: 11 },
  greetingTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 21,
  },
  greetingSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  settings: {
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  balanceCard: {
    ...ELEVATED_SHADOW,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    overflow: 'hidden',
    padding: 16,
    paddingTop: 16,
  },
  balanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceHeading: { gap: 2 },
  balanceControls: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  eyeButton: {
    alignItems: 'center',
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  periodChip: {
    alignItems: 'center',
    backgroundColor: '#2C3037',
    borderColor: HOME.border,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  periodChipText: { fontSize: 11 },
  panelLabel: { fontFamily: 'Poppins_700Bold', fontSize: 12 },
  approvedLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginTop: 6,
  },
  heroValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    fontVariant: ['tabular-nums'],
    lineHeight: 43,
    marginBottom: 4,
    marginTop: 8,
  },
  trendPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
    marginBottom: 14,
  },
  trendText: {
    flexShrink: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  chartBlock: { marginTop: -2 },
  retry: { alignItems: 'center', minHeight: 88, justifyContent: 'center' },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricCard: {
    ...CARD_SHADOW,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 3,
    minHeight: 94,
    padding: 13,
  },
  metricLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10 },
  metricValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
  },
  metricDelta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
  },
  metricPercentage: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  metricNoPeriod: {
    color: HOME.muted,
    fontFamily: 'Poppins_500Medium',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
  },
  operationalBlock: { gap: 12, width: '100%' },
  operationStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  operationItem: {
    ...CARD_SHADOW,
    alignItems: 'center',
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 5,
    minHeight: 91,
    paddingVertical: 10,
  },
  operationIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  operationValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
  operationLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
  },
  dashboardCard: {
    ...CARD_SHADOW,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    overflow: 'hidden',
    padding: 16,
  },
  dashboardLoading: { gap: 12, width: '100%' },
  skeletonTrendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    marginTop: 8,
  },
  skeletonMetricGrid: { flexDirection: 'row', gap: 8 },
  skeletonMetricCard: {
    ...CARD_SHADOW,
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 8,
    minHeight: 94,
    padding: 13,
  },
  skeletonOperationStrip: { flexDirection: 'row', gap: 8 },
  skeletonOperationCard: {
    ...CARD_SHADOW,
    alignItems: 'center',
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 7,
    minHeight: 91,
    paddingVertical: 10,
  },
  skeletonChartCard: {
    ...CARD_SHADOW,
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
    overflow: 'hidden',
    padding: 16,
  },
  skeletonCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonHeaderCopy: { flex: 1, gap: 7, maxWidth: 170 },
  skeletonChartLines: {
    flex: 1,
    gap: 19,
    justifyContent: 'center',
  },
  skeletonChartBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 18,
  },
  skeletonLegend: { flex: 1, gap: 12 },
  dashboardCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashboardEyebrow: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5,
    letterSpacing: 0,
    lineHeight: 13,
  },
  dashboardHeaderValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  dashboardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  serviceRevenueBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    minHeight: 80,
  },
  serviceDonut: { alignItems: 'center', justifyContent: 'center' },
  serviceRevenueList: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  serviceRevenueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minHeight: 22,
  },
  serviceDot: { borderRadius: 4, height: 7, width: 7 },
  servicePercentage: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 8.5,
    lineHeight: 13,
  },
  serviceRevenueName: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    lineHeight: 14,
    minWidth: 0,
  },
  serviceRevenueValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  rankingList: { gap: 10 },
  rankingRow: { gap: 4 },
  rankingLabelRow: { flexDirection: 'row', gap: 8 },
  rankingName: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    minWidth: 0,
  },
  rankingTrack: {
    backgroundColor: '#30343A',
    borderRadius: 2,
    height: 9,
    overflow: 'hidden',
  },
  rankingFill: { borderRadius: 2, height: '100%' },
  section: { gap: 10, paddingTop: 6, width: '100%' },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAction: {
    ...CARD_SHADOW,
    alignItems: 'center',
    backgroundColor: HOME.card,
    borderColor: HOME.border,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 123,
    paddingHorizontal: 6,
    paddingVertical: 16,
  },
  quickActionContainer: { flex: 1 },
  quickBadge: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  quickLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    lineHeight: 15,
  },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineRail: { alignItems: 'center', width: 14 },
  timelineDot: {
    borderColor: HOME.teal,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    marginTop: 5,
    width: 16,
  },
  timelineLine: {
    backgroundColor: HOME.border,
    flex: 1,
    marginTop: 3,
    width: 1,
  },
  quoteRow: {
    ...CARD_SHADOW,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    minHeight: 74,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quoteContainer: { flex: 1, minWidth: 0 },
  quoteCopy: { flex: 1, minWidth: 0 },
  quoteSkeleton: { alignItems: 'flex-start', flexDirection: 'column' },
  quoteAmount: { color: HOME.green, fontSize: 14 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  periodMenu: {
    alignSelf: 'center',
    backgroundColor: '#24272D',
    borderColor: HOME.border,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 360,
    padding: 8,
    width: '100%',
  },
  periodOption: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  periodOptionActive: { color: HOME.teal },
});
