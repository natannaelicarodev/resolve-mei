import { z } from 'zod';

import { digitsOnly, isValidCnpj, isValidCpf } from '@/utils/documents';

export const brazilianStates = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export const businessSchema = z
  .object({
    businessName: z.string().trim().min(2, 'Informe o nome do negócio.'),
    documentType: z.enum(['cpf', 'cnpj']),
    documentNumber: z.string().trim().min(1, 'Informe o documento.'),
    professionalPhone: z.string().refine((value) => {
      const length = digitsOnly(value).length;
      return length === 10 || length === 11;
    }, 'Informe um telefone válido.'),
    email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
    street: z.string().trim().min(2, 'Informe a rua.'),
    number: z.string().trim().min(1, 'Informe o número.'),
    complement: z.string().trim().max(120).optional(),
    neighborhood: z.string().trim().min(2, 'Informe o bairro.'),
    city: z.string().trim().min(2, 'Informe a cidade.'),
    state: z.enum(brazilianStates, 'Selecione um estado válido.'),
    postalCode: z
      .string()
      .refine(
        (value) => digitsOnly(value).length === 8,
        'Informe um CEP com 8 dígitos.',
      ),
    pixKey: z.string().trim().max(160).optional(),
  })
  .superRefine((data, context) => {
    const valid =
      data.documentType === 'cpf'
        ? isValidCpf(data.documentNumber)
        : isValidCnpj(data.documentNumber);
    if (!valid)
      context.addIssue({
        code: 'custom',
        path: ['documentNumber'],
        message: `${data.documentType.toUpperCase()} inválido.`,
      });
  });

export type BusinessFormData = z.infer<typeof businessSchema>;

export function normalizeBusinessInput(input: BusinessFormData) {
  return {
    business_name: input.businessName.trim(),
    document_type: input.documentType,
    document_number: digitsOnly(input.documentNumber),
    professional_phone: digitsOnly(input.professionalPhone),
    email: input.email.trim().toLowerCase(),
    street: input.street.trim(),
    number: input.number.trim(),
    complement: input.complement?.trim() || null,
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    state: input.state,
    postal_code: digitsOnly(input.postalCode),
    pix_key: input.pixKey?.trim() || null,
  } as const;
}
