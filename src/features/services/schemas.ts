import { z } from 'zod';

import { formatPriceCents, parsePriceInput } from './format';

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(160, 'Use no máximo 160 caracteres.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Use no máximo 2.000 caracteres.')
    .optional(),
  price: z.string().refine((value) => parsePriceInput(value) !== null, {
    message: 'Informe um preço válido, igual ou maior que zero.',
  }),
  estimatedDurationMinutes: z.union([
    z.literal(''),
    z
      .string()
      .regex(/^\d+$/, 'Informe a duração em minutos.')
      .refine(
        (value) => Number(value) > 0,
        'A duração deve ser maior que zero.',
      ),
  ]),
  status: z.enum(['active', 'inactive']),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export const emptyServiceForm: ServiceFormData = {
  name: '',
  description: '',
  price: formatPriceCents(0),
  estimatedDurationMinutes: '',
  status: 'active',
};

export function normalizeServiceInput(input: ServiceFormData) {
  const priceCents = parsePriceInput(input.price);
  if (priceCents === null) throw new Error('INVALID_SERVICE_PRICE');
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price_cents: priceCents,
    estimated_duration_minutes: input.estimatedDurationMinutes
      ? Number(input.estimatedDurationMinutes)
      : null,
    status: input.status,
  } as const;
}
