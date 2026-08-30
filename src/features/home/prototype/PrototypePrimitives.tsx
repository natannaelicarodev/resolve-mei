import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated as NativeAnimated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, Path, Pattern, Rect, Svg } from 'react-native-svg';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileText,
  Sparkles,
  Star,
  TriangleAlert,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AnimatedPressable } from '@/components/motion';
import { Text } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import type {
  BusinessActivity,
  BusinessSnapshot,
  CashflowPoint,
  PrototypeModuleId,
  QuickActionId,
} from './model';
import { formatPrototypeMoney } from './model';
import { dragTuning, palette, prototypeMotion, radii, space } from './tokens';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// Rough upper bound on the drawn path length so the stroke-dash reveal always
// starts fully hidden, regardless of the exact data shape.
const CHART_PATH_LENGTH = 480;

const heroNumberStyle: TextStyle & { lineHeight: number } = {
  fontFamily: 'Manrope_700Bold',
  fontSize: 46,
  fontVariant: ['tabular-nums'],
  letterSpacing: -1.8,
  lineHeight: 54,
};

export function AmbientBackdrop({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const breath = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      breath.value = 0.5;
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [breath, reducedMotion]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.24, 0.4]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.92, 1.08]) }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Svg height="260" viewBox="0 0 390 260" width="100%">
        <Defs>
          <Pattern height="22" id="home-grid" patternUnits="userSpaceOnUse" width="22">
            <Circle cx="1" cy="1" fill="#FFFFFF" opacity="0.05" r="1" />
          </Pattern>
        </Defs>
        <Rect fill="url(#home-grid)" height="260" width="390" />
      </Svg>
      <Reanimated.View style={[styles.ambientGlow, glowStyle]} />
      <View style={styles.ambientFade} />
    </View>
  );
}

// A small echo of the two-piece brand mark used on WelcomeScreen — the one
// genuinely bespoke graphic in this screen, not a library icon, kept faint
// enough to read as a watermark rather than a logo lockup.
function BrandGlyph() {
  return (
    <View pointerEvents="none" style={styles.brandGlyph}>
      <View style={styles.brandGlyphTop} />
      <View style={styles.brandGlyphBottom} />
    </View>
  );
}

function RollingDigit({
  digit,
  digitHeight,
  digitWidth,
  reducedMotion,
  style,
}: {
  digit: number;
  digitHeight: number;
  digitWidth: number;
  reducedMotion: boolean;
  style: StyleProp<TextStyle>;
}) {
  const translateY = useSharedValue(-digit * digitHeight);
  useEffect(() => {
    translateY.value = reducedMotion
      ? -digit * digitHeight
      : withSpring(-digit * digitHeight, prototypeMotion.ticker);
  }, [digit, digitHeight, reducedMotion, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <View style={{ height: digitHeight, overflow: 'hidden', width: digitWidth }}>
      <Reanimated.View style={animatedStyle}>
        {DIGITS.map((value) => (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            key={value}
            style={[style, { height: digitHeight, textAlign: 'center', width: digitWidth }]}
          >
            {value}
          </Text>
        ))}
      </Reanimated.View>
    </View>
  );
}

export function NumericTicker({
  accessibilityLabel,
  color = palette.text,
  reducedMotion = false,
  style,
  valueCents,
}: {
  accessibilityLabel: string;
  color?: string;
  reducedMotion?: boolean;
  style: TextStyle & { lineHeight: number };
  valueCents: number;
}) {
  const formatted = formatPrototypeMoney(valueCents);
  const digitWidth = (style.fontSize ?? 24) * 0.62;
  const styleWithColor = [style, { color }];
  return (
    <View accessibilityLabel={accessibilityLabel} accessible style={styles.ticker}>
      {formatted.split('').map((character, index) =>
        /\d/.test(character) ? (
          <RollingDigit
            digit={Number(character)}
            digitHeight={style.lineHeight}
            digitWidth={digitWidth}
            key={`digit-${index}`}
            reducedMotion={reducedMotion}
            style={[style, { color }]}
          />
        ) : (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            key={`glyph-${index}`}
            style={styleWithColor}
          >
            {character}
          </Text>
        ),
      )}
    </View>
  );
}

function buildLinePath(points: CashflowPoint[], width: number, height: number, paddingY: number): string {
  const max = Math.max(...points.map((point) => point.valueCents));
  const usableHeight = height - paddingY * 2;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - paddingY - (point.valueCents / max) * usableHeight;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

// Lives inside the panorama, next to the hero number — a glanceable trend,
// not a separate boxed chart card.
function InlineSparkline({
  points,
  reducedMotion,
}: {
  points: CashflowPoint[];
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reducedMotion ? 1 : 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 160 * (1 - progress.value),
  }));
  const path = useMemo(() => buildLinePath(points, 96, 32, 4), [points]);
  const first = points[0];
  const last = points[points.length - 1];
  const delta =
    first && last && first.valueCents !== 0
      ? Math.round(((last.valueCents - first.valueCents) / first.valueCents) * 100)
      : 0;

  return (
    <View style={styles.sparklineRow}>
      <Svg height={32} viewBox="0 0 96 32" width={96}>
        <AnimatedPath
          animatedProps={animatedProps}
          d={path}
          fill="none"
          stroke={palette.primary}
          strokeDasharray={160}
          strokeLinecap="round"
          strokeWidth={2}
        />
      </Svg>
      <Text style={[styles.sparklineDelta, delta < 0 && styles.sparklineDeltaNegative]}>
        {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% em 5 semanas
      </Text>
    </View>
  );
}

export function BusinessPanorama({
  cashflow,
  reducedMotion = false,
  snapshot,
}: {
  cashflow: CashflowPoint[];
  reducedMotion?: boolean;
  snapshot: BusinessSnapshot;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reducedMotion ? 1 : 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion]);
  const reveal = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [12, 0]) }],
  }));

  return (
    <Reanimated.View
      accessibilityLabel={`Panorama financeiro do negócio. Saldo disponível ${formatPrototypeMoney(snapshot.cashAvailableCents)}. ${snapshot.dasDueLabel}, valor ${formatPrototypeMoney(snapshot.dasDueCents)}. Faturamento acumulado ${formatPrototypeMoney(snapshot.accruedRevenueCents)}. ${snapshot.invoicesIssuedCount} notas emitidas.`}
      style={[styles.panorama, reveal]}
    >
      <LinearGradient
        colors={['#0C2119', '#081712', palette.surfaceRaised]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <ArcWatermark />
      <BrandGlyph />
      <View style={styles.panoramaHeader}>
        <Text style={styles.eyebrow}>SALDO DISPONÍVEL</Text>
        <Text style={styles.updatedLabel}>{snapshot.updatedAtLabel}</Text>
      </View>
      <NumericTicker
        accessibilityLabel={`Saldo disponível ${formatPrototypeMoney(snapshot.cashAvailableCents)}`}
        reducedMotion={reducedMotion}
        style={heroNumberStyle}
        valueCents={snapshot.cashAvailableCents}
      />
      <InlineSparkline points={cashflow} reducedMotion={reducedMotion} />
      <View style={styles.dasRow}>
        <View style={styles.dasAccent} />
        <TriangleAlert color={palette.warning} size={14} strokeWidth={1.8} />
        <Text style={styles.dasText}>
          {snapshot.dasDueLabel} · {formatPrototypeMoney(snapshot.dasDueCents)}
        </Text>
      </View>
      <View style={styles.panoramaFooter}>
        <Metric label="Faturamento acumulado" value={formatPrototypeMoney(snapshot.accruedRevenueCents)} />
        <View style={styles.divider} />
        <Metric label="Notas emitidas" value={String(snapshot.invoicesIssuedCount)} />
      </View>
    </Reanimated.View>
  );
}

function ArcWatermark() {
  return (
    <Svg height={220} style={styles.arcWatermark} viewBox="0 0 220 220" width={220}>
      <Circle
        cx="110"
        cy="110"
        fill="none"
        opacity={0.16}
        r="95"
        stroke={palette.primary}
        strokeDasharray="4 10"
        strokeWidth={1}
      />
      <Circle cx="110" cy="110" fill="none" opacity={0.28} r="70" stroke={palette.primary} strokeWidth={1} />
    </Svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function NextMoveStrip({
  onPress,
  snapshot,
}: {
  onPress: () => void;
  snapshot: BusinessSnapshot;
}) {
  return (
    <AnimatedPressable
      accessibilityHint="Abre a ação sugerida"
      accessibilityLabel={`Próximo passo sugerido: ${snapshot.nextMoveTitle}`}
      accessibilityRole="button"
      containerStyle={styles.nextMoveContainer}
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={styles.nextMove}
    >
      <Sparkles color={palette.primary} size={15} strokeWidth={1.8} />
      <View style={styles.nextMoveCopy}>
        <Text style={styles.nextMoveTitle}>{snapshot.nextMoveTitle}</Text>
        <Text style={styles.nextMoveDetail}>{snapshot.nextMoveDetail}</Text>
      </View>
      <ChevronRight color={palette.textMuted} size={16} strokeWidth={1.8} />
    </AnimatedPressable>
  );
}

export function QuickActionsRow({ onSelect }: { onSelect: (id: QuickActionId) => void }) {
  return (
    <View style={styles.actions}>
      <AnimatedPressable
        accessibilityHint="Registrar uma entrada em poucos toques"
        accessibilityLabel="Lançar receita"
        accessibilityRole="button"
        onPress={() => {
          void triggerHaptic('selection');
          onSelect('income');
        }}
        style={styles.primaryAction}
      >
        <Text style={styles.primaryActionLabel}>Lançar receita</Text>
        <ChevronRight color={palette.onPrimary} size={18} strokeWidth={2} />
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityHint="Emitir nota fiscal em poucos toques"
        accessibilityLabel="Emitir nota"
        accessibilityRole="button"
        onPress={() => {
          void triggerHaptic('selection');
          onSelect('invoice');
        }}
        style={styles.secondaryAction}
      >
        <FileText color={palette.textSecondary} size={16} strokeWidth={1.8} />
        <Text style={styles.secondaryActionLabel}>Emitir nota fiscal</Text>
      </AnimatedPressable>
    </View>
  );
}

export function ActivityFeed({ activities }: { activities: BusinessActivity[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>O que está acontecendo</Text>
        <Text style={styles.quiet}>HOJE</Text>
      </View>
      {activities.map((activity, index) => (
        <View key={activity.id} style={styles.activityRow}>
          <View style={styles.rail}>
            <View
              style={[styles.railDot, activity.tone === 'attention' && styles.railDotAttention]}
            />
            {index < activities.length - 1 ? <View style={styles.railLine} /> : null}
          </View>
          <View style={styles.activityCopy}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDetail}>{activity.detail}</Text>
          </View>
          {activity.amountCents ? (
            <Text
              style={[
                styles.activityAmount,
                activity.tone === 'attention' && styles.activityAmountAttention,
              ]}
            >
              {activity.tone === 'attention' ? '−' : '+'}
              {formatPrototypeMoney(activity.amountCents)}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function CashflowTrend({
  points,
  reducedMotion = false,
}: {
  points: CashflowPoint[];
  reducedMotion?: boolean;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reducedMotion ? 1 : 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHART_PATH_LENGTH * (1 - progress.value),
  }));
  const path = useMemo(() => buildLinePath(points, 320, 92, 12), [points]);
  const first = points[0];
  const last = points[points.length - 1];
  const delta =
    first && last && first.valueCents !== 0
      ? Math.round(((last.valueCents - first.valueCents) / first.valueCents) * 100)
      : 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View>
          <Text style={styles.sectionTitle}>Fluxo de caixa</Text>
          <Text style={styles.sectionSubtitle}>Entradas nas últimas {points.length} semanas</Text>
        </View>
        <Text style={[styles.pulseDelta, delta < 0 && styles.pulseDeltaNegative]}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
        </Text>
      </View>
      <Svg
        accessibilityLabel={`Gráfico de fluxo de caixa, variação de ${delta}% no período`}
        height={92}
        viewBox="0 0 320 92"
        width="100%"
      >
        <Path d="M0 76 H320 M0 46 H320 M0 16 H320" stroke={palette.border} strokeWidth={1} />
        <AnimatedPath
          animatedProps={animatedProps}
          d={path}
          fill="none"
          stroke={palette.primary}
          strokeDasharray={CHART_PATH_LENGTH}
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
      <View style={styles.chartLegend}>
        <Text style={styles.quiet}>{first?.label}</Text>
        <Text style={styles.quiet}>{last?.label}</Text>
      </View>
    </View>
  );
}

export function RoundIconButton({
  accessibilityLabel,
  Icon,
  onPress,
  tone = 'default',
}: {
  accessibilityLabel: string;
  Icon: LucideIcon;
  onPress: () => void;
  tone?: 'default' | 'primary';
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.iconButton, tone === 'primary' && styles.iconButtonPrimary]}
    >
      <Icon color={tone === 'primary' ? palette.primary : palette.textSecondary} size={16} strokeWidth={1.8} />
    </AnimatedPressable>
  );
}

export function TactileModuleShell({
  children,
  id,
  index,
  isFavorite,
  onArchive,
  onFavorite,
  onMove,
  organizing,
  reducedMotion,
}: {
  children: ReactNode;
  id: PrototypeModuleId;
  index: number;
  isFavorite: boolean;
  onArchive: () => void;
  onFavorite: () => void;
  onMove: (to: number) => void;
  organizing: boolean;
  reducedMotion: boolean;
}) {
  const [active, setActive] = useState(false);
  const [translateY] = useState(() => new NativeAnimated.Value(0));
  const [scale] = useState(() => new NativeAnimated.Value(1));

  const settle = useCallback(() => {
    NativeAnimated.parallel([
      NativeAnimated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        ...prototypeMotion.settle,
      }),
      NativeAnimated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        ...prototypeMotion.press,
      }),
    ]).start();
  }, [scale, translateY]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => active && Math.abs(gesture.dy) > 5,
        onPanResponderMove: NativeAnimated.event([null, { dy: translateY }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          const offset =
            Math.abs(gesture.dy) > dragTuning.releaseThresholdPx
              ? gesture.dy > 0
                ? 1
                : -1
              : 0;
          if (offset) onMove(index + offset);
          setActive(false);
          settle();
        },
        onPanResponderTerminate: () => {
          setActive(false);
          settle();
        },
      }),
    [active, index, onMove, settle, translateY],
  );

  return (
    <NativeAnimated.View
      style={{ transform: [{ translateY }, { scale }], zIndex: active ? 10 : 0 }}
      {...pan.panHandlers}
    >
      <Pressable
        delayLongPress={dragTuning.longPressMs}
        disabled={!organizing}
        onLongPress={() => {
          setActive(true);
          if (!reducedMotion) {
            NativeAnimated.spring(scale, {
              toValue: 0.98,
              useNativeDriver: true,
              ...prototypeMotion.press,
            }).start();
          }
          void triggerHaptic('selection');
        }}
      >
        <View
          accessibilityLabel={`Módulo ${id === 'activity' ? 'Atividade' : 'Fluxo de caixa'}. Segure e arraste para reorganizar, ou use os controles.`}
        >
          {children}
          {organizing ? (
            <View style={styles.moduleControls}>
              <RoundIconButton
                Icon={ArrowUp}
                accessibilityLabel="Mover para cima"
                onPress={() => onMove(index - 1)}
              />
              <RoundIconButton
                Icon={ArrowDown}
                accessibilityLabel="Mover para baixo"
                onPress={() => onMove(index + 1)}
              />
              <RoundIconButton
                Icon={Star}
                accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Favoritar módulo'}
                onPress={onFavorite}
                tone={isFavorite ? 'primary' : 'default'}
              />
              <RoundIconButton Icon={Archive} accessibilityLabel="Arquivar módulo" onPress={onArchive} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </NativeAnimated.View>
  );
}

const styles = StyleSheet.create({
  ticker: { flexDirection: 'row' },
  ambientGlow: {
    backgroundColor: 'rgba(69,230,176,0.09)',
    borderRadius: 190,
    height: 380,
    left: -70,
    position: 'absolute',
    top: -170,
    width: 380,
  },
  ambientFade: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    height: 100,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 200,
  },
  eyebrow: { color: palette.textMuted, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.3 },
  updatedLabel: { color: palette.textMuted, fontFamily: 'Manrope_500Medium', fontSize: 10 },
  panorama: {
    borderColor: palette.borderStrong,
    borderRadius: radii.panorama,
    borderWidth: 1,
    gap: space.md,
    overflow: 'hidden',
    padding: space.xl,
  },
  arcWatermark: { position: 'absolute', right: -60, top: -60 },
  brandGlyph: { height: 22, position: 'absolute', right: space.lg, top: space.lg, width: 22 },
  brandGlyphTop: {
    backgroundColor: 'rgba(69,230,176,0.5)',
    borderBottomRightRadius: 5,
    height: 8,
    left: 4,
    position: 'absolute',
    top: 3,
    width: 9,
  },
  brandGlyphBottom: {
    backgroundColor: 'rgba(69,230,176,0.5)',
    borderTopLeftRadius: 5,
    bottom: 3,
    height: 8,
    position: 'absolute',
    right: 4,
    width: 9,
  },
  panoramaHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sparklineRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  sparklineDelta: { color: palette.primary, fontFamily: 'Manrope_600SemiBold', fontSize: 11 },
  sparklineDeltaNegative: { color: palette.danger },
  dasRow: { alignItems: 'center', flexDirection: 'row', gap: space.xs, paddingLeft: 2 },
  dasAccent: { backgroundColor: palette.warning, borderRadius: 2, height: 14, width: 3 },
  dasText: { color: palette.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12 },
  panoramaFooter: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingTop: space.md,
  },
  metric: { flex: 1, gap: space.xs },
  metricLabel: { color: palette.textMuted, fontFamily: 'Manrope_500Medium', fontSize: 10 },
  metricValue: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  divider: { backgroundColor: palette.border, marginHorizontal: space.md, width: 1 },
  nextMoveContainer: { width: '100%' },
  nextMove: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
  },
  nextMoveCopy: { flex: 1, gap: 1 },
  nextMoveTitle: { color: palette.text, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  nextMoveDetail: { color: palette.textMuted, fontFamily: 'Manrope_400Regular', fontSize: 11, lineHeight: 15 },
  actions: { gap: space.sm },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: space.lg,
  },
  primaryActionLabel: { color: palette.onPrimary, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  secondaryAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
    minHeight: 44,
    paddingHorizontal: space.xs,
  },
  secondaryActionLabel: { color: palette.textSecondary, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  section: { gap: space.xs, paddingVertical: space.xs },
  sectionHead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  sectionTitle: { color: palette.text, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  sectionSubtitle: { color: palette.textMuted, fontFamily: 'Manrope_500Medium', fontSize: 10, marginTop: 2 },
  quiet: { color: palette.textMuted, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 0.8 },
  activityRow: { flexDirection: 'row', minHeight: 58 },
  rail: { alignItems: 'center', marginRight: space.sm, width: 12 },
  railDot: { backgroundColor: palette.primary, borderRadius: 4, height: 8, marginTop: 4, width: 8 },
  railDotAttention: { backgroundColor: palette.warning },
  railLine: { backgroundColor: palette.border, flex: 1, marginVertical: space.xs, width: 1 },
  activityCopy: { flex: 1, paddingBottom: space.md },
  activityTitle: { color: palette.text, fontFamily: 'Manrope_600SemiBold', fontSize: 12.5 },
  activityDetail: { color: palette.textMuted, fontFamily: 'Manrope_500Medium', fontSize: 10, marginTop: 2 },
  activityAmount: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    marginLeft: space.sm,
  },
  activityAmountAttention: { color: palette.warning },
  pulseDelta: { color: palette.primary, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  pulseDeltaNegative: { color: palette.danger },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: {
    alignItems: 'center',
    borderRadius: radii.control - 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  iconButtonPrimary: { backgroundColor: palette.primarySoft },
  moduleControls: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.borderStrong,
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    position: 'absolute',
    right: space.sm,
    top: space.sm,
    zIndex: 5,
  },
});
