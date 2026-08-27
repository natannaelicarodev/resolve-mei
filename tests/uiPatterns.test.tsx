import { fireEvent, render } from '@testing-library/react-native';

import {
  Chip,
  DateInput,
  EmptyState,
  ListItem,
  MoneyInput,
  Select,
  Switch,
} from '@/components/ui';
import { ThemeProvider } from '@/theme';

function renderThemed(node: React.ReactNode) {
  return render(<ThemeProvider>{node}</ThemeProvider>);
}

describe('shared UI patterns', () => {
  it('keeps compact controls semantic and operable', async () => {
    const onChip = jest.fn();
    const onSelect = jest.fn();
    const onSwitch = jest.fn();
    const screen = await renderThemed(
      <>
        <Chip label="Ativos" onPress={onChip} selected />
        <Select label="Cliente" onPress={onSelect} value="Maria" />
        <Switch label="Serviço ativo" onValueChange={onSwitch} value />
      </>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Ativos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cliente' }));
    await fireEvent(
      screen.getByLabelText('Serviço ativo'),
      'valueChange',
      false,
    );
    expect(onChip).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSwitch).toHaveBeenCalledWith(false);
  });

  it('provides purpose-built fields and reusable states', async () => {
    const screen = await renderThemed(
      <>
        <MoneyInput label="Valor" />
        <DateInput label="Validade" />
        <ListItem title="Cliente exemplo" subtitle="Contato" />
        <EmptyState
          title="Nada por aqui"
          description="Cadastre o primeiro item."
        />
      </>,
    );
    expect(screen.getByLabelText('Valor')).toHaveProp('inputMode', 'decimal');
    expect(screen.getByLabelText('Validade')).toHaveProp(
      'placeholder',
      'DD/MM/AAAA',
    );
    expect(screen.getByText('Cliente exemplo')).toBeTruthy();
    expect(screen.getByText('Nada por aqui')).toBeTruthy();
  });
});
