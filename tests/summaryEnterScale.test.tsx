import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { motion } from '@/theme';

/**
 * A entrada do resumo é o que substitui a transição de bounds entre telas: o
 * bloco cresce de `enterScale` até 1 junto do fade, sugerindo que o card
 * tocado na lista virou este cabeçalho — sem trocar o Stack nativo por uma
 * transição dirigida em JS, que custaria o gesto nativo de voltar.
 *
 * As checagens leem o código: sob o stub do Reanimated a animação assenta
 * instantaneamente, então um teste de render veria a escala final em 1 e
 * passaria mesmo se a escala inicial tivesse sido removida.
 */
const ROOT = join(__dirname, '..');

const SUMMARY_SCREENS = [
  'src/features/quotes/QuoteDetailsScreen.tsx',
  'src/features/service-orders/ServiceOrderDetailsScreen.tsx',
  'src/features/expenses/ResultScreen.tsx',
  'src/features/expenses/ExpenseListScreen.tsx',
];

/** Telas mantidas deliberadamente simples: entram sem escala. */
const PLAIN_SCREENS = [
  'src/features/auth/AuthShell.tsx',
  'src/features/profile/ProfileScreen.tsx',
];

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

it('keeps the enter scale subtle enough to read as one gesture', () => {
  // Abaixo de 0.9 vira "pop" e chama atenção para si; acima de 0.99 não é
  // perceptível e não vale o custo.
  expect(motion.enterScale).toBeGreaterThanOrEqual(0.9);
  expect(motion.enterScale).toBeLessThan(1);
});

it.each(SUMMARY_SCREENS)('%s grows its summary block on enter', (path) => {
  const source = read(path);
  expect(source).toContain('scaleFrom={motion.enterScale}');
  // A escala acompanha o mesmo deslocamento já aprovado, não o substitui.
  expect(source).toContain('distance={motion.distance.medium}');
});

it.each(PLAIN_SCREENS)('%s enters without a scale', (path) => {
  expect(read(path)).not.toContain('scaleFrom');
});

it('drives the scale from the same progress as the fade', () => {
  const source = read('src/components/motion/FadeInView.tsx');
  // Um segundo shared value para a escala poderia dessincronizar do fade.
  expect(source).toContain('scaleFrom + (1 - scaleFrom) * progress.value');
  // Movimento reduzido zera a escala junto com o deslocamento.
  expect(source).toContain('scaleFrom === undefined || reducedMotion');
});
