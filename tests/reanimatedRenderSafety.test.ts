import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reanimated forbids reading a shared value during render. Doing it produces
 * the strict-mode warning "Reading from `value` during component render" and,
 * far worse, makes a component render from state React cannot track — which is
 * what once left an invisible overlay across the whole app.
 *
 * These checks read the source directly, because a Jest run cannot catch it:
 * the Reanimated stub settles animations instantly, so a value read in render
 * happens to be correct under test and wrong on a device.
 */
const ROOT = join(__dirname, '..');

/** Every file that actually holds animated state. */
const FILES = [
  'src/components/motion/AnimatedPressable.tsx',
  'src/components/motion/FadeInView.tsx',
  'src/components/motion/StepTransition.tsx',
  'src/components/motion/SuccessTransition.tsx',
  'src/components/ui/Toast.tsx',
  'src/features/daylight/DaylightPrimitives.tsx',
  'src/features/navigation/ProtectedNavigation.tsx',
];

/** Source with comments stripped, so prose cannot satisfy or trip a check. */
function bodyOf(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Hooks whose body is not render scope: animated hooks run on the UI thread,
 * and effects run after commit. Reading a shared value inside any of them is
 * legitimate.
 */
const SAFE_HOOKS =
  /use(AnimatedStyle|DerivedValue|AnimatedReaction|AnimatedProps|AnimatedScrollHandler|Effect|LayoutEffect|Callback|Memo)\(/;

/**
 * Everything left after cutting those hooks out is render scope, where reading
 * a shared value is not allowed. Spans are matched by balanced parentheses
 * rather than by indentation, so a one-line arrow body and a multi-line block
 * are both removed correctly.
 */
function renderScopeOf(source: string): string {
  let scope = cutBalanced(source, SAFE_HOOKS);
  // A helper declared in the component body runs only when an event handler
  // calls it, never during render. `const animate = (…) => { … }` is the
  // shape; without cutting it, its writes read as render-scope access.
  scope = cutBalanced(scope, /const \w+ = \([^)]*\) => \{/, '{', '}');
  // Any callback carrying the worklet directive also runs on the UI thread.
  return scope.replace(/\{\s*'worklet';[\s\S]*?\n {4,}\}/g, '');
}

/** Removes each match of `pattern` together with its balanced span. */
function cutBalanced(
  source: string,
  pattern: RegExp,
  open = '(',
  close = ')',
): string {
  let scope = source;
  for (;;) {
    const match = pattern.exec(scope);
    if (!match) break;
    const start = scope.indexOf(open, match.index + match[0].length - 1);
    if (start === -1) break;
    let depth = 0;
    let end = scope.length;
    for (let index = start; index < scope.length; index += 1) {
      if (scope[index] === open) depth += 1;
      else if (scope[index] === close) {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }
    scope = scope.slice(0, match.index) + scope.slice(end);
  }
  return scope;
}

describe('Reanimated safety', () => {
  it('checks every file that holds animated state', () => {
    expect(FILES.length).toBeGreaterThan(0);
    // Guards against the list going stale: a new file with shared values has
    // to be added here deliberately.
    for (const path of FILES) {
      expect(() => readFileSync(join(ROOT, path), 'utf8')).not.toThrow();
    }
  });

  it.each(FILES)('%s never reads a shared value during render', (path) => {
    const source = bodyOf(path);
    const scope = renderScopeOf(source);

    // Only names actually declared as shared values count; `styles.value` is a
    // stylesheet key, not animated state.
    const shared = [
      ...source.matchAll(/const (\w+) = useSharedValue\(/g),
      ...source.matchAll(/const (\w+) = useDerivedValue\(/g),
    ].map((match) => match[1]);

    const offenders = shared.filter((name) =>
      new RegExp(`\\b${name}\\.value\\b`).test(scope),
    );
    expect(offenders).toEqual([]);
  });

  it.each(FILES)('%s never calls .get() during render', (path) => {
    const scope = renderScopeOf(bodyOf(path));
    const offenders = scope.match(/\w+\.get\(\)/g) ?? [];
    expect(offenders).toEqual([]);
  });

  it.each(FILES)('%s never gates rendering on animated state', (path) => {
    const body = bodyOf(path);
    // The specific shape that once froze the app: an early return decided by a
    // shared value rather than by React state.
    expect(body).not.toMatch(/if\s*\([^)]*\.value[^)]*\)\s*return/);
  });
});

describe('touch targets', () => {
  const SPACING = readFileSync(join(ROOT, 'src/theme/spacing.ts'), 'utf8');
  // Scoped to the sizes block: `card` also names a radius, and matching the
  // wrong one would assert against a corner instead of a height.
  const SIZES = /sizes = \{([\s\S]*?)\} as const;/.exec(SPACING)?.[1] ?? '';
  const sizeOf = (key: string) =>
    Number(new RegExp(`${key}:\\s*(\\d+)`).exec(SIZES)?.[1]);

  it('reads the sizes block, not some other scale', () => {
    expect(SIZES).not.toBe('');
    expect(Number.isFinite(sizeOf('touchTarget'))).toBe(true);
  });

  it('keeps every interactive control at or above 44px', () => {
    expect(sizeOf('touchTarget')).toBeGreaterThanOrEqual(44);
    expect(sizeOf('controlHeight')).toBeGreaterThanOrEqual(44);
    expect(sizeOf('buttonMinHeight')).toBeGreaterThanOrEqual(44);
    expect(sizeOf('inputHeight')).toBeGreaterThanOrEqual(44);
  });
});
