import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { PathProps } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const VIEW_BOX = '0 0 320 360';
const SYMBOL_COLORS = {
  backgroundColor: '#121A1F',
  stroke: '#8EC5DE',
} as const;

const PATHS = [
  {
    d: 'M76 153 C65 179 64 240 78 269 C93 300 126 310 160 310 C194 310 227 300 242 269 C256 240 255 179 244 153',
    end: 0.55,
    id: 'head',
    length: 430.542,
    start: 0,
  },
  {
    d: 'M78 147 C84 103 109 72 143 64 C154 61 166 61 177 64 C211 72 236 103 242 147',
    end: 0.55,
    id: 'helmet-dome',
    length: 258.892,
    start: 0.05,
  },
  {
    d: 'M62 153 C104 140 216 140 258 153',
    end: 0.58,
    id: 'helmet-brim',
    length: 197.533,
    start: 0.18,
  },
  {
    d: 'M160 62 L160 139 M113 82 C103 101 98 120 98 143 M207 82 C217 101 222 120 222 143',
    end: 0.7,
    id: 'helmet-details',
    length: 203.965,
    start: 0.3,
  },
  {
    d: 'M127 190 L127 220 M193 190 L193 220',
    end: 0.78,
    id: 'eyes',
    length: 60,
    start: 0.55,
  },
  {
    d: 'M91 294 C69 303 56 319 52 340 M229 294 C251 303 264 319 268 340',
    end: 0.9,
    id: 'shoulders',
    length: 126.166,
    start: 0.62,
  },
] as const;

interface DrawingPathProps {
  completed: boolean;
  d: string;
  end: number;
  length: number;
  progress: SharedValue<number>;
  start: number;
}

function DrawingPath({
  completed,
  d,
  end,
  length,
  progress,
  start,
}: DrawingPathProps) {
  const animatedProps = useAnimatedProps<PathProps>(() => ({
    strokeDashoffset: completed
      ? 0
      : length *
        (1 -
          interpolate(
            progress.value,
            [start, end],
            [0, 1],
            Extrapolation.CLAMP,
          )),
  }));

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={d}
      strokeDasharray={`${length} ${length}`}
    />
  );
}

export function TaviMonolineSymbol({
  completed = false,
  progress,
  size = 240,
}: {
  completed?: boolean;
  progress: SharedValue<number>;
  size?: number;
}) {
  return (
    <Svg
      accessibilityElementsHidden
      fill="none"
      height={size * 1.125}
      importantForAccessibility="no-hide-descendants"
      viewBox={VIEW_BOX}
      width={size}
    >
      {PATHS.map((path) => (
        <DrawingPath
          completed={completed}
          d={path.d}
          end={path.end}
          key={path.id}
          length={path.length}
          progress={progress}
          start={path.start}
        />
      ))}
    </Svg>
  );
}

export { SYMBOL_COLORS };
