import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import type {
  FinancialEntryType,
  PaymentMethod,
  QuoteReceivable,
} from './domain';
import { financialEntryTypes, paymentMethods } from './domain';

const centsSchema = z.string().regex(/^\d+$/);
const entrySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(financialEntryTypes),
  amountCents: centsSchema,
  occurredOn: z.string(),
  paymentMethod: z.enum(paymentMethods),
  note: z.string().nullable(),
  serviceOrderId: z.string().uuid().nullable(),
  originalEntryId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
const receivableSchema = z.object({
  quoteId: z.string().uuid(),
  totalCents: centsSchema,
  receivedCents: centsSchema,
  refundedCents: centsSchema,
  balanceCents: centsSchema,
  settled: z.boolean(),
  dueOn: z.string().nullable(),
  entries: z.array(entrySchema),
});

export async function getQuoteReceivable(
  businessId: string,
  quoteId: string,
): Promise<QuoteReceivable> {
  const { data, error } = await supabase.rpc('get_quote_receivable', {
    p_business_id: businessId,
    p_quote_id: quoteId,
  });
  if (error) throw error;
  const parsed = receivableSchema.parse(data);
  if (parsed.quoteId !== quoteId)
    throw new Error('RECEIVABLE_IDENTITY_MISMATCH');
  return parsed;
}

export async function recordFinancialEntry(input: {
  businessId: string;
  quoteId: string;
  type: FinancialEntryType;
  amountCents: string;
  occurredOn: string;
  paymentMethod: PaymentMethod;
  note?: string;
  originalEntryId?: string | null;
  serviceOrderId?: string | null;
}) {
  const { data, error } = await supabase.rpc('record_quote_financial_entry', {
    p_business_id: input.businessId,
    p_quote_id: input.quoteId,
    p_entry_type: input.type,
    p_amount_cents: input.amountCents,
    p_occurred_on: input.occurredOn,
    p_payment_method: input.paymentMethod,
    p_note: input.note?.trim() || null,
    p_original_entry_id: input.originalEntryId ?? null,
    p_service_order_id: input.serviceOrderId ?? null,
  });
  if (error) throw error;
  return entrySchema.parse(data);
}

export async function setReceivableDueOn(
  businessId: string,
  quoteId: string,
  dueOn: string | null,
) {
  const { error } = await supabase.rpc('set_quote_receivable_due_on', {
    p_business_id: businessId,
    p_quote_id: quoteId,
    p_due_on: dueOn,
  });
  if (error) throw error;
}

export async function getTotalReceivable(businessId: string) {
  const { data, error } = await supabase.rpc('get_total_receivable', {
    p_business_id: businessId,
  });
  if (error) throw error;
  return centsSchema.parse(data);
}
