import fs from 'node:fs';
import path from 'node:path';

function source(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

it('paginates clients beyond the first 20 records', () => {
  const hooks = source('src/features/clients/hooks.ts');
  const list = source('src/features/clients/ClientListScreen.tsx');

  expect(hooks).toContain('useInfiniteQuery');
  expect(hooks).toContain('getNextPageParam');
  expect(list).toContain('query.data?.pages.flat()');
  expect(list).toContain('query.fetchNextPage()');
});

it('provides searchable, incremental quote selectors', () => {
  const form = source('src/features/quotes/QuoteFormScreen.tsx');

  expect(form).toContain('useClients(');
  expect(form).toContain('useServices(');
  expect(form).toContain('label="Buscar cliente"');
  expect(form).toContain('label="Buscar serviço"');
  expect(form).toContain('clients.fetchNextPage()');
  expect(form).toContain('services.fetchNextPage()');
  expect(form).toContain('Badge label="Selecionado"');
});

// A tela "Clientes para retomar" foi fundida ao filtro da lista de clientes;
// a ação de mensagem passou a viver na seção de relacionamento do detalhe,
// onde não pode voltar a ficar aninhada num card clicável.
it('does not nest the message action inside an interactive relationship card', () => {
  const section = source(
    'src/features/relationships/ClientRelationshipSection.tsx',
  );

  expect(section).not.toContain('variant="interactive"');
  expect(section).toContain('label="Preparar mensagem"');
});
