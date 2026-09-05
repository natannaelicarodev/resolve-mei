import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/**
 * `FormSection` existia no design system e nenhuma tela de produção o usava —
 * os formulários empilhavam campos soltos num Card único, o que lê como lista
 * em vez de estrutura. Estas checagens leem o código porque o que se protege é
 * a decisão de composição, não um texto renderizado.
 */
describe('form grouping', () => {
  it('splits the client form into identification and contact', () => {
    const source = read('src/features/clients/ClientFormScreen.tsx');
    expect(source).toContain('<FormSection title="Identificação">');
    expect(source).toContain('<FormSection title="Contato">');

    // O telefone pertence ao contato, e o documento à identificação: se as
    // seções trocarem de conteúdo, o agrupamento perde a razão de existir.
    const identification = source.slice(
      source.indexOf('title="Identificação"'),
      source.indexOf('title="Contato"'),
    );
    expect(identification).toContain('name="document"');
    expect(identification).not.toContain('name="phone"');

    // As duas seções continuam independentes dentro da composição elevada;
    // voltar ao Card único recriaria a lista longa sem hierarquia visual.
    expect(source.match(/<Card variant="elevated">/g)).toHaveLength(2);
    expect(source).toContain('width: windowWidth + 4');
  });

  // Quatro campos não justificam duas seções; o que faltava era peso no campo
  // que define o registro.
  it('keeps the service form in one block with an emphasised price', () => {
    const source = read('src/features/services/ServiceFormScreen.tsx');
    expect(source).not.toContain('<FormSection');
    expect(source).toContain('styles.priceField');
    expect(source).toContain('backgroundColor: colors.primarySubtle');
    expect(source).toContain('width: windowWidth + 4');
    expect(source).toContain('style={styles.formCard} variant="elevated"');
  });

  it('separates the optional link from the expense itself', () => {
    const source = read('src/features/expenses/ExpenseFormScreen.tsx');
    expect(source).toContain('<FormSection title="Despesa">');
    expect(source).toContain('setLinkOpen');

    // Um vínculo já preenchido não pode ficar escondido atrás do recolhimento.
    expect(source).toContain(
      'if (value.quoteId || value.recurring) setLinkOpen(true);',
    );
  });

  // Formulário existe para ser preenchido rápido: movimento na abertura atrasa
  // o primeiro toque.
  it.each([
    'src/features/clients/ClientFormScreen.tsx',
    'src/features/services/ServiceFormScreen.tsx',
    'src/features/expenses/ExpenseFormScreen.tsx',
  ])('%s has no entrance animation', (path) => {
    expect(read(path)).not.toContain('<FadeInView');
  });
});
