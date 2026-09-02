import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import { ThemeProvider } from '@/theme';

const PATTERNS = join(__dirname, '..', 'src/components/ui/patterns.tsx');

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
}));

/**
 * A marca de selecionado fica montada nos dois estados para que a saída possa
 * ser animada — sem isso o glyph apareceria seco no meio de uma transição de
 * cor suave, que lê pior do que não animar nada. Presença no DOM deixa de
 * distinguir os estados, então quem carrega isso é a opacidade.
 */
it('collapses the selected mark while unselected', async () => {
  const screen = await render(
    <ThemeProvider>
      <Chip label="Aprovados" onPress={jest.fn()} />
    </ThemeProvider>,
  );

  const chip = screen.getByRole('button', { name: 'Aprovados' });
  expect(chip.props.accessibilityState).toMatchObject({ selected: false });

  await screen.unmount();
});

it('marks the chip as selected for assistive technology', async () => {
  const screen = await render(
    <ThemeProvider>
      <Chip label="Aprovados" onPress={jest.fn()} selected />
    </ThemeProvider>,
  );

  // O estado tem que continuar legível pela árvore de acessibilidade, nunca
  // apenas pela cor ou pela marca animada.
  expect(
    screen.getByRole('button', { name: 'Aprovados' }).props.accessibilityState,
  ).toMatchObject({ selected: true });

  await screen.unmount();
});

// A superfície animada é a que carrega borda e raio: se voltarem para o miolo,
// a cor deixa de animar porque o Pressable interno ignora estilo do Reanimated.
it('keeps border and radius on the animated surface', () => {
  const source = readFileSync(PATTERNS, 'utf8');
  const surface = /chipSurface: \{([\s\S]*?)\},/.exec(source)?.[1] ?? '';
  expect(surface).toContain('borderRadius');
  expect(surface).toContain('borderWidth');

  const chip = /\n  chip: \{([\s\S]*?)\},/.exec(source)?.[1] ?? '';
  expect(chip).not.toContain('borderWidth');
});

it('drives the chip colour from the same progress as the mark', () => {
  const source = readFileSync(PATTERNS, 'utf8');
  // Um segundo shared value dessincronizaria a cor da marca.
  expect(source).toContain('interpolateColor(');
  expect(source).toContain('opacity: progress.value');
  // Movimento reduzido salta direto para o estado final.
  expect(source).toContain('reducedMotion\n      ? target');
});

it('flattens to a pill-shaped surface', async () => {
  const screen = await render(
    <ThemeProvider>
      <Chip label="Aprovados" onPress={jest.fn()} selected />
    </ThemeProvider>,
  );

  const chip = screen.getByRole('button', { name: 'Aprovados' });
  const style = StyleSheet.flatten(chip.props.style) as
    { minHeight?: number } | undefined;
  // O alvo de toque não pode encolher por causa da mudança de estrutura.
  expect(style?.minHeight).toBe(40);

  await screen.unmount();
});
