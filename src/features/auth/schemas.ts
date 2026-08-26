import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido.');
const password = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres.')
  .regex(/[a-z]/, 'Inclua uma letra minúscula.')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
  .regex(/[0-9]/, 'Inclua um número.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
});
export type SignInData = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
    email,
    password,
    confirmPassword: z.string(),
    acceptedTerms: z
      .boolean()
      .refine(Boolean, 'Aceite os termos para continuar.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmPassword'],
  });
export type SignUpData = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmPassword'],
  });
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
