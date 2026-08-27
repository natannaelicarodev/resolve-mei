import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  Button,
  Card,
  IconButton,
  Input,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { getBadgeAccessibilityLabel } from '@/components/ui/Badge';
import { getFeedbackAccessibilityProps } from '@/components/ui/InlineFeedback';
import { colors, radii, sizes, spacing, typography } from '@/theme';

describe('design system foundation', () => {
  it('exposes the required semantic tokens', () => {
    expect(colors).toEqual(
      expect.objectContaining({
        background: expect.any(String),
        backgroundSubtle: expect.any(String),
        surface: expect.any(String),
        primary: expect.any(String),
        successSubtle: expect.any(String),
        dangerSubtle: expect.any(String),
        focusRing: expect.any(String),
        disabled: expect.any(String),
      }),
    );
    expect(spacing).toEqual(
      expect.objectContaining({ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 16: 64 }),
    );
    expect(radii.pill).toBeGreaterThan(900);
    expect(sizes.touchTarget).toBeGreaterThanOrEqual(44);
  });

  it.each([
    'display',
    'pageTitle',
    'sectionTitle',
    'cardTitle',
    'body',
    'bodySecondary',
    'label',
    'caption',
    'button',
    'financial',
    'status',
  ] as const)('renders typography variant %s', async (variant) => {
    const screen = await render(<Text variant={variant}>Exemplo</Text>);
    expect(screen.getByText('Exemplo')).toHaveStyle({
      fontFamily: typography[variant].fontFamily,
    });
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'renders and activates the %s button',
    async (variant) => {
      const onPress = jest.fn();
      const screen = await render(
        <Button label={variant} onPress={onPress} variant={variant} />,
      );
      await fireEvent.press(screen.getByRole('button', { name: variant }));
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps button semantics for loading, success and disabled states', async () => {
    const screen = await render(
      <>
        <Button label="Salvar" loading />
        <Button label="Salvo" state="success" />
        <Button disabled label="Bloqueado" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveProp(
      'accessibilityState',
      { busy: true, disabled: true },
    );
    expect(screen.getByText('Salvo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bloqueado' })).toBeDisabled();
  });

  it('supports filled, focused, error, disabled, read-only and counted inputs', async () => {
    const onChangeText = jest.fn();
    const screen = await render(
      <>
        <Input label="Foco" onChangeText={onChangeText} value="Preenchido" />
        <Input error="Campo inválido" label="Erro" />
        <Input editable={false} label="Desabilitado" />
        <Input label="Leitura" readOnly />
        <Input label="Contador" maxLength={10} showCounter value="abc" />
      </>,
    );
    const focused = screen.getByLabelText('Foco');
    await fireEvent(focused, 'focus', { nativeEvent: {} });
    await waitFor(() =>
      expect(screen.getByLabelText('Foco')).toHaveStyle({
        borderColor: colors.focusRing,
      }),
    );
    expect(screen.getByText('Campo inválido')).toHaveProp(
      'accessibilityLiveRegion',
      'polite',
    );
    expect(screen.getByLabelText('Desabilitado')).toHaveProp(
      'accessibilityState',
      { disabled: true },
    );
    expect(screen.getByLabelText('Leitura')).toHaveProp('accessibilityState', {
      disabled: true,
    });
    expect(screen.getByText('3/10')).toBeTruthy();
  });

  it('makes interactive cards and icon buttons accessible', async () => {
    const cardPress = jest.fn();
    const iconPress = jest.fn();
    const screen = await render(
      <>
        <Card
          accessibilityLabel="Abrir item"
          onPress={cardPress}
          variant="interactive"
        >
          <Text>Item</Text>
        </Card>
        <IconButton
          accessibilityLabel="Fechar"
          icon={<Text>×</Text>}
          onPress={iconPress}
        />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir item' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(cardPress).toHaveBeenCalledTimes(1);
    expect(iconPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveStyle({
      height: sizes.touchTarget,
      width: sizes.touchTarget,
    });
  });

  it('distributes segmented options across the available width', async () => {
    const screen = await render(
      <SegmentedControl
        label="Tema"
        onChange={jest.fn()}
        options={[
          { label: 'Sistema', value: 'system' },
          { label: 'Claro', value: 'light' },
          { label: 'Escuro', value: 'dark' },
        ]}
        value="dark"
      />,
    );

    for (const label of ['Sistema', 'Claro', 'Escuro']) {
      expect(screen.getByRole('radio', { name: label }).parent).toHaveStyle({
        flex: 1,
        minWidth: 0,
      });
    }
  });

  it('communicates badge and inline feedback without color alone', async () => {
    expect(getBadgeAccessibilityLabel('Pago', 'success')).toBe('Sucesso: Pago');
    expect(getFeedbackAccessibilityProps('error')).toEqual({
      accessibilityLiveRegion: 'polite',
      accessibilityRole: 'alert',
    });
  });

  it('hides skeleton decoration from accessibility', async () => {
    const screen = await render(<Skeleton height={20} width={100} />);
    expect(screen.toJSON()).toHaveProp('accessibilityElementsHidden', true);
    expect(screen.toJSON()).toHaveProp(
      'importantForAccessibility',
      'no-hide-descendants',
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
