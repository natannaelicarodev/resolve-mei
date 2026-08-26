import { render } from '@testing-library/react-native';

import { Input } from '@/components/ui';

describe('Input', () => {
  it('renders its label and native input properties', async () => {
    const screen = await render(
      <Input label="Nome" placeholder="Digite seu nome" />,
    );

    expect(screen.getByLabelText('Nome')).toHaveProp(
      'placeholder',
      'Digite seu nome',
    );
  });

  it('exposes an error message accessibly', async () => {
    const screen = await render(
      <Input error="Campo obrigatorio" label="Nome" />,
    );

    expect(screen.getByText('Campo obrigatorio')).toBeTruthy();
    expect(screen.getByText('Campo obrigatorio')).toHaveProp(
      'accessibilityLiveRegion',
      'polite',
    );
  });
});
