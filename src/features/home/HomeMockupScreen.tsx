import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, useReducedMotion } from '@/components/motion';
import { Icon, Skeleton, Text } from '@/components/ui';
import { WelcomeAmbientBackground } from '@/features/auth/WelcomeScreen';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import type { Quote } from '@/features/quotes/api';
import { formatMoney } from '@/features/quotes/domain';
import type { DashboardPeriod, HomeDashboardData } from './api';
import { homePalette as palette } from './palette';
import { buildPipeline, summarizePipeline } from './pipeline';
import type { PipelineStage } from './pipeline';
import {
  PipelineRow,
  ProposedStageNotice,
  RailEmpty,
  StageStrip,
} from './PipelineRail';

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  month: 'este mês',
  '3months': 'nos últimos 3 meses',
  '6months': 'nos últimos 6 meses',
  year: 'neste ano',
};

export interface HomeMockupScreenProps {
  firstName?: string;
  businessName?: string;
  avatarUrl?: string;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  dashboard?: HomeDashboardData;
  dashboardLoading?: boolean;
  dashboardError?: boolean;
  onRetry?: () => void;
  recentQuotes?: Quote[];
  recentQuotesLoading?: boolean;
  recentQuotesError?: boolean;
  serviceCount?: number;
}

function useAnimatedNumber(target: number, active: boolean) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate =
    active && !reducedMotion && process.env.NODE_ENV !== 'test';
  const [animated] = useState(() => new Animated.Value(target));
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (!shouldAnimate) {
      animated.setValue(target);
      return;
    }
    animated.setValue(0);
    const listener = animated.addListener(({ value }) =>
      setDisplay(Math.round(value)),
    );
    const animation = Animated.timing(animated, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
      toValue: target,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      animated.removeListener(listener);
    };
  }, [animated, shouldAnimate, target]);
  return shouldAnimate ? display : target;
}

function BrandMark() {
  return (
    <View accessibilityElementsHidden style={styles.mark}>
      <View style={[styles.markPiece, styles.markTop]} />
      <View style={[styles.markPiece, styles.markBottom]} />
      <View style={styles.markCore} />
    </View>
  );
}

function Header({
  businessName,
  firstName,
  avatarUrl,
}: Pick<HomeMockupScreenProps, 'businessName' | 'firstName' | 'avatarUrl'>) {
  return (
    <View style={styles.header}>
      <BrandMark />
      <View style={styles.brandCopy}>
        <Text numberOfLines={1} style={styles.businessName}>
          {businessName?.toUpperCase() ?? 'MEU NEGÓCIO'}
        </Text>
        <Text style={styles.brandName}>ResolveMEI</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel="Abrir perfil"
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => router.push('/profile')}
        style={styles.profileButton}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.profileImage}
            testID="profile-image"
          />
        ) : (
          <Text style={styles.profileInitial} testID="profile-image-fallback">
            {firstName?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

function SectionHeader({
  action,
  onPress,
  title,
}: {
  action: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <AnimatedPressable
        accessibilityLabel={action}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={styles.sectionAction}
      >
        <Text style={styles.sectionActionText}>{action.toUpperCase()}</Text>
      </AnimatedPressable>
    </View>
  );
}

function Panorama({
  data,
  period,
}: {
  data: HomeDashboardData;
  period: DashboardPeriod;
}) {
  const animatedValue = useAnimatedNumber(data.negotiatingCents, true);
  return (
    <View
      accessibilityLabel={`Em negociação: ${formatMoney(data.negotiatingCents)}`}
      style={styles.panorama}
    >
      <View style={styles.panoramaTop}>
        <Text style={styles.overline}>EM NEGOCIAÇÃO</Text>
        <Text style={styles.periodLabel}>{PERIOD_LABELS[period]}</Text>
      </View>
      <Text style={styles.panoramaLabel}>Valor dos orçamentos enviados</Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={styles.amount}
      >
        {formatMoney(animatedValue)}
      </Text>
      <Text style={styles.openCount}>
        {data.openCount} {data.openCount === 1 ? 'aberto' : 'abertos'} no
        período, incluindo rascunhos
      </Text>
      <View style={styles.panoramaDivider} />
      <View style={styles.panoramaActions}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/quotes')}
          style={[styles.button, styles.secondaryButton]}
        >
          <Text style={styles.secondaryButtonText}>Ver todos</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/quotes/new')}
          style={[styles.button, styles.primaryButton]}
        >
          <Text style={styles.primaryButtonText}>Novo orçamento</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

/**
 * The rail: every service that is stuck, ordered by what it costs to leave
 * alone. This is the spine of the Home — the owner reads down one column and
 * sees where the money stopped moving, instead of scanning a grid of cards.
 */
function Rail({
  quotes,
  selected,
  onSelectStage,
}: {
  quotes: Quote[];
  selected: PipelineStage | null;
  onSelectStage: (stage: PipelineStage | null) => void;
}) {
  const entries = buildPipeline(quotes);
  const summary = summarizePipeline(entries);
  const visible = selected
    ? entries.filter((entry) =>
        entry.displayStatus === 'expired'
          ? selected === 'sent'
          : entry.stage === selected,
      )
    : entries;
  const shown = visible.slice(0, 4);
  const blocked = entries.filter((entry) => entry.reason !== 'closed');
  const hasExpired = entries.some((entry) => entry.reason === 'expired');

  return (
    <View style={styles.section}>
      <StageStrip
        onSelect={onSelectStage}
        selected={selected}
        summary={summary}
      />
      <View style={styles.railHeader}>
        <Text style={styles.sectionTitle}>
          {selected ? 'Filtrado por etapa' : 'Onde o dinheiro parou'}
        </Text>
        {blocked.length > 0 ? (
          <Text
            accessibilityLabel={`Total parado: ${formatMoney(summary.blockedCents)}`}
            style={[styles.railTotal, hasExpired && styles.railTotalUrgent]}
          >
            {formatMoney(summary.blockedCents)}
          </Text>
        ) : null}
      </View>
      {shown.length ? (
        <View style={styles.rail}>
          {shown.map((entry, index) => (
            <PipelineRow
              entry={entry}
              first={index === 0}
              key={entry.quote.id}
            />
          ))}
          {visible.length > shown.length ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`Ver os outros ${visible.length - shown.length} orçamentos`}
              onPress={() => router.push('/quotes')}
              style={styles.railMore}
            >
              <Text style={styles.railMoreText}>
                Ver mais {visible.length - shown.length}
              </Text>
              <Icon name="forward" rawColor={palette.primary} size="small" />
            </AnimatedPressable>
          ) : null}
          <ProposedStageNotice />
        </View>
      ) : (
        <RailEmpty hasQuotes={quotes.length > 0} />
      )}
    </View>
  );
}

function Services({ services }: { services: HomeDashboardData['services'] }) {
  const items = services.slice(0, 2);
  const max = Math.max(...items.map((item) => item.quoteCount), 1);
  return (
    <View style={styles.section}>
      <SectionHeader
        action="Ver serviços"
        onPress={() => router.push('/services')}
        title="Serviços mais orçados"
      />
      <View style={styles.serviceSummary}>
        <View style={styles.serviceSummaryHeader}>
          <Text style={styles.serviceSummaryTitle}>
            Distribuição no período
          </Text>
          <Text style={styles.serviceSummaryCaption}>por quantidade</Text>
        </View>
        {items.map((item) => (
          <View
            key={`${item.serviceId}:${item.name}`}
            style={styles.serviceRow}
          >
            <Text numberOfLines={1} style={styles.serviceName}>
              {item.name}
            </Text>
            <Text style={styles.serviceCount}>{item.quoteCount}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(item.quoteCount / max) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View
      accessibilityLabel="Carregando visão do negócio"
      accessibilityState={{ busy: true }}
      style={styles.stateStack}
    >
      <View style={styles.skeletonPanorama}>
        <Skeleton height={11} width="35%" />
        <View style={styles.skeletonGap} />
        <Skeleton height={11} width="58%" />
        <Skeleton height={42} width="62%" />
        <View style={styles.skeletonActions}>
          <Skeleton height={52} radius={14} width="100%" />
          <Skeleton height={52} radius={14} width="100%" />
        </View>
      </View>
      <Skeleton height={18} width="58%" />
      <Skeleton height={218} radius={22} width="100%" />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateCard}>
      <Text accessibilityElementsHidden style={styles.emptyMark}>
        ＋
      </Text>
      <Text style={styles.stateTitle}>Seu primeiro orçamento começa aqui</Text>
      <Text style={styles.stateCopy}>
        Cadastre um cliente, escolha os serviços e envie uma proposta
        profissional.
      </Text>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => router.push('/quotes/new')}
        style={[styles.button, styles.primaryButton, styles.stateButton]}
      >
        <Text style={styles.primaryButtonText}>Criar orçamento</Text>
      </AnimatedPressable>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.stateCard}>
      <Text accessibilityElementsHidden style={styles.errorMark}>
        !
      </Text>
      <Text style={styles.stateTitle}>Não foi possível carregar sua visão</Text>
      <Text style={styles.stateCopy}>
        Confira sua conexão e tente novamente. Seus dados continuam seguros.
      </Text>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.button, styles.secondaryButton, styles.stateButton]}
      >
        <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
      </AnimatedPressable>
    </View>
  );
}

function VisibilityTrigger({
  children,
  onVisible,
  scrollY,
  viewportHeight,
}: {
  children: ReactNode;
  onVisible: () => void;
  scrollY: Animated.Value;
  viewportHeight: number;
}) {
  const top = useRef<number | undefined>(undefined);
  const offset = useRef(0);
  const revealed = useRef(false);
  const check = useCallback(
    (value: number) => {
      if (
        !revealed.current &&
        top.current !== undefined &&
        top.current <= value + viewportHeight * 0.82
      ) {
        revealed.current = true;
        onVisible();
      }
    },
    [onVisible, viewportHeight],
  );
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      offset.current = value;
      check(value);
    });
    return () => scrollY.removeListener(id);
  }, [check, scrollY]);
  const onLayout = (event: LayoutChangeEvent) => {
    top.current = event.nativeEvent.layout.y;
    check(offset.current);
  };
  return <View onLayout={onLayout}>{children}</View>;
}

function Reveal({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (!active) return;
    Animated.spring(progress, {
      damping: 20,
      mass: 0.7,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [reduced ? 0 : 14, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function HomeMockupScreen(props: HomeMockupScreenProps) {
  const { height } = useWindowDimensions();
  const [scrollY] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState([false, false]);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const quotes = props.recentQuotes ?? [];
  const empty =
    !props.dashboardLoading &&
    !props.dashboardError &&
    props.dashboard?.quoteCount === 0 &&
    quotes.length === 0;
  const reveal = (index: number) =>
    setVisible((current) =>
      current[index]
        ? current
        : current.map((value, item) => (item === index ? true : value)),
    );
  const content =
    props.dashboardLoading || props.recentQuotesLoading ? (
      <LoadingState />
    ) : props.dashboardError || props.recentQuotesError || !props.dashboard ? (
      <ErrorState onRetry={props.onRetry ?? (() => undefined)} />
    ) : empty ? (
      <EmptyState />
    ) : (
      <>
        <Panorama data={props.dashboard} period={props.period} />
        <VisibilityTrigger
          onVisible={() => reveal(0)}
          scrollY={scrollY}
          viewportHeight={height}
        >
          <Reveal active={Boolean(visible[0])}>
            <Rail onSelectStage={setStage} quotes={quotes} selected={stage} />
          </Reveal>
        </VisibilityTrigger>
        {props.dashboard.services.length ? (
          <VisibilityTrigger
            onVisible={() => reveal(1)}
            scrollY={scrollY}
            viewportHeight={height}
          >
            <Reveal active={Boolean(visible[1])}>
              <Services services={props.dashboard.services} />
            </Reveal>
          </VisibilityTrigger>
        ) : null}
      </>
    );
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <WelcomeAmbientBackground dark />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Header
            avatarUrl={props.avatarUrl}
            businessName={props.businessName}
            firstName={props.firstName}
          />
          <View style={styles.welcome}>
            <Text numberOfLines={2} style={styles.welcomeTitle}>
              {greeting}
              {props.firstName ? `, ${props.firstName}.` : '.'}
            </Text>
            <Text style={styles.welcomeCopy}>
              Veja o que pede sua decisão hoje.
            </Text>
          </View>
          {content}
        </View>
      </Animated.ScrollView>
      <ProtectedBottomNavigation selected="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: palette.background, flex: 1 },
  scrollContent: { paddingBottom: 28 },
  content: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingHorizontal: 22,
    width: '100%',
  },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 62 },
  mark: {
    backgroundColor: palette.raised,
    borderColor: palette.borderStrong,
    borderRadius: 11,
    borderWidth: 1,
    height: 38,
    position: 'relative',
    width: 38,
  },
  markPiece: {
    backgroundColor: palette.primary,
    height: 13,
    position: 'absolute',
    width: 14,
  },
  markTop: { borderBottomRightRadius: 8, left: 8, top: 7 },
  markBottom: { borderTopLeftRadius: 8, bottom: 7, right: 8 },
  markCore: {
    backgroundColor: palette.background,
    borderRadius: 4,
    height: 7,
    left: 16,
    position: 'absolute',
    top: 16,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  brandCopy: { gap: 2, marginLeft: 10 },
  businessName: {
    color: palette.muted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.1,
    lineHeight: 14,
  },
  brandName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  profileButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 48,
  },
  profileImage: { borderRadius: 12, height: 32, width: 32 },
  profileInitial: {
    color: palette.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  welcome: { marginBottom: 20, marginTop: 27 },
  welcomeTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  welcomeCopy: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  panorama: {
    backgroundColor: '#0D110E',
    borderColor: 'rgba(69,230,176,.13)',
    borderRadius: 26,
    borderWidth: 1,
    elevation: 10,
    padding: 19,
  },
  panoramaTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overline: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  periodLabel: {
    color: palette.secondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  panoramaLabel: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginTop: 28,
  },
  amount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    lineHeight: 48,
    marginTop: 5,
  },
  openCount: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  panoramaDivider: {
    backgroundColor: palette.border,
    height: 1,
    marginTop: 24,
  },
  panoramaActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  secondaryButton: { borderColor: palette.borderStrong, borderWidth: 1 },
  primaryButton: { backgroundColor: palette.primary },
  secondaryButtonText: { fontFamily: 'Manrope_700Bold', fontSize: 13 },
  primaryButtonText: {
    color: '#07110E',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  section: { marginTop: 30 },
  railHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 26,
  },
  railTotal: {
    color: palette.secondary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  // Only when something has actually expired does the total earn urgency
  // colour; otherwise it stays quiet so the panorama keeps the eye.
  railTotalUrgent: { color: palette.warning },
  rail: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  railMore: {
    alignItems: 'center',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 48,
  },
  railMoreText: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    letterSpacing: -0.35,
    lineHeight: 23,
  },
  sectionAction: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  sectionActionText: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 0.55,
  },
  focusCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 8,
    padding: 18,
  },
  attentionReasonRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  attentionDot: {
    backgroundColor: palette.warning,
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  attentionReason: {
    color: palette.warning,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  quoteNumber: {
    color: palette.muted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.7,
    marginTop: 14,
  },
  focusMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  focusCopy: { flex: 1, minWidth: 0 },
  focusClient: { fontFamily: 'Manrope_700Bold', fontSize: 15, lineHeight: 21 },
  focusService: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  focusValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  focusMeta: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
    paddingTop: 14,
  },
  metaText: {
    color: palette.muted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },
  metaStrong: { color: palette.secondary, fontFamily: 'Manrope_600SemiBold' },
  focusAction: {
    alignItems: 'center',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    justifyContent: 'center',
    marginBottom: -10,
    marginTop: 14,
    minHeight: 48,
  },
  focusActionText: { fontFamily: 'Manrope_700Bold', fontSize: 12 },
  quoteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingVertical: 10,
  },
  quoteRowBorder: { borderTopColor: palette.border, borderTopWidth: 1 },
  statusDot: { borderRadius: 5, borderWidth: 2, height: 9, width: 9 },
  statusApproved: { borderColor: palette.primary },
  statusSent: { borderColor: palette.warning },
  statusNeutral: { borderColor: palette.muted },
  quoteCopy: { flex: 1, minWidth: 0 },
  quoteClient: { fontFamily: 'Manrope_700Bold', fontSize: 13, lineHeight: 19 },
  quoteStatus: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },
  quoteValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  quoteValueApproved: { color: palette.primary },
  quoteValueSent: { color: palette.warning },
  serviceSummary: { paddingBottom: 8 },
  serviceSummaryHeader: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  serviceSummaryTitle: { fontFamily: 'Manrope_700Bold', fontSize: 12 },
  serviceSummaryCaption: {
    color: palette.muted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
  },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 },
  serviceName: { flex: 1, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  serviceCount: { fontFamily: 'Manrope_700Bold', fontSize: 12 },
  track: {
    backgroundColor: 'rgba(255,255,255,.08)',
    borderRadius: 2,
    height: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { backgroundColor: palette.primary, height: '100%' },
  stateStack: { gap: 16 },
  skeletonPanorama: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 26,
    borderWidth: 1,
    height: 241,
    padding: 19,
  },
  skeletonGap: { height: 28 },
  skeletonActions: { flexDirection: 'row', gap: 10, marginTop: 52 },
  stateCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 10,
    padding: 22,
  },
  emptyMark: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 26,
    marginBottom: 12,
  },
  errorMark: {
    color: palette.warning,
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    marginBottom: 12,
  },
  stateTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  stateCopy: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 270,
    textAlign: 'center',
  },
  stateButton: { flexGrow: 0, marginTop: 18, maxWidth: 190, width: '100%' },
});
