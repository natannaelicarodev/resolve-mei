import { render } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';

import { ConfirmationDialog, Dialog, Text } from '@/components/ui';
import { ThemeProvider } from '@/theme';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

const mockDimensions = jest.mocked(useWindowDimensions);

function setViewport({
  width = 400,
  height = 800,
  fontScale = 1,
}: {
  width?: number;
  height?: number;
  fontScale?: number;
}) {
  mockDimensions.mockReturnValue({ width, height, fontScale, scale: 2 });
}

beforeEach(() => {
  jest.clearAllMocks();
  setViewport({});
});

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (merged, entry) => ({ ...merged, ...flatten(entry) }),
      {},
    );
  }
  return (style ?? {}) as Record<string, unknown>;
}

// O diálogo nunca pode ultrapassar a viewport: numa tela baixa, ou com o
// teclado aberto, o conteúdo tem que rolar dentro dele em vez de sair da tela.
it('limits the dialog height to the viewport', async () => {
  setViewport({ height: 640 });

  const screen = await render(
    <ThemeProvider>
      <Dialog onClose={() => undefined} title="Detalhes" visible>
        <Text>Conteúdo</Text>
      </Dialog>
    </ThemeProvider>,
  );

  const surface = flatten(screen.getByTestId('dialog-surface').props.style);
  expect(surface.maxHeight).toBe(640 - 64);

  await screen.unmount();
});

// Em telas muito baixas o limite não pode encolher indefinidamente, senão o
// diálogo fica menor que o próprio cabeçalho.
it('keeps a minimum height on very short viewports', async () => {
  setViewport({ height: 300 });

  const screen = await render(
    <ThemeProvider>
      <Dialog onClose={() => undefined} title="Detalhes" visible>
        <Text>Conteúdo</Text>
      </Dialog>
    </ThemeProvider>,
  );

  const surface = flatten(screen.getByTestId('dialog-surface').props.style);
  expect(surface.maxHeight).toBe(280);

  await screen.unmount();
});

it('scrolls its content and keeps taps working with the keyboard open', async () => {
  const screen = await render(
    <ThemeProvider>
      <Dialog onClose={() => undefined} title="Detalhes" visible>
        <Text>Conteúdo</Text>
      </Dialog>
    </ThemeProvider>,
  );

  const scroll = screen.getByTestId('dialog-scroll');
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  expect(screen.getByText('Conteúdo')).toBeTruthy();

  await screen.unmount();
});

// Lado a lado, dois botões numa tela estreita ou com fonte ampliada ficam
// truncados. Empilhar preserva o rótulo inteiro de cada ação.
it('lays the confirmation actions side by side on a roomy viewport', async () => {
  setViewport({ width: 600, fontScale: 1 });

  const screen = await render(
    <ThemeProvider>
      <ConfirmationDialog
        confirmLabel="Excluir despesa"
        description="A despesa deixará de entrar no resultado."
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Excluir?"
        visible
      />
    </ThemeProvider>,
  );

  const actions = flatten(screen.getByTestId('dialog-actions').props.style);
  expect(actions.flexDirection).toBe('row');

  await screen.unmount();
});

it('stacks the confirmation actions on a narrow viewport', async () => {
  setViewport({ width: 360, fontScale: 1 });

  const screen = await render(
    <ThemeProvider>
      <ConfirmationDialog
        confirmLabel="Excluir despesa"
        description="A despesa deixará de entrar no resultado."
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Excluir?"
        visible
      />
    </ThemeProvider>,
  );

  const actions = flatten(screen.getByTestId('dialog-actions').props.style);
  expect(actions.flexDirection).toBe('column');
  expect(actions.flexWrap).toBe('nowrap');

  await screen.unmount();
});

it('stacks the confirmation actions when the font is enlarged', async () => {
  setViewport({ width: 600, fontScale: 1.3 });

  const screen = await render(
    <ThemeProvider>
      <ConfirmationDialog
        confirmLabel="Excluir despesa"
        description="A despesa deixará de entrar no resultado."
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Excluir?"
        visible
      />
    </ThemeProvider>,
  );

  // Viewport larga, mas fonte ampliada: o empilhamento tem que valer mesmo
  // quando só o `fontScale` justifica.
  const actions = flatten(screen.getByTestId('dialog-actions').props.style);
  expect(actions.flexDirection).toBe('column');

  await screen.unmount();
});
