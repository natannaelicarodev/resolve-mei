import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
        successSurface: expect.any(String),
        dangerSurface: expect.any(String),
        focusRing: expect.any(String),
        surfaceDisabled: expect.any(String),
      }),
    );
    expect(spacing).toEqual(
      expect.objectContaining({ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 16: 64 }),
    );
    expect(radii.pill).toBeGreaterThan(900);
    expect(sizes.touchTarget).toBeGreaterThanOrEqual(44);
  });

  // Derivado da própria rampa: uma variante nova entra no teste sozinha, e
  // uma removida não deixa a lista dessincronizada.
  it.each(Object.keys(typography) as (keyof typeof typography)[])(
    'renders typography variant %s',
    async (variant) => {
      const screen = await render(<Text variant={variant}>Exemplo</Text>);
      expect(screen.getByText('Exemplo')).toHaveStyle({
        fontFamily: typography[variant].fontFamily,
      });
    },
  );

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

  it('never signals a destructive button by color alone', async () => {
    const screen = await render(
      <Button label="Excluir" onPress={jest.fn()} variant="danger" />,
    );
    // Label already names the action; the icon is the required non-color signal.
    expect(screen.getByTestId('button-danger-icon')).toBeTruthy();
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

  it('differentiates card variants structurally, not only by color', async () => {
    const screen = await render(
      <>
        <Card
          onPress={jest.fn()}
          testID="interactive-card"
          variant="interactive"
        >
          <Text>Item</Text>
        </Card>
        <Card testID="selected-card" variant="selected">
          <Text>Selecionado</Text>
        </Card>
        <Card testID="summary-card" title="Resumo" variant="summary">
          <Text>Conteúdo</Text>
        </Card>
      </>,
    );
    // interactive: chevron affordance appended automatically when onPress is set.
    expect(screen.getByTestId('card-trailing-chevron')).toBeTruthy();
    // selected: status is carried by a structural accent bar, not color alone.
    const selectedCard = screen.getByTestId('selected-card');
    const selectedStyle = Array.isArray(selectedCard.props.style)
      ? Object.assign({}, ...selectedCard.props.style.flat(Infinity))
      : selectedCard.props.style;
    expect(selectedStyle.paddingLeft).toBeGreaterThan(spacing[5]);
    // summary: title renders in a dedicated header, not mixed into children.
    expect(screen.getByText('Resumo')).toBeTruthy();
    expect(screen.getByTestId('summary-card')).toBeTruthy();
  });

  it('resolves surface/surfaceElevated distinction structurally, not by color value', async () => {
    // A Fase 1 tentou separar surface/surfaceElevated escurecendo o token de
    // cor e quebrou contraste AA; a correção real (adiada para a Fase 3) é
    // elevação estrutural: raio maior + sombra mais forte + o token correto.
    const screen = await render(
      <>
        <Card testID="default-card" variant="default">
          <Text>Padrão</Text>
        </Card>
        <Card testID="elevated-card" variant="elevated">
          <Text>Elevado</Text>
        </Card>
      </>,
    );
    const flattenStyle = (style: unknown) =>
      Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity)) : style;
    const defaultStyle = flattenStyle(
      screen.getByTestId('default-card').props.style,
    );
    const elevatedStyle = flattenStyle(
      screen.getByTestId('elevated-card').props.style,
    );
    // Um card elevado se separa por cor de superfície e sombra, nunca por
    // raio: raios diferentes entre variantes fazem cards vizinhos nunca
    // alinharem entre si.
    expect(elevatedStyle.borderRadius).toBe(defaultStyle.borderRadius);
    expect(elevatedStyle.backgroundColor).toBe(colors.surfaceElevated);
    expect(elevatedStyle.elevation).toBeGreaterThan(2);
    expect(elevatedStyle.boxShadow).toBeTruthy();
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

    // Each option is wrapped in a measured container that carries the flex,
    // so the sliding indicator can follow it. Walk up until the flexed box is
    // found rather than pinning a fixed tree depth.
    for (const label of ['Sistema', 'Claro', 'Escuro']) {
      let node = screen.getByRole('radio', { name: label }).parent;
      let distributed = false;
      for (let depth = 0; node && depth < 4; depth += 1) {
        const style = StyleSheet.flatten(node.props.style) as
          { flex?: number; minWidth?: number } | undefined;
        if (style?.flex === 1 && style?.minWidth === 0) {
          distributed = true;
          break;
        }
        node = node.parent;
      }
      expect(distributed).toBe(true);
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
