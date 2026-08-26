import { z } from 'zod';

import { digitsOnly } from '@/utils/documents';

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
  phone: z.string().refine((value) => {
    const length = digitsOnly(value).length;
    return value.length === 0 || length === 10 || length === 11;
  }, 'Informe um telefone válido.'),
});
export type ProfileFormData = z.infer<typeof profileSchema>;
