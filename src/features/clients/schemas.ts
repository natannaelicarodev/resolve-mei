import { z } from 'zod';

import { digitsOnly, isValidCnpj, isValidCpf } from '@/utils/documents';

export const clientSchema = z
  .object({
    type: z.enum(['person', 'company']),
    name: z
      .string()
      .trim()
      .min(2, 'Informe um nome com pelo menos 2 caracteres.')
      .max(160),
    document: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.union([
      z.literal(''),
      z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
    ]),
    notes: z
      .string()
      .trim()
      .max(2000, 'Use no máximo 2.000 caracteres.')
      .optional(),
    status: z.enum(['active', 'inactive']),
  })
  .superRefine((value, context) => {
    if (value.document) {
      const valid =
        value.type === 'person'
          ? isValidCpf(value.document)
          : isValidCnpj(value.document);
      if (!valid)
        context.addIssue({
          code: 'custom',
          path: ['document'],
          message: `${value.type === 'person' ? 'CPF' : 'CNPJ'} inválido.`,
        });
    }
    if (value.phone) {
      const length = digitsOnly(value.phone).length;
      if (length !== 10 && length !== 11)
        context.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'Informe um telefone válido.',
        });
    }
  });

export type ClientFormData = z.infer<typeof clientSchema>;

export function normalizeClientInput(input: ClientFormData) {
  return {
    type: input.type,
    name: input.name.trim(),
    document: input.document ? digitsOnly(input.document) || null : null,
    phone: input.phone ? digitsOnly(input.phone) || null : null,
    email: input.email.trim().toLowerCase() || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  } as const;
}

export const emptyClientForm: ClientFormData = {
  type: 'person',
  name: '',
  document: '',
  phone: '',
  email: '',
  notes: '',
  status: 'active',
};
