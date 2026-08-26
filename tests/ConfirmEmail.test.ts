import { maskEmail } from '@app/(auth)/confirm-email';

it('masks a valid email without exposing the complete local part', () => {
  expect(maskEmail('natannael@example.com')).toBe('na••••••@example.com');
  expect(maskEmail(undefined)).toBeNull();
  expect(maskEmail('invalid')).toBeNull();
});
