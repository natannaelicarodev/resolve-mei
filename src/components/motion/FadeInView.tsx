import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

export interface FadeInViewProps extends PropsWithChildren<ViewProps> {
  delay?: number;
  distance?: number;
  /**
   * Escala inicial, para o bloco de resumo de uma tela de detalhe: entrar de
   * 0.98 sugere que o card tocado na lista se expandiu até virar este
   * cabeçalho, sem trocar a transição nativa do Stack por uma dirigida em JS.
   * Fica desligado por padrão — telas mantidas deliberadamente simples
   * (autenticação, perfil, formulários) não recebem esse tratamento.
   */
  scaleFrom?: number;
}

export function FadeInView({
  children,
  delay = 0,
  distance = motion.distance.small,
  scaleFrom,
  style,
  ...props
}: FadeInViewProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    const animation = withTiming(1, {
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
    });
    progress.value = reducedMotion ? animation : withDelay(delay, animation);
  }, [delay, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: reducedMotion ? 0 : (1 - progress.value) * distance },
      {
        // Interpola de `scaleFrom` até 1 acompanhando o mesmo progresso do
        // fade, para os dois se moverem como um gesto só. Sem `scaleFrom`, ou
        // com movimento reduzido, fica em 1 e não altera o layout.
        scale:
          scaleFrom === undefined || reducedMotion
            ? 1
            : scaleFrom + (1 - scaleFrom) * progress.value,
      },
    ],
  }));

  return (
    <Animated.View {...props} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
