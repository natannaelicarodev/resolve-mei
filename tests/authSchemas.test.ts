import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/features/auth/schemas';

describe('authentication schemas', () => {
  it('normalizes login email', () => {
    expect(
      signInSchema.parse({ email: ' USER@EXAMPLE.COM ', password: 'secret' })
        .email,
    ).toBe('user@example.com');
  });
  it('validates sign-up password, confirmation and terms', () => {
    expect(
      signUpSchema.safeParse({
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        password: 'Strong123',
        confirmPassword: 'Strong123',
        acceptedTerms: true,
      }).success,
    ).toBe(true);
    expect(
      signUpSchema.safeParse({
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        password: 'Strong123',
        confirmPassword: 'Different123',
        acceptedTerms: false,
      }).success,
    ).toBe(false);
  });
  it('validates password recovery and reset', () => {
    expect(
      forgotPasswordSchema.safeParse({ email: 'ana@example.com' }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: 'Strong123',
        confirmPassword: 'Strong123',
      }).success,
    ).toBe(true);
  });
});
