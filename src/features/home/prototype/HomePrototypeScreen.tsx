import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { RotateCcw, SlidersHorizontal } from 'lucide-react-native';

import { AnimatedPressable, FadeInView, useReducedMotion } from '@/components/motion';
import { Text } from '@/components/ui';
import { DynamicSheet } from './DynamicSheet';
import {
  prototypeActivities,
  prototypeCashflow,
  prototypeModules,
  prototypeSnapshot,
} from './model';
import type { PrototypeModuleId, QuickActionId } from './model';
import {
  createInitialOrganization,
  favoriteModule,
  hideModule,
  moveModule,
  resetOrganization,
  restoreModule,
} from './organization';
import type { OrganizationState } from './organization';
import {
  ActivityFeed,
  AmbientBackdrop,
  BusinessPanorama,
  CashflowTrend,
  NextMoveStrip,
  QuickActionsRow,
  TactileModuleShell,
} from './PrototypePrimitives';
import { palette, radii, space } from './tokens';

function moduleLabel(id: PrototypeModuleId): string {
  return id === 'activity' ? 'Atividade' : 'Fluxo de caixa';
}

export function HomePrototypeScreen() {
  const systemReducedMotion = useReducedMotion();
  const [reducedMotionOverride, setReducedMotionOverride] = useState<boolean | null>(null);
  const reducedMotion = reducedMotionOverride ?? systemReducedMotion;
  const [organization, setOrganization] = useState(() =>
    createInitialOrganization(prototypeModules),
  );
  const [organizing, setOrganizing] = useState(false);
  const [sheet, setSheet] = useState<QuickActionId | null>(null);
  const { width } = useWindowDimensions();
  const modules = organization.order as PrototypeModuleId[];

  if (!__DEV__) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableTitle}>Protótipo indisponível</Text>
        <Text style={styles.unavailableCopy}>
          Esta rota existe somente no ambiente de desenvolvimento.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AmbientBackdrop reducedMotion={reducedMotion} />
      <ScrollView
        contentContainerStyle={[styles.content, width >= 700 && styles.contentTablet]}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0} distance={8} style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PROTÓTIPO · HOME</Text>
            <Text style={styles.greeting}>Bom dia, Ana.</Text>
            <Text style={styles.greetingContext}>
              Aqui está o que importa no seu negócio agora.
            </Text>
          </View>
          <AnimatedPressable
            accessibilityLabel={organizing ? 'Concluir organização' : 'Organizar Home'}
            onPress={() => setOrganizing((value) => !value)}
            style={styles.organizeButton}
          >
            <SlidersHorizontal
              color={organizing ? palette.primary : palette.textSecondary}
              size={18}
              strokeWidth={1.8}
            />
          </AnimatedPressable>
        </FadeInView>

        <FadeInView delay={60} distance={10}>
          <BusinessPanorama
            cashflow={prototypeCashflow}
            reducedMotion={reducedMotion}
            snapshot={prototypeSnapshot}
          />
        </FadeInView>

        <FadeInView delay={110} distance={10}>
          <NextMoveStrip onPress={() => setSheet('invoice')} snapshot={prototypeSnapshot} />
        </FadeInView>

        <FadeInView delay={150} distance={10}>
          <QuickActionsRow onSelect={setSheet} />
        </FadeInView>

        {modules.map((id, index) => (
          <FadeInView delay={190 + index * 40} distance={10} key={id}>
            <TactileModuleShell
              id={id}
              index={index}
              isFavorite={organization.favorites.includes(id)}
              onArchive={() => setOrganization((state) => hideModule(state, id))}
              onFavorite={() => setOrganization((state) => favoriteModule(state, id))}
              onMove={(to) => setOrganization((state) => moveModule(state, id, to))}
              organizing={organizing}
              reducedMotion={reducedMotion}
            >
              {id === 'activity' ? (
                <ActivityFeed activities={prototypeActivities} />
              ) : (
                <CashflowTrend points={prototypeCashflow} reducedMotion={reducedMotion} />
              )}
            </TactileModuleShell>
          </FadeInView>
        ))}

        {organization.hidden.length ? (
          <View style={styles.hiddenTray}>
            <Text style={styles.hiddenTitle}>Módulos arquivados</Text>
            {organization.hidden.map((id) => (
              <Pressable
                accessibilityRole="button"
                key={id}
                onPress={() => setOrganization((state) => restoreModule(state, id))}
                style={styles.restore}
              >
                <RotateCcw color={palette.primary} size={14} strokeWidth={1.8} />
                <Text style={styles.restoreText}>Restaurar {moduleLabel(id as PrototypeModuleId)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <DevInspector
          onReset={() => setOrganization((state) => resetOrganization(state))}
          organization={organization}
          organizing={organizing}
          reducedMotion={reducedMotion}
          setReducedMotionOverride={setReducedMotionOverride}
        />
        <View style={{ height: 108 }} />
      </ScrollView>
      <DynamicSheet action={sheet} onClose={() => setSheet(null)} />
    </View>
  );
}

function DevInspector({
  onReset,
  organization,
  organizing,
  reducedMotion,
  setReducedMotionOverride,
}: {
  onReset: () => void;
  organization: OrganizationState;
  organizing: boolean;
  reducedMotion: boolean;
  setReducedMotionOverride: (value: boolean) => void;
}) {
  return (
    <View style={styles.inspector}>
      <View style={styles.inspectorHead}>
        <Text style={styles.inspectorLabel}>ESTADO VISÍVEL (DEV)</Text>
        <Pressable accessibilityLabel="Redefinir organização" onPress={onReset} style={styles.reset}>
          <RotateCcw color={palette.textSecondary} size={14} strokeWidth={1.8} />
        </Pressable>
      </View>
      <Text style={styles.stateLine}>ordem · {organization.order.join(' → ') || 'vazia'}</Text>
      <Text style={styles.stateLine}>favoritos · {organization.favorites.join(', ') || 'nenhum'}</Text>
      <Text style={styles.stateLine}>arquivados · {organization.hidden.join(', ') || 'nenhum'}</Text>
      <Text style={styles.stateLine}>organizar · {organizing ? 'ativo' : 'inativo'}</Text>
      <View style={styles.motionRow}>
        <Text style={styles.motionText}>Reduzir movimento (forçar)</Text>
        <Switch
          onValueChange={setReducedMotionOverride}
          thumbColor={reducedMotion ? palette.primary : '#777'}
          trackColor={{ false: '#2A2A2A', true: palette.primarySoft }}
          value={reducedMotion}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.background, flex: 1 },
  content: {
    alignSelf: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    width: '100%',
  },
  contentTablet: { maxWidth: 640, paddingHorizontal: space.xxl },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: palette.primary, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.3 },
  greeting: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    letterSpacing: -1.3,
    lineHeight: 38,
    marginTop: 6,
  },
  greetingContext: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    maxWidth: 240,
  },
  organizeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginTop: 2,
    width: 42,
  },
  unavailable: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    gap: space.sm,
    justifyContent: 'center',
    padding: space.xxl,
  },
  unavailableTitle: { color: palette.text, fontFamily: 'Manrope_700Bold', fontSize: 20 },
  unavailableCopy: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  hiddenTray: {
    borderColor: palette.border,
    borderRadius: radii.card,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  hiddenTitle: { color: palette.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 11 },
  restore: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderRadius: radii.control,
    flexDirection: 'row',
    gap: space.xs,
    minHeight: 42,
    paddingHorizontal: space.md,
  },
  restoreText: { color: palette.primary, fontFamily: 'Manrope_600SemiBold', fontSize: 11 },
  inspector: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  inspectorHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inspectorLabel: { color: palette.primary, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1 },
  reset: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderRadius: radii.control,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stateLine: { color: palette.textMuted, fontFamily: 'Manrope_500Medium', fontSize: 10 },
  motionRow: {
    alignItems: 'center',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
    paddingTop: space.sm,
  },
  motionText: { color: palette.textSecondary, fontFamily: 'Manrope_600SemiBold', fontSize: 11 },
});
