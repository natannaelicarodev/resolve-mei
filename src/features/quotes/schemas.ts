import { z } from 'zod';
import {
  addDaysToDatabaseDate,
  formatDateForDisplay,
  getTodayDatabaseDate,
  parseDateForDatabase,
} from './date';

export const quoteItemSchema = z.object({
  serviceId: z.string().nullable(),
  name: z.string().trim().min(2, 'Informe o nome do item.').max(160),
  description: z.string().trim().max(2000),
  quantity: z.number().int().min(1, 'A quantidade deve ser maior que zero.'),
  unitPriceCents: z.number().int().min(0).max(9_000_000_000_000),
});

export const quoteSchema = z
  .object({
    clientId: z.string().uuid('Selecione um cliente.'),
    validUntil: z.string(),
    discountCents: z.number().int().min(0),
    notes: z.string().trim().max(4000),
    items: z.array(quoteItemSchema).min(1, 'Adicione ao menos um item.'),
  })
  .superRefine((data, context) => {
    if (data.validUntil.replace(/\D/g, '').length < 8) {
      context.addIssue({
        code: 'custom',
        path: ['validUntil'],
        message: 'Informe a data completa.',
      });
    } else {
      const validUntil = parseDateForDatabase(data.validUntil);
      if (!validUntil)
        context.addIssue({
          code: 'custom',
          path: ['validUntil'],
          message: 'Informe uma data válida.',
        });
      else if (validUntil < getTodayDatabaseDate())
        context.addIssue({
          code: 'custom',
          path: ['validUntil'],
          message: 'A validade não pode ser anterior à data de emissão.',
        });
    }
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
    if (data.discountCents > subtotal)
      context.addIssue({
        code: 'custom',
        path: ['discountCents'],
        message: 'O desconto não pode superar o subtotal.',
      });
  });

export type QuoteFormData = z.infer<typeof quoteSchema>;

export function defaultQuoteValues(): QuoteFormData {
  return {
    clientId: '',
    validUntil: formatDateForDisplay(
      addDaysToDatabaseDate(getTodayDatabaseDate(), 7),
    ),
    discountCents: 0,
    notes: '',
    items: [],
  };
}
