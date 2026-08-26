import { isDesignSystemAvailable } from '@/features/design-system/access';

describe('design system catalog access', () => {
  it('is available only in development', () => {
    expect(isDesignSystemAvailable(true)).toBe(true);
    expect(isDesignSystemAvailable(false)).toBe(false);
  });
});
