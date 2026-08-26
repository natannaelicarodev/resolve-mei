import { router } from 'expo-router';

import {
  PROFILE_SUCCESS_DELAY_MS,
  scheduleProfileRedirect,
} from '@/features/profile/navigation';

describe('profile success navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('replaces the route only after the success period', () => {
    scheduleProfileRedirect(() => router.replace('/home'));

    jest.advanceTimersByTime(PROFILE_SUCCESS_DELAY_MS - 1);
    expect(router.replace).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(router.replace).toHaveBeenCalledWith('/home');
  });

  it('clears the redirect timer when canceled on unmount', () => {
    const cancel = scheduleProfileRedirect(() => router.replace('/home'));

    cancel();
    jest.advanceTimersByTime(PROFILE_SUCCESS_DELAY_MS);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
