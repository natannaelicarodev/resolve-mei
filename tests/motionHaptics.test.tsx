import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  AnimatedPressable,
  FadeInView,
  StepTransition,
  SuccessTransition,
} from '@/components/motion';
import { Text } from '@/components/ui';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
} from '@/lib/haptics';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('motion and haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('animates a press without changing its accessible action', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <AnimatedPressable
        accessibilityLabel="Abrir"
        accessibilityRole="button"
        onPress={onPress}
      >
        <Text>Abrir</Text>
      </AnimatedPressable>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps step content available with reduced motion enabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const screen = await render(
      <StepTransition direction="forward" step={2}>
        <Text>Etapa acessível</Text>
      </StepTransition>,
    );
    await waitFor(() =>
      expect(screen.getByText('Etapa acessível')).toBeTruthy(),
    );
  });

  it('keeps fading content available with reduced motion enabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const screen = await render(
      <FadeInView>
        <Text>Conteúdo sem deslocamento</Text>
      </FadeInView>,
    );
    await waitFor(() =>
      expect(screen.getByText('Conteúdo sem deslocamento')).toBeTruthy(),
    );
  });

  it('announces success and triggers semantic haptic feedback', async () => {
    const screen = await render(
      <SuccessTransition message="Salvo com sucesso." />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Salvo com sucesso.')).toBeTruthy();
    await waitFor(() =>
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success'),
    );
  });

  it('supports enabled and disabled haptics', async () => {
    await triggerHaptic('selection');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);
    await triggerHaptic('error');
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
