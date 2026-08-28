import { render } from '@testing-library/react-native';

import { Icon, iconNames } from '@/components/ui';
import { ThemeProvider, lightColors, sizes } from '@/theme';

function renderIcon(element: React.ReactElement) {
  return render(<ThemeProvider>{element}</ThemeProvider>);
}

// The rendered tree is an RNSVGSvgView whose props carry the resolved size,
// colour and stroke, so those are assertable without reaching into internals.
function svgProps(tree: unknown) {
  return (tree as { props: Record<string, unknown> }).props;
}

describe('Icon', () => {
  it('renders every catalogued name', async () => {
    for (const name of iconNames) {
      const screen = await renderIcon(<Icon name={name} />);
      expect(screen.toJSON()).toBeTruthy();
      await screen.unmount();
    }
  });

  it('applies a single stroke weight across the catalog', async () => {
    const weights = new Set<unknown>();
    for (const name of iconNames) {
      const screen = await renderIcon(<Icon name={name} />);
      weights.add(svgProps(screen.toJSON()).strokeWidth);
      await screen.unmount();
    }
    expect(weights.size).toBe(1);
    expect([...weights][0]).toBe(1.75);
  });

  it('maps each size step to the shared size token', async () => {
    const cases = [
      ['small', sizes.iconSmall],
      ['medium', sizes.iconMedium],
      ['large', sizes.iconLarge],
    ] as const;
    for (const [size, expected] of cases) {
      const screen = await renderIcon(<Icon name="client" size={size} />);
      const props = svgProps(screen.toJSON());
      expect(props.width).toBe(expected);
      expect(props.height).toBe(expected);
      await screen.unmount();
    }
  });

  it('resolves the colour from a theme token rather than a raw value', async () => {
    const screen = await renderIcon(<Icon color="primary" name="quote" />);

    expect(svgProps(screen.toJSON()).stroke).toBe(lightColors.primary);
    await screen.unmount();
  });

  it('defaults to the primary text colour', async () => {
    const screen = await renderIcon(<Icon name="quote" />);

    expect(svgProps(screen.toJSON()).stroke).toBe(lightColors.textPrimary);
    await screen.unmount();
  });

  it('allows a raw colour where a token is unavailable', async () => {
    const screen = await renderIcon(<Icon name="quote" rawColor="#123456" />);

    expect(svgProps(screen.toJSON()).stroke).toBe('#123456');
    await screen.unmount();
  });
});
