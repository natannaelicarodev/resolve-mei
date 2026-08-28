import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import {
  Button,
  Card,
  Icon,
  IconButton,
  Skeleton,
  Text,
} from '@/components/ui';
import type { IconName as CatalogIconName } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { getProfileInitial } from '@/features/profile/avatar';
import { formatMoney } from '@/features/quotes/domain';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import type { DashboardPeriod, HomeDashboardData } from './api';

interface HomeDashboardProps {
  firstName?: string;
  avatarUrl?: string;
  profileConfigured: boolean;
  hasContact: boolean;
  contactPendingField?: 'phone' | 'email';
  period?: DashboardPeriod;
  onPeriodChange?: (period: DashboardPeriod) => void;
  dashboard?: HomeDashboardData;
  dashboardLoading?: boolean;
  dashboardError?: boolean;
  onRetry?: () => void;
}
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const PERIODS = [
  { compactLabel: 'Este mês', label: 'Este mês', value: 'month' },
  { compactLabel: '3 meses', label: 'Últimos 3 meses', value: '3months' },
  { compactLabel: '6 meses', label: 'Últimos 6 meses', value: '6months' },
  { compactLabel: 'Este ano', label: 'Este ano', value: 'year' },
] as const;
const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function AppHeader({
  firstName,
  avatarUrl,
}: Pick<HomeDashboardProps, 'firstName' | 'avatarUrl'>) {
  const { colors } = useTheme();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <View style={styles.header}>
      {avatarUrl ? (
        <Image
          accessibilityLabel={
            firstName ? `Imagem de ${firstName}` : 'Imagem do usuário'
          }
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          testID="profile-image"
        />
      ) : (
        <View
          accessibilityLabel={
            firstName ? `Avatar de ${firstName}` : 'Avatar do usuário'
          }
          style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}
          testID="profile-image-fallback"
        >
          <Text color="primary" variant="label">
            {getProfileInitial(firstName)}
          </Text>
        </View>
      )}
      <View style={styles.greeting}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={styles.greetingTitle}
          variant="label"
        >
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </Text>
        <Text
          color="textSecondary"
          numberOfLines={2}
          style={styles.greetingDescription}
        >
          Veja como está o seu negócio hoje.
        </Text>
      </View>
      <IconButton
        accessibilityLabel="Abrir configurações"
        icon={
          <MaterialCommunityIcons
            color={colors.textPrimary}
            name="cog-outline"
            size={24}
          />
        }
        onPress={() => router.push('/settings')}
      />
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="cardTitle">{title}</Text>
      {subtitle ? (
        <Text color="textSecondary" variant="caption">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function ErrorState({
  onRetry,
  compact = false,
}: {
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={compact ? styles.compactError : styles.state}
    >
      <Text color="textSecondary">Indisponível</Text>
      <Button label="Tentar novamente" onPress={onRetry} variant="ghost" />
    </View>
  );
}

function PeriodPicker({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected =
    PERIODS.find((period) => period.value === value) ?? PERIODS[0];
  return (
    <>
      <AnimatedPressable
        accessibilityHint="Abre as opções de período."
        accessibilityLabel={`Período: ${selected.label}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={[styles.periodButton, { borderColor: colors.border }]}
      >
        <Text numberOfLines={1} style={styles.periodButtonLabel}>
          {selected.compactLabel}
        </Text>
        <MaterialCommunityIcons
          color={colors.textSecondary}
          name="chevron-down"
          size={16}
        />
      </AnimatedPressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          accessibilityLabel="Fechar seletor de período"
          onPress={() => setOpen(false)}
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.periodMenu,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            {PERIODS.map((period) => (
              <AnimatedPressable
                accessibilityRole="radio"
                accessibilityState={{ checked: period.value === value }}
                key={period.value}
                onPress={() => {
                  onChange(period.value);
                  setOpen(false);
                }}
                style={styles.periodOption}
              >
                <Text
                  color={period.value === value ? 'primary' : 'textPrimary'}
                  variant="label"
                >
                  {period.label}
                </Text>
              </AnimatedPressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  compact,
}: {
  icon: IconName;
  label: string;
  value: string;
  compact: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.metric, compact && styles.metricCompact]}
    >
      <MaterialCommunityIcons color={colors.primary} name={icon} size={21} />
      <Text
        color="textSecondary"
        style={compact ? styles.metricLabelCompact : undefined}
        variant="caption"
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={compact ? styles.metricValueCompact : styles.metricValue}
        variant="cardTitle"
      >
        {value}
      </Text>
    </View>
  );
}

function comparison(current: number, previous: number) {
  if (previous === 0)
    return current === 0
      ? 'Estável em relação ao período anterior'
      : 'Sem base no período anterior';
  const value = Math.round(((current - previous) / previous) * 100);
  if (!value) return 'Estável em relação ao período anterior';
  return `${value > 0 ? 'Aumento' : 'Redução'} de ${Math.abs(value)}% em relação ao período anterior`;
}

function Balance({
  data,
  loading,
  error,
  retry,
  period,
  onPeriodChange,
  compact,
}: DashboardStateProps & {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  compact: boolean;
}) {
  const { colors, resolvedTheme } = useTheme();
  const pipelineCents = data ? data.approvedCents + data.negotiatingCents : 0;
  const approvedShare = pipelineCents
    ? Math.round(((data?.approvedCents ?? 0) / pipelineCents) * 100)
    : 0;
  const trendIcon: CatalogIconName = !data
    ? 'statusNeutral'
    : data.approvedCents > data.previousApprovedCents
      ? 'trendUp'
      : data.approvedCents < data.previousApprovedCents
        ? 'trendDown'
        : 'statusNeutral';
  return (
    <Card
      testID="balance-card"
      variant="highlighted"
      style={[
        styles.balance,
        resolvedTheme === 'dark' && getThemeShadows(resolvedTheme).floating,
      ]}
    >
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceTitle} variant="cardTitle">
          Balanço estimado
        </Text>
        <PeriodPicker onChange={onPeriodChange} value={period} />
      </View>
      <Text color="textSecondary" variant="caption">
        Visão dos valores aprovados e ainda em negociação.
      </Text>
      {loading ? (
        <View style={styles.loading} testID="balance-skeleton">
          <Skeleton height={42} width="65%" />
          <Skeleton height={18} width="80%" />
        </View>
      ) : error || !data ? (
        <ErrorState compact onRetry={retry} />
      ) : (
        <>
          <View
            style={[
              styles.balanceSummary,
              compact && styles.balanceSummaryCompact,
            ]}
          >
            <View
              style={[
                styles.balanceMain,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text color="textMuted" variant="caption">
                Valor aprovado
              </Text>
              <View style={styles.balanceValueRow}>
                <Text
                  adjustsFontSizeToFit
                  accessibilityLabel={`Valor aprovado: ${formatMoney(data.approvedCents)}`}
                  minimumFontScale={0.72}
                  numberOfLines={1}
                  style={styles.balanceValue}
                >
                  {formatMoney(data.approvedCents)}
                </Text>
              </View>
              {data.approvedCents === 0 ? (
                <Text color="textSecondary">
                  Nenhum orçamento aprovado neste período
                </Text>
              ) : (
                <View
                  accessible
                  accessibilityLabel={comparison(
                    data.approvedCents,
                    data.previousApprovedCents,
                  )}
                  style={[
                    styles.trend,
                    {
                      backgroundColor: colors.accentSubtle,
                      borderColor: colors.accent,
                    },
                  ]}
                  testID="balance-trend"
                >
                  <Icon color="accent" name={trendIcon} size="small" />
                  <Text
                    color="accent"
                    numberOfLines={2}
                    style={styles.trendLabel}
                    variant="label"
                  >
                    {comparison(data.approvedCents, data.previousApprovedCents)}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.composition,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              testID="balance-composition"
            >
              <Text color="textSecondary" variant="caption">
                Composição do período
              </Text>
              <View
                accessible
                accessibilityLabel={`${approvedShare}% aprovado e ${pipelineCents ? 100 - approvedShare : 0}% em negociação`}
                style={[
                  styles.compositionTrack,
                  { backgroundColor: colors.surfacePressed },
                ]}
              >
                {pipelineCents ? (
                  <>
                    <View
                      style={[
                        styles.compositionApproved,
                        {
                          backgroundColor: colors.primary,
                          width: `${approvedShare}%`,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.compositionNegotiating,
                        {
                          backgroundColor: colors.accent,
                          width: `${100 - approvedShare}%`,
                        },
                      ]}
                    />
                  </>
                ) : null}
              </View>
              <View style={styles.compositionLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text color="textSecondary" variant="caption">
                    Aprovado {approvedShare}%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                  <Text color="textSecondary" variant="caption">
                    Negociação {pipelineCents ? 100 - approvedShare : 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.metrics, compact && styles.metricsCompact]}>
            <Metric
              compact={compact}
              icon="check-circle-outline"
              label="Valor aprovado"
              value={formatMoney(data.approvedCents)}
            />
            <Metric
              compact={compact}
              icon="clock-outline"
              label="Em negociação"
              value={formatMoney(data.negotiatingCents)}
            />
            <Metric
              compact={compact}
              icon="file-check-outline"
              label="Aprovados"
              value={String(data.approvedCount)}
            />
          </View>
          {data.quoteCount === 0 ? (
            <Button
              label="Criar orçamento"
              onPress={() => router.push('/quotes/new')}
              variant="ghost"
            />
          ) : null}
        </>
      )}
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  primary,
  onPress,
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const { colors, resolvedTheme } = useTheme();
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.quickAction}
    >
      {primary ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryPressed]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[
            styles.quickActionBadge,
            getThemeShadows(resolvedTheme).floating,
          ]}
          testID="quick-action-primary-gradient"
        >
          <MaterialCommunityIcons
            color={colors.textOnPrimary}
            name={icon}
            size={22}
          />
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.quickActionBadge,
            { backgroundColor: colors.primarySubtle },
          ]}
        >
          <MaterialCommunityIcons
            color={colors.primary}
            name={icon}
            size={22}
          />
        </View>
      )}
      <Text align="center" color="textSecondary" variant="label">
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function QuickActions() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Ações rápidas" />
      {/* Three equal columns at any width: badges are small enough that the
          compact stack the old card layout needed is no longer necessary. */}
      <View style={styles.quickGrid}>
        <QuickAction
          icon="file-document-plus-outline"
          label="Novo orçamento"
          onPress={() => router.push('/quotes/new')}
          primary
        />
        <QuickAction
          icon="account-plus-outline"
          label="Novo cliente"
          onPress={() => router.push('/clients/new')}
        />
        <QuickAction
          icon="briefcase-plus-outline"
          label="Novo serviço"
          onPress={() => router.push('/services/new')}
        />
      </View>
    </View>
  );
}

interface DashboardStateProps {
  data?: HomeDashboardData;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

function Overview({ data, loading, error, retry }: DashboardStateProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number>();
  if (loading)
    return (
      <Card style={styles.chartCard} testID="overview-skeleton">
        <Skeleton height={210} width="100%" />
      </Card>
    );
  if (error || !data)
    return (
      <Card style={styles.chartCard}>
        <ErrorState onRetry={retry} />
      </Card>
    );
  const maximum = Math.max(
    ...data.monthly.map((item) => item.approvedCents),
    1,
  );
  const hasValues = data.monthly.some((item) => item.approvedCents > 0);
  const singleMonth = data.monthly.length === 1;
  const chartHeight = singleMonth ? 112 : data.monthly.length <= 6 ? 156 : 176;
  const barMaximumHeight = chartHeight - 36;
  const chartWidth = Math.max(320, data.monthly.length * 48);
  const horizontalInset = 18;
  const points = data.monthly.map((item, index) => ({
    x: singleMonth
      ? chartWidth / 2
      : horizontalInset +
        (index / (data.monthly.length - 1)) *
          (chartWidth - horizontalInset * 2),
    y:
      12 +
      (1 - item.approvedCents / maximum) * Math.max(barMaximumHeight - 12, 1),
  }));
  const linePath = points
    .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
    .join(' ');
  const visibleIndex = selected ?? data.monthly.length - 1;
  const visibleItem = data.monthly[visibleIndex];
  const visiblePoint = points[visibleIndex];
  const visibleMonth = visibleItem
    ? MONTHS[new Date(`${visibleItem.month}T12:00:00`).getMonth()]
    : '';
  return (
    <Card
      testID="overview-card"
      variant="elevated"
      style={[styles.chartCard, singleMonth && styles.chartCardSingle]}
    >
      <SectionHeader
        title="Orçamentos aprovados"
        subtitle="Valor aprovado por mês"
      />
      {!hasValues ? (
        <View style={styles.state}>
          <MaterialCommunityIcons
            color={colors.textMuted}
            name="chart-bar"
            size={32}
          />
          <Text align="center" color="textSecondary">
            Ainda não há orçamentos aprovados neste período.
          </Text>
          <Button
            label="Criar primeiro orçamento"
            onPress={() => router.push('/quotes/new')}
            variant="ghost"
          />
        </View>
      ) : (
        <>
          <ScrollView
            accessibilityLabel="Gráfico mensal de valores aprovados"
            contentContainerStyle={[
              styles.chart,
              { minWidth: chartWidth },
              data.monthly.length > 6 && {
                minWidth: data.monthly.length * 48,
              },
            ]}
            horizontal
            scrollEnabled={data.monthly.length > 6}
            showsHorizontalScrollIndicator={false}
            style={styles.chartViewport}
          >
            {visibleItem && visiblePoint ? (
              <View
                accessible
                accessibilityLabel={`${visibleMonth}: ${formatMoney(visibleItem.approvedCents)}`}
                accessibilityLiveRegion="polite"
                pointerEvents="none"
                style={[
                  styles.chartTooltip,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    left: Math.max(
                      0,
                      Math.min(chartWidth - 124, visiblePoint.x - 62),
                    ),
                    top: Math.max(0, visiblePoint.y - 42),
                  },
                ]}
                testID="line-chart-tooltip"
              >
                <Text numberOfLines={1} variant="caption">
                  {visibleMonth}: {formatMoney(visibleItem.approvedCents)}
                </Text>
              </View>
            ) : null}
            <Svg
              accessibilityElementsHidden
              height={chartHeight}
              importantForAccessibility="no-hide-descendants"
              testID="approved-line-chart"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              width={chartWidth}
            >
              <Path
                d={linePath}
                fill="none"
                stroke={colors.accent}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
              />
              {points.map((point, index) => (
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill={
                    index === visibleIndex ? colors.primary : colors.surface
                  }
                  key={data.monthly[index]?.month}
                  r={index === visibleIndex ? 6 : 4}
                  stroke={colors.accent}
                  strokeWidth={3}
                />
              ))}
            </Svg>
            <View style={styles.lineLabels}>
              {data.monthly.map((item, index) => {
                const month =
                  MONTHS[new Date(`${item.month}T12:00:00`).getMonth()];
                return (
                  <AnimatedPressable
                    accessibilityLabel={`${month}, ${formatMoney(item.approvedCents)}`}
                    accessibilityRole="button"
                    key={item.month}
                    onPress={() => setSelected(index)}
                    style={styles.lineLabelButton}
                  >
                    <Text
                      color={
                        index === visibleIndex ? 'primary' : 'textSecondary'
                      }
                      variant="caption"
                    >
                      {month}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}
    </Card>
  );
}

function Clients({ data, loading, error, retry }: DashboardStateProps) {
  const { colors } = useTheme();
  if (loading)
    return (
      <Card style={styles.clientsCard} testID="clients-skeleton">
        <Skeleton height={190} width="100%" />
      </Card>
    );
  if (error || !data)
    return (
      <Card style={styles.clientsCard}>
        <ErrorState onRetry={retry} />
      </Card>
    );
  const percent = data.clients.total
    ? Math.round((data.clients.active / data.clients.total) * 100)
    : 0;
  const donutRadius = 40;
  const donutCircumference = 2 * Math.PI * donutRadius;
  return (
    <Card
      accessibilityLabel={`Abrir clientes. ${data.clients.total} no total, ${percent}% ativos.`}
      onPress={() => router.push('/clients')}
      style={styles.clientsCard}
      testID="clients-card"
      variant="interactive"
    >
      <SectionHeader title="Clientes" subtitle="Situação atual" />
      {!data.clients.total ? (
        <View style={styles.state}>
          <Text align="center" color="textSecondary">
            Seus clientes aparecerão aqui conforme você cadastrá-los.
          </Text>
          <Button
            label="Cadastrar cliente"
            onPress={() => router.push('/clients/new')}
            variant="ghost"
          />
        </View>
      ) : (
        <>
          <View style={styles.clientTotal}>
            <View
              accessibilityLabel={`${percent}% dos clientes estão ativos`}
              style={styles.donut}
              testID="clients-donut"
            >
              <Svg
                accessibilityElementsHidden
                height={108}
                importantForAccessibility="no-hide-descendants"
                viewBox="0 0 108 108"
                width={108}
              >
                <Circle
                  cx={54}
                  cy={54}
                  fill="none"
                  r={donutRadius}
                  stroke={colors.backgroundSubtle}
                  strokeWidth={12}
                />
                <Circle
                  cx={54}
                  cy={54}
                  fill="none"
                  origin="54, 54"
                  r={donutRadius}
                  rotation={-90}
                  stroke={colors.primary}
                  strokeDasharray={`${(donutCircumference * percent) / 100} ${donutCircumference}`}
                  strokeLinecap="round"
                  strokeWidth={12}
                />
              </Svg>
              <Text style={styles.donutValue} variant="cardTitle">
                {percent}%
              </Text>
            </View>
            <View style={styles.clientCopy}>
              <Text variant="cardTitle">{data.clients.total} clientes</Text>
              <Text color="textSecondary" variant="caption">
                Percentual de clientes ativos
              </Text>
            </View>
          </View>
          <View style={styles.legend}>
            <Text color="textSecondary">{data.clients.active} ativos</Text>
            <Text color="textSecondary">{data.clients.inactive} inativos</Text>
          </View>
        </>
      )}
    </Card>
  );
}

function Services({ data, loading, error, retry }: DashboardStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Serviços mais orçados"
        subtitle="Baseado nos itens adicionados aos orçamentos do período."
      />
      <Card style={styles.servicesCard} testID="services-card">
        {loading ? (
          <View testID="services-skeleton">
            <Skeleton height={168} width="100%" />
          </View>
        ) : null}
        {error ? <ErrorState onRetry={retry} /> : null}
        {!loading && !error && !data?.services.length ? (
          <View style={styles.state}>
            <Text align="center" color="textSecondary">
              Ainda não há serviços adicionados a orçamentos neste período.
            </Text>
            <Button
              label="Criar orçamento"
              onPress={() => router.push('/quotes/new')}
              variant="ghost"
            />
          </View>
        ) : null}
        {!loading && !error
          ? data?.services.map((service, index) => (
              <AnimatedPressable
                accessibilityLabel={`${service.name}, ${service.quoteCount} orçamentos, ${formatMoney(service.totalCents)}`}
                accessibilityRole="button"
                key={`${service.serviceId ?? 'custom'}:${service.name}`}
                onPress={() => router.push('/quotes' as Href)}
                style={[
                  styles.serviceRow,
                  index > 0 && {
                    borderTopColor: colors.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.serviceIcon,
                    { backgroundColor: colors.primarySubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={colors.primary}
                    name="briefcase-outline"
                    size={22}
                  />
                </View>
                <View style={styles.serviceCopy}>
                  <Text numberOfLines={2} variant="label">
                    {service.name}
                  </Text>
                  <Text color="textSecondary" variant="caption">
                    {service.quoteCount}{' '}
                    {service.quoteCount === 1 ? 'orçamento' : 'orçamentos'}
                  </Text>
                </View>
                <Text variant="label">{formatMoney(service.totalCents)}</Text>
                <MaterialCommunityIcons
                  color={colors.textMuted}
                  name="chevron-right"
                  size={20}
                />
              </AnimatedPressable>
            ))
          : null}
      </Card>
    </View>
  );
}

function Setup({
  profileConfigured,
  hasContact,
  contactPendingField,
}: Pick<
  HomeDashboardProps,
  'profileConfigured' | 'hasContact' | 'contactPendingField'
>) {
  if (profileConfigured && hasContact) return null;
  const contactLabel =
    contactPendingField === 'email' ? 'Adicionar e-mail' : 'Adicionar telefone';
  return (
    <View style={styles.section} testID="setup-section">
      <SectionHeader title="Prepare seu espaço" />
      {!profileConfigured ? (
        <AnimatedPressable
          accessibilityLabel="Completar perfil profissional"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/profile',
              params: { section: 'professional', field: 'first-required' },
            })
          }
          style={styles.setupRow}
          testID="setup-profile-pending"
        >
          <Text style={styles.setupLabel}>Completar perfil profissional</Text>
          <Text color="primary" variant="label">
            Completar
          </Text>
        </AnimatedPressable>
      ) : null}
      {!hasContact ? (
        <AnimatedPressable
          accessibilityLabel={contactLabel}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/profile',
              params:
                contactPendingField === 'email'
                  ? { section: 'professional', field: 'email' }
                  : { section: 'personal', field: 'phone' },
            })
          }
          style={styles.setupRow}
          testID="setup-contact-pending"
        >
          <Text style={styles.setupLabel}>{contactLabel}</Text>
          <Text color="primary" variant="label">
            Completar
          </Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

export function HomeDashboard(props: HomeDashboardProps) {
  const { colors } = useTheme();
  const width = useWindowDimensions().width;
  const narrow = width <= 359;
  const compact = width < 600;
  const wide = width >= 760;
  const state = {
    data: props.dashboard,
    loading: Boolean(props.dashboardLoading),
    error: Boolean(props.dashboardError),
    retry: props.onRetry ?? (() => undefined),
  };
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView
          style={[styles.content, narrow && styles.contentNarrow]}
          testID="home-dashboard-content"
        >
          <AppHeader avatarUrl={props.avatarUrl} firstName={props.firstName} />
          <Balance
            {...state}
            onPeriodChange={props.onPeriodChange ?? (() => undefined)}
            period={props.period ?? 'month'}
            compact={compact}
          />
          <QuickActions />
          <View style={styles.section}>
            <SectionHeader title="Visão geral" />
            <View
              style={[styles.overviewGrid, wide && styles.overviewGridWide]}
            >
              <Overview {...state} />
              <Clients {...state} />
            </View>
          </View>
          <Services {...state} />
          <Setup
            contactPendingField={props.contactPendingField}
            hasContact={props.hasContact}
            profileConfigured={props.profileConfigured}
          />
        </FadeInView>
      </ScrollView>
      <ProtectedBottomNavigation selected="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 112 },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 1120,
    paddingHorizontal: spacing[5],
    paddingTop: spacing.md,
    width: '100%',
  },
  contentNarrow: { paddingHorizontal: spacing[4] },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 56 },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  greeting: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
    paddingHorizontal: spacing[3],
  },
  greetingTitle: { fontSize: 18, lineHeight: 24 },
  greetingDescription: { fontSize: 13, lineHeight: 18 },
  section: { gap: spacing[3] },
  sectionHeader: { gap: spacing.xs },
  balance: {
    borderRadius: radii.large,
    gap: spacing[3],
    padding: spacing[5],
  },
  balanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  balanceTitle: { flex: 1, minWidth: 0 },
  periodButton: {
    alignItems: 'center',
    borderRadius: radii.small,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    minHeight: 36,
    maxWidth: 124,
    paddingHorizontal: 10,
  },
  periodButtonLabel: { fontSize: 13, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing[5],
  },
  periodMenu: {
    alignSelf: 'center',
    borderRadius: radii.medium,
    maxWidth: 360,
    overflow: 'hidden',
    padding: spacing.sm,
    width: '100%',
  },
  periodOption: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  loading: { gap: spacing.sm, paddingVertical: spacing.md },
  // lineHeight has to clear the ascender/descender box of the largest glyphs,
  // otherwise adjustsFontSizeToFit clips the value vertically.
  // adjustsFontSizeToFit resizes the glyphs but not the line box it lives in,
  // so the value gets a row of its own with explicit height. Without the
  // wrapper the figure is clipped and the trend badge below rides over it.
  balanceValueRow: { justifyContent: 'center', minHeight: 52, width: '100%' },
  balanceValue: { fontSize: 34, fontWeight: '700', lineHeight: 44 },
  balanceSummary: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  balanceSummaryCompact: { flexDirection: 'column' },
  // The headline figure sits on its own surface so the card reads as
  // "primary value, then supporting detail" instead of one flat block.
  balanceMain: {
    borderRadius: radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  trend: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trendLabel: { flexShrink: 1, minWidth: 0 },
  // Composition is supporting detail, so it sits on its own quieter surface
  // instead of sharing the hero block.
  composition: {
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minWidth: 0,
  },
  compositionTrack: {
    borderRadius: radii.pill,
    flexDirection: 'row',
    height: 16,
    overflow: 'hidden',
  },
  compositionApproved: { height: '100%' },
  compositionNegotiating: { height: '100%' },
  compositionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  legendDot: { borderRadius: radii.circular, height: 8, width: 8 },
  divider: { height: StyleSheet.hairlineWidth },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metricsCompact: { flexDirection: 'column' },
  metric: { flex: 1, gap: spacing.xs, minWidth: 0 },
  metricCompact: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 36,
  },
  metricLabelCompact: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 16, lineHeight: 22 },
  metricValueCompact: {
    fontSize: 16,
    lineHeight: 22,
    maxWidth: '48%',
    textAlign: 'right',
  },
  quickGrid: { flexDirection: 'row', gap: spacing[3] },
  // A quick action is a badge plus a label on the page background, not a card:
  // the surrounding surface added a layer that carried no meaning.
  quickAction: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'flex-start',
    minWidth: 0,
    paddingVertical: spacing.sm,
  },
  quickActionBadge: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  overviewGrid: { gap: spacing[3] },
  overviewGridWide: { alignItems: 'stretch', flexDirection: 'row' },
  chartCard: {
    borderRadius: radii.large,
    flex: 2,
    gap: spacing.md,
    minHeight: 220,
    padding: spacing.md,
  },
  chartCardSingle: { minHeight: 196 },
  chart: { gap: spacing.xs, position: 'relative' },
  chartViewport: { width: '100%' },
  chartTooltip: {
    alignItems: 'center',
    borderRadius: radii.small,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 124,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    zIndex: 2,
  },
  lineLabels: { flexDirection: 'row', width: '100%' },
  lineLabelButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  clientsCard: {
    borderRadius: radii.large,
    flex: 1,
    gap: spacing.md,
    minHeight: 210,
    padding: spacing.md,
  },
  clientTotal: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  clientCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  donut: { alignItems: 'center', justifyContent: 'center' },
  donutValue: { position: 'absolute' },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  servicesCard: {
    borderRadius: radii.large,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  serviceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 76,
    paddingVertical: spacing[3],
  },
  serviceIcon: {
    alignItems: 'center',
    borderRadius: radii.small,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  serviceCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 120,
    padding: spacing.md,
  },
  compactError: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    minHeight: 72,
  },
  setupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  setupLabel: { flex: 1, minWidth: 0 },
});
