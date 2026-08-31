import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AnimatedPressable, useReducedMotion } from '@/components/motion';
import { Icon, Text } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { formatMoney, formatQuoteNumber } from '@/features/quotes/domain';
import {
  describeBlock,
  nextActionLabel,
  pipelineStages,
  stageMeta,
} from './pipeline';
import type {
  BlockReason,
  PipelineEntry,
  PipelineStage,
  PipelineSummary,
} from './pipeline';
import { homePalette as palette } from './palette';

/**
 * Each block reason gets one colour, one icon and one verb. The colour carries
 * urgency only — it is never applied to the client name or the amount, so a row
 * cannot end up amber-on-amber and lose its hierarchy.
 */
const reasonStyle: Record<
  BlockReason,
  { tint: string; soft: string; icon: IconName; label: string }
> = {
  expired: {
    tint: palette.warning,
    soft: palette.warningSoft,
    icon: 'alert',
    label: 'Vencido',
  },
  expiring: {
    tint: palette.warning,
    soft: palette.warningSoft,
    icon: 'duration',
    label: 'Vence agora',
  },
  waiting: {
    tint: palette.info,
    soft: palette.infoSoft,
    icon: 'statusInfo',
    label: 'Aguardando',
  },
  // A draft is the one blocked state nobody outside the business is waiting on,
  // so its call to action renders outlined instead of filled — see `quiet` in
  // PipelineRow. The tint still carries the spine and chip.
  unsent: {
    tint: palette.secondary,
    soft: palette.neutralSoft,
    icon: 'statusNeutral',
    label: 'Rascunho',
  },
  closed: {
    tint: palette.primary,
    soft: palette.primarySoft,
    icon: 'success',
    label: 'Aprovado',
  },
};

/**
 * The lifecycle as a horizontal density strip: one segment per stage, filled in
 * proportion to how many services sit there. Stages with no table are hatched
 * and dimmed rather than hidden, so the owner can see the ceiling the product
 * currently has.
 */
export function StageStrip({
  summary,
  onSelect,
  selected,
}: {
  summary: PipelineSummary;
  onSelect: (stage: PipelineStage | null) => void;
  selected: PipelineStage | null;
}) {
  const reduced = useReducedMotion();
  const total = Math.max(
    1,
    ...pipelineStages.map((stage) => summary.countByStage[stage]),
  );
  return (
    <View style={styles.strip}>
      <View style={styles.stripHead}>
        <Text style={styles.stripTitle}>Ciclo do serviço</Text>
        <Text style={styles.stripCaption}>
          {summary.blockedCount > 0
            ? `${summary.blockedCount} ${summary.blockedCount === 1 ? 'parado' : 'parados'}`
            : 'nada parado'}
        </Text>
      </View>
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Etapas do ciclo do serviço"
        style={styles.stripRow}
      >
        {pipelineStages.map((stage) => {
          const meta = stageMeta[stage];
          const count = summary.countByStage[stage];
          const active = selected === stage;
          return (
            <StageSegment
              key={stage}
              active={active}
              count={count}
              intensity={count / total}
              meta={meta}
              reduced={reduced}
              onPress={() => onSelect(active ? null : stage)}
            />
          );
        })}
      </View>
      <View style={styles.stripLegend}>
        <View style={styles.legendDash} />
        <Text style={styles.stripLegendText}>
          Etapas tracejadas ainda não existem no app — o ciclo termina em
          Aprovado.
        </Text>
      </View>
    </View>
  );
}

function StageSegment({
  active,
  count,
  intensity,
  meta,
  onPress,
  reduced,
}: {
  active: boolean;
  count: number;
  intensity: number;
  meta: (typeof stageMeta)[PipelineStage];
  onPress: () => void;
  reduced: boolean;
}) {
  // The bar grows toward its real share once, on mount. It is the only
  // entrance motion on this screen, and it moves in the direction of the
  // lifecycle: left to right, the way the work actually flows.
  const [grow] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      grow.setValue(1);
      return;
    }
    const animation = Animated.timing(grow, {
      delay: 40,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [grow, reduced]);

  const filled = count > 0 && meta.inSchema;
  const height = grow.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', `${Math.max(12, intensity * 100)}%`],
  });
  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        meta.inSchema
          ? `${meta.label}: ${count} ${count === 1 ? 'serviço' : 'serviços'}`
          : `${meta.label}: etapa ainda não disponível no app`
      }
      accessibilityHint={
        meta.inSchema && count > 0
          ? 'Filtra a esteira por esta etapa'
          : undefined
      }
      disableScale
      hitSlop={4}
      onPress={meta.inSchema && count > 0 ? onPress : undefined}
      style={styles.segment}
    >
      <View
        style={[
          styles.segmentTrack,
          !meta.inSchema && styles.segmentTrackProposed,
          active && styles.segmentTrackActive,
        ]}
      >
        {filled ? (
          <Animated.View style={[styles.segmentFill, { height }]} />
        ) : null}
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        style={[
          styles.segmentLabel,
          !meta.inSchema && styles.segmentLabelProposed,
          active && styles.segmentLabelActive,
        ]}
      >
        {meta.short}
      </Text>
      <Text
        style={[
          styles.segmentCount,
          !meta.inSchema && styles.segmentLabelProposed,
        ]}
      >
        {meta.inSchema ? count : '–'}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * One stuck service. The left edge is a status spine, not an icon badge: the
 * eye can run down the column and read urgency without parsing any text.
 */
export function PipelineRow({
  entry,
  first,
}: {
  entry: PipelineEntry;
  first: boolean;
}) {
  const tone = reasonStyle[entry.reason];
  const action = nextActionLabel(entry.reason);
  const quiet = entry.reason === 'unsent';
  const { quote } = entry;
  return (
    <View style={[styles.row, !first && styles.rowDivided]}>
      <View style={[styles.spine, { backgroundColor: tone.tint }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <View style={[styles.chip, { backgroundColor: tone.soft }]}>
            <Icon name={tone.icon} rawColor={tone.tint} size="small" />
            <Text style={[styles.chipText, { color: tone.tint }]}>
              {tone.label}
            </Text>
          </View>
          <Text style={styles.rowNumber}>
            #{formatQuoteNumber(quote.quote_number)}
          </Text>
        </View>
        <View style={styles.rowMain}>
          <Text numberOfLines={1} style={styles.rowClient}>
            {quote.client_name_snapshot}
          </Text>
          <Text style={styles.rowValue}>{formatMoney(entry.blockedCents)}</Text>
        </View>
        <Text style={styles.rowReason}>{describeBlock(entry)}</Text>
        <View style={styles.rowActions}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir orçamento ${formatQuoteNumber(quote.quote_number)} de ${quote.client_name_snapshot}`}
            onPress={() => router.push(`/quotes/${quote.id}`)}
            style={styles.rowGhost}
          >
            <Text style={styles.rowGhostText}>Abrir</Text>
          </AnimatedPressable>
          {action ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`${action} sobre o orçamento de ${quote.client_name_snapshot}`}
              onPress={() => router.push(`/quotes/${quote.id}`)}
              style={[
                styles.rowCta,
                quiet ? styles.rowCtaQuiet : { backgroundColor: tone.tint },
              ]}
            >
              <Text
                style={[styles.rowCtaText, quiet && styles.rowCtaTextQuiet]}
              >
                {action}
              </Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * A stage the product does not have yet. Shown once, at the foot of the rail,
 * so the owner understands why the lifecycle stops — instead of assuming the
 * app lost their work.
 */
export function ProposedStageNotice() {
  return (
    <View style={styles.notice}>
      <Icon name="statusInfo" rawColor={palette.muted} size="small" />
      <Text style={styles.noticeText}>
        Agenda, cobrança e recebimento ainda não fazem parte do app. Depois de
        aprovar, o acompanhamento continua fora daqui.
      </Text>
    </View>
  );
}

export function RailEmpty({ hasQuotes }: { hasQuotes: boolean }) {
  return (
    <View style={styles.railEmpty}>
      <Icon name="success" rawColor={palette.primary} size="medium" />
      <Text style={styles.railEmptyTitle}>
        {hasQuotes ? 'Nada parado agora' : 'Nenhum orçamento em aberto'}
      </Text>
      <Text style={styles.railEmptyCopy}>
        {hasQuotes
          ? 'Todo orçamento enviado já teve resposta. Nada exige sua atenção neste momento.'
          : 'Quando você enviar um orçamento, ele aparece aqui até o cliente responder.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  stripHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  stripCaption: {
    color: palette.secondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  stripRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
  },
  segment: { flex: 1, gap: 6 },
  segmentTrack: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    height: 44,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  segmentTrackProposed: {
    backgroundColor: 'transparent',
    borderColor: palette.border,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  segmentTrackActive: { backgroundColor: palette.primarySoft },
  segmentFill: { backgroundColor: palette.primary, width: '100%' },
  segmentLabel: {
    color: palette.secondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 8,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  segmentLabelProposed: { color: palette.faint },
  segmentLabelActive: { color: palette.primary },
  segmentCount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  stripLegend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 13,
  },
  legendDash: {
    borderColor: palette.border,
    borderRadius: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 10,
    width: 14,
  },
  stripLegendText: {
    color: palette.faint,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  row: { flexDirection: 'row', gap: 13, paddingVertical: 15 },
  rowDivided: { borderTopColor: palette.border, borderTopWidth: 1 },
  // The spine stops short of the row's padding so it reads as a marker beside
  // the content, not as a divider running the full height of the card.
  spine: { borderRadius: 2, marginVertical: 2, width: 3 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  chip: {
    alignItems: 'center',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontFamily: 'Manrope_700Bold', fontSize: 10.5 },
  rowNumber: {
    color: palette.faint,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
    marginLeft: 'auto',
  },
  rowMain: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
    marginTop: 11,
  },
  rowClient: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  rowValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  rowReason: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  rowGhost: {
    alignItems: 'center',
    borderColor: palette.borderStrong,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  rowGhostText: { fontFamily: 'Manrope_700Bold', fontSize: 12.5 },
  rowCta: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  rowCtaText: {
    color: palette.onWarning,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
  },
  rowCtaQuiet: {
    backgroundColor: 'transparent',
    borderColor: palette.borderStrong,
    borderWidth: 1,
  },
  rowCtaTextQuiet: { color: palette.text },
  notice: {
    alignItems: 'flex-start',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingTop: 14,
  },
  noticeText: {
    color: palette.faint,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 17,
  },
  railEmpty: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 9,
    paddingHorizontal: 24,
    paddingVertical: 26,
  },
  railEmptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  railEmptyCopy: {
    color: palette.secondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 19,
    maxWidth: 280,
    textAlign: 'center',
  },
});
