import { useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { CircleCheck, X } from 'lucide-react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion';
import { Text } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import type { QuickActionId } from './model';
import { dragTuning, elevation, palette, prototypeMotion, radii, space } from './tokens';

type Step = 'pick' | 'confirm' | 'done';

const copy: Record<QuickActionId, { confirmHint: string; label: string; pickHint: string }> = {
  income: {
    confirmHint: 'Confirme o valor recebido. Nenhum dado real é alterado neste protótipo.',
    label: 'Lançar receita',
    pickHint: 'De onde veio esse dinheiro?',
  },
  invoice: {
    confirmHint: 'Confirme os dados da nota antes de emitir. Nenhum dado real é alterado neste protótipo.',
    label: 'Emitir nota',
    pickHint: 'Para qual cliente é essa nota?',
  },
};

export function DynamicSheet({
  action,
  onClose,
}: {
  action: QuickActionId | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('pick');
  const [measuredOnce, setMeasuredOnce] = useState(false);
  const height = useSharedValue(0);
  const dragY = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    if (!measuredOnce) {
      height.value = measured;
      setMeasuredOnce(true);
    } else {
      height.value = withSpring(measured, prototypeMotion.sheet);
    }
  };

  const close = () => {
    onClose();
    setStep('pick');
    setMeasuredOnce(false);
    dragY.value = 0;
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          dragY.value = Math.max(0, gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > dragTuning.sheetDismissThresholdPx || gesture.vy > 1.2) {
            close();
          } else {
            dragY.value = withSpring(0, prototypeMotion.sheet);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    height: measuredOnce ? height.value : undefined,
    transform: [{ translateY: dragY.value }],
  }));

  if (!action) return null;
  const meta = copy[action];

  return (
    <Modal animationType="fade" onRequestClose={close} transparent visible>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Fechar" onPress={close} style={StyleSheet.absoluteFill}>
          <BlurView intensity={36} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.backdropTint} />
        </Pressable>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheetWrapper}>
          {/* Shadow lives on this wrapper; the inner view clips corners and
              content, since overflow:hidden on the same node would clip the
              shadow itself away. */}
          <Reanimated.View style={[styles.sheetShadow, elevation, animatedStyle]}>
            <View style={styles.sheet}>
              <View onLayout={handleLayout} style={styles.measured}>
                <View {...pan.panHandlers} style={styles.handleArea}>
                  <View style={styles.handle} />
                </View>
                <View style={styles.head}>
                  <View>
                    <Text style={styles.eyebrow}>AÇÃO RÁPIDA</Text>
                    <Text style={styles.title}>{meta.label}</Text>
                  </View>
                  <AnimatedPressable
                    accessibilityLabel="Fechar painel"
                    onPress={close}
                    style={styles.closeButton}
                  >
                    <X color={palette.textSecondary} size={18} strokeWidth={1.8} />
                  </AnimatedPressable>
                </View>
                {step === 'pick' ? (
                  <PickStep hint={meta.pickHint} onNext={() => setStep('confirm')} />
                ) : step === 'confirm' ? (
                  <ConfirmStep
                    hint={meta.confirmHint}
                    onBack={() => setStep('pick')}
                    onConfirm={() => {
                      void triggerHaptic('success');
                      setStep('done');
                    }}
                  />
                ) : (
                  <DoneStep onClose={close} />
                )}
              </View>
            </View>
          </Reanimated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.primaryButton}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.ghostButton}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

function PickStep({ hint, onNext }: { hint: string; onNext: () => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.fakeField}>
        <Text style={styles.fakeFieldLabel}>TOQUE PARA ESCOLHER</Text>
        <Text style={styles.fakeFieldValue}>Selecionar</Text>
      </View>
      <PrimaryButton label="Continuar" onPress={onNext} />
    </View>
  );
}

function ConfirmStep({
  hint,
  onBack,
  onConfirm,
}: {
  hint: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.hint}>{hint}</Text>
      <PrimaryButton label="Confirmar" onPress={onConfirm} />
      <GhostButton label="Voltar" onPress={onBack} />
    </View>
  );
}

function DoneStep({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.step}>
      <View style={styles.doneMark}>
        <CircleCheck color={palette.primary} size={26} strokeWidth={1.8} />
      </View>
      <Text style={styles.hint}>Concluído. Nenhum dado real foi alterado neste protótipo.</Text>
      <PrimaryButton label="Fechar" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheetWrapper: { width: '100%' },
  sheetShadow: { borderRadius: radii.sheet },
  sheet: {
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.borderStrong,
    borderRadius: radii.sheet,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  measured: { paddingBottom: space.xl, paddingHorizontal: space.lg },
  handleArea: { alignItems: 'center', paddingTop: space.sm, paddingVertical: space.md },
  handle: { backgroundColor: palette.borderStrong, borderRadius: 3, height: 4, width: 34 },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  eyebrow: { color: palette.primary, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.2 },
  title: { color: palette.text, fontFamily: 'Manrope_700Bold', fontSize: 22, letterSpacing: -0.5, marginTop: 4 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: palette.surfacePressed,
    borderRadius: radii.control,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  step: { gap: space.md },
  hint: { color: palette.textSecondary, fontFamily: 'Manrope_400Regular', fontSize: 13, lineHeight: 19 },
  fakeField: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radii.input,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  fakeFieldLabel: { color: palette.textMuted, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1 },
  fakeFieldValue: { color: palette.textSecondary, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  doneMark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryLabel: { color: palette.onPrimary, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  ghostButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  ghostLabel: { color: palette.textSecondary, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
});
