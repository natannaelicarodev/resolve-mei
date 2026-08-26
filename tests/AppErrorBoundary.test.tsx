import { fireEvent, render } from '@testing-library/react-native';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { Text } from '@/components/ui';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

function BrokenComponent(): React.JSX.Element {
  throw new Error('sensitive internal detail');
}

describe('AppErrorBoundary', () => {
  afterAll(() => consoleError.mockRestore());

  it('renders a safe fallback and allows retry', async () => {
    let shouldThrow = true;
    function Recoverable(): React.JSX.Element {
      if (shouldThrow) return <BrokenComponent />;
      return <Text>Recuperado</Text>;
    }

    const screen = await render(
      <AppErrorBoundary>
        <Recoverable />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('sensitive internal detail')).toBeNull();
    const diagnosticCall = consoleError.mock.calls.find(
      ([context]) => context === 'Unhandled render error',
    );
    expect(diagnosticCall).toEqual([
      'Unhandled render error',
      expect.objectContaining({
        category: 'unknown',
        name: 'Error',
        componentStack: expect.any(String),
      }),
    ]);
    expect(JSON.stringify(diagnosticCall)).not.toContain(
      'sensitive internal detail',
    );

    shouldThrow = false;
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(screen.getByText('Recuperado')).toBeTruthy();
  });
});
