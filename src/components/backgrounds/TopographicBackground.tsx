import { useEffect, useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { generateTopographicLevels } from '@/lib/topography';
import type { TopographicLevel } from '@/lib/topography';
import { useReducedMotion } from '../motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Lines stay solid (as in a real topographic map); the only motion is a slow,
// per-path opacity breathing so the pattern feels alive without ever reading
// as a "marching ants" dash effect.
const BREATH_DURATION = 9000;
const BREATH_AMPLITUDE = 0.06;

const levelsCache = new Map<string, TopographicLevel[]>();

function getCachedLevels(
  width: number,
  height: number,
  seed: number,
  levels: number,
): TopographicLevel[] {
  const key = `${width}x${height}:${seed}:${levels}`;
  const cached = levelsCache.get(key);
  if (cached) return cached;
  const generated = generateTopographicLevels({ width, height, seed, levels });
  levelsCache.set(key, generated);
  return generated;
}

export interface TopographicBackgroundProps {
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  seed?: number;
  levels?: number;
  lineColor?: string;
  minOpacity?: number;
  maxOpacity?: number;
  preserveAspectRatio?: string;
  style?: StyleProp<ViewStyle>;
  /** Optional <Path> (in the same viewBox coordinates) to shape the pattern into, e.g. an organic blob. */
  clipPath?: ReactNode;
}

export function TopographicBackground({
  viewBoxWidth = 393,
  viewBoxHeight = 550,
  seed = 7,
  levels = 6,
  lineColor = 'rgba(255,255,255,1)',
  minOpacity = 0.14,
  maxOpacity = 0.3,
  preserveAspectRatio = 'none',
  style,
  clipPath,
}: TopographicBackgroundProps) {
  const clipId = useId();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  const contourLevels = useMemo(
    () => getCachedLevels(viewBoxWidth, viewBoxHeight, seed, levels),
    [viewBoxWidth, viewBoxHeight, seed, levels],
  );

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [reducedMotion, pulse]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg
        height="100%"
        preserveAspectRatio={preserveAspectRatio}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
      >
        {clipPath ? (
          <Defs>
            <ClipPath id={clipId}>{clipPath}</ClipPath>
          </Defs>
        ) : null}
        <G clipPath={clipPath ? `url(#${clipId})` : undefined}>
          {contourLevels.flatMap((contourLevel) => {
            const depth = levels === 1 ? 1 : contourLevel.level / (levels - 1);
            const opacity = minOpacity + (maxOpacity - minOpacity) * depth;
            const strokeWidth = 1.3 + 0.7 * depth;
            return contourLevel.paths.map((d, index) => (
              <ContourPath
                key={`${contourLevel.level}-${index}`}
                baseOpacity={opacity}
                color={lineColor}
                d={d}
                phase={(contourLevel.level * 5 + index) / 7}
                pulse={pulse}
                strokeWidth={strokeWidth}
              />
            ));
          })}
        </G>
      </Svg>
    </View>
  );
}

function ContourPath({
  d,
  color,
  baseOpacity,
  strokeWidth,
  pulse,
  phase,
}: {
  d: string;
  color: string;
  baseOpacity: number;
  strokeWidth: number;
  pulse: SharedValue<number>;
  phase: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const wave = Math.sin((pulse.value + phase) * Math.PI);
    return { strokeOpacity: baseOpacity + wave * BREATH_AMPLITUDE };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  );
}
