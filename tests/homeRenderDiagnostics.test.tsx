import { render } from '@testing-library/react-native';

import { DaylightHomeScreen } from '@/features/daylight/DaylightHomeScreen';
import { useDayTheme } from '@/features/daylight/theme';
import {
  getRenderDiagnostic,
  resetRenderDiagnostics,
} from '@/lib/renderDiagnostics';
import { ThemeProvider } from '@/theme';

describe('Home render diagnostics', () => {
  beforeEach(() => resetRenderDiagnostics());

  it('records the Home screen renders for a stable parent update', async () => {
    const screen = await render(
      <ThemeProvider>
        <DaylightHomeScreen businessName="ResolveMEI" />
      </ThemeProvider>,
    );
    await screen.rerender(
      <ThemeProvider>
        <DaylightHomeScreen businessName="ResolveMEI" />
      </ThemeProvider>,
    );

    expect(getRenderDiagnostic('DaylightHomeScreen')).toBe(1);
  });

  it('records whether the daylight palette identity survives a stable rerender', async () => {
    const palettes: ReturnType<typeof useDayTheme>[] = [];
    function PaletteProbe() {
      palettes.push(useDayTheme());
      return null;
    }

    const screen = await render(
      <ThemeProvider>
        <PaletteProbe />
      </ThemeProvider>,
    );
    await screen.rerender(
      <ThemeProvider>
        <PaletteProbe />
      </ThemeProvider>,
    );

    expect(palettes).toHaveLength(2);
    expect(palettes[0]).toBe(palettes[1]);
  });
});
