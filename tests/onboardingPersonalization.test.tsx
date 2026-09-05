import { fireEvent, render } from '@testing-library/react-native';

import { DaylightHomeScreen } from '@/features/daylight/DaylightHomeScreen';
import type { OnboardingPriority } from '@/features/business/schemas';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

function renderFocus(
  onboardingPriority: OnboardingPriority,
  serviceCount = 1,
  clientCount = 1,
  onConsumeOnboardingFocus?: () => void,
) {
  return render(
    <DaylightHomeScreen
      clientCount={clientCount}
      onboardingFocusVisible
      onboardingPriority={onboardingPriority}
      onConsumeOnboardingFocus={onConsumeOnboardingFocus}
      serviceCount={serviceCount}
    />,
  );
}

it.each([
  ['quotes', 'Crie seu primeiro orçamento', 'Criar orçamento'],
  ['collections', 'Comece a acompanhar recebimentos', 'Criar orçamento'],
  ['agenda', 'Organize sua agenda', 'Abrir agenda'],
  ['profit', 'Entenda seu resultado', 'Ver resultado'],
] as const)(
  'shows the %s contextual destination once',
  async (priority, title, action) => {
    const screen = await renderFocus(priority);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByRole('button', { name: action })).toBeTruthy();
    expect(
      screen.getByTestId(`onboarding-focus-artwork-${priority}`, {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Dispensar sugestão inicial' }),
    ).toBeTruthy();
    await screen.unmount();
  },
);

it('progresses quote setup through service, client, then quote', async () => {
  const consume = jest.fn();
  const noService = await renderFocus('quotes', 0, 0, consume);
  expect(
    noService.getByRole('button', { name: 'Cadastrar serviço' }),
  ).toBeTruthy();
  await fireEvent.press(
    noService.getByRole('button', { name: 'Cadastrar serviço' }),
  );
  expect(consume).not.toHaveBeenCalled();
  await noService.unmount();

  const noClient = await renderFocus('quotes', 1, 0, consume);
  expect(
    noClient.getByRole('button', { name: 'Cadastrar cliente' }),
  ).toBeTruthy();
  await fireEvent.press(
    noClient.getByRole('button', { name: 'Cadastrar cliente' }),
  );
  expect(consume).not.toHaveBeenCalled();
  await noClient.unmount();

  const ready = await renderFocus('quotes', 1, 1, consume);
  expect(ready.getByRole('button', { name: 'Criar orçamento' })).toBeTruthy();
  await fireEvent.press(ready.getByRole('button', { name: 'Criar orçamento' }));
  expect(consume).toHaveBeenCalledTimes(1);
  await ready.unmount();
});
