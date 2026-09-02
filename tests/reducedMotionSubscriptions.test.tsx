import { AccessibilityInfo } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { ReducedMotionProvider, useReducedMotion } from '@/components/motion';

function Consumer() {
  useReducedMotion();
  return null;
}

it('measures native reduced-motion work across thirteen consumers', async () => {
  const query = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const listen = jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as never);

  const screen = await render(
    <ReducedMotionProvider>
      {Array.from({ length: 13 }, (_, index) => (
        <Consumer key={index} />
      ))}
    </ReducedMotionProvider>,
  );

  await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
  expect(listen).toHaveBeenCalledTimes(1);
  await screen.unmount();
});
