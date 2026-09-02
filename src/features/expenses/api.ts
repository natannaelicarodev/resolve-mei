import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { z } from 'zod';
import {
  compressImageForUpload,
  COMPRESSED_IMAGE_LIMIT,
} from '@/features/uploads/compressedImage';
import { supabase } from '@/lib/supabase';
import {
  expenseCategories,
  type ExpenseInput,
  type ExpenseMonth,
} from './domain';

const cents = z.string().regex(/^-?\d+$/);
const expense = z.object({
  id: z.string().uuid(),
  quoteId: z.string().uuid().nullable(),
  amountCents: cents,
  occurredOn: z.string(),
  category: z.enum(expenseCategories),
  description: z.string().nullable(),
  recurring: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  quoteNumber: z.number().int().nullable(),
  clientName: z.string().nullable(),
  receiptCount: z.coerce.number().int().nonnegative(),
});
const monthSchema = z.object({
  month: z.string(),
  receivedCents: cents,
  expenseCents: cents,
  resultCents: cents,
  byCategory: z.array(
    z.object({ category: z.enum(expenseCategories), amountCents: cents }),
  ),
  financialEntries: z.array(z.object({
    id:z.string().uuid(), occurredOn:z.string(), quoteNumber:z.number().int(),
    clientName:z.string(), paymentMethod:z.enum(['cash','pix','debit_card','credit_card','bank_transfer','other']),
    type:z.enum(['receipt','refund']), amountCents:cents,
  })),
  expenses: z.array(expense),
});

export async function getExpenseMonth(
  businessId: string,
  month: string,
): Promise<ExpenseMonth> {
  const { data, error } = await supabase.rpc('get_expense_month', {
    p_business_id: businessId,
    p_month: month,
  });
  if (error) throw error;
  return monthSchema.parse(data);
}
export async function saveExpense(businessId: string, input: ExpenseInput) {
  const { data, error } = await supabase.rpc('save_business_expense', {
    p_business_id: businessId,
    p_amount_cents: input.amountCents,
    p_occurred_on: input.occurredOn,
    p_category: input.category,
    p_description: input.description.trim() || null,
    p_quote_id: input.quoteId,
    p_recurring: input.recurring,
    p_expense_id: input.id ?? null,
  });
  if (error) throw error;
  return data;
}
export async function deleteExpense(businessId: string, id: string) {
  const { data, error } = await supabase.rpc('delete_business_expense', {
    p_business_id: businessId,
    p_expense_id: id,
  });
  if (error) throw error;
  const paths = (data as { storagePaths: string[] }).storagePaths;
  if (paths.length) {
    const removed = await supabase.storage
      .from('expense-receipts')
      .remove(paths);
    if (removed.error) throw removed.error;
  }
}
export async function listExpenseReceipts(
  businessId: string,
  expenseId: string,
) {
  const { data, error } = await supabase
    .from('expense_receipts')
    .select('*')
    .eq('business_id', businessId)
    .eq('expense_id', expenseId)
    .eq('status', 'active')
    .order('created_at');
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (item) => {
      const signed = await supabase.storage
        .from('expense-receipts')
        .createSignedUrl(item.storage_path, 300);
      if (signed.error) throw signed.error;
      return { ...item, signedUrl: signed.data.signedUrl };
    }),
  );
}
export async function uploadExpenseReceipt(input: {
  businessId: string;
  expenseId: string;
  asset: ImagePickerAsset;
}) {
  const uri = await compressImageForUpload(input.asset);
  const reserved = await supabase.rpc('reserve_expense_receipt', {
    p_business_id: input.businessId,
    p_expense_id: input.expenseId,
  });
  if (reserved.error) throw reserved.error;
  const value = reserved.data as { id: string; storagePath: string };
  try {
    const body = await new File(uri).arrayBuffer();
    if (body.byteLength > COMPRESSED_IMAGE_LIMIT)
      throw new Error('COMPRESSED_TOO_LARGE');
    const uploaded = await supabase.storage
      .from('expense-receipts')
      .upload(value.storagePath, body, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (uploaded.error) throw uploaded.error;
    const finalized = await supabase.rpc('finalize_expense_receipt', {
      p_business_id: input.businessId,
      p_receipt_id: value.id,
    });
    if (finalized.error) throw finalized.error;
    return finalized.data;
  } catch (error) {
    await supabase.storage.from('expense-receipts').remove([value.storagePath]);
    await supabase.rpc('cancel_expense_receipt_reservation', {
      p_business_id: input.businessId,
      p_receipt_id: value.id,
    });
    throw error;
  }
}
export async function deleteExpenseReceipt(businessId: string, id: string) {
  const result = await supabase.rpc('delete_expense_receipt', {
    p_business_id: businessId,
    p_receipt_id: id,
  });
  if (result.error) throw result.error;
  const path = (result.data as { storagePath: string }).storagePath;
  const removed = await supabase.storage
    .from('expense-receipts')
    .remove([path]);
  if (removed.error) throw removed.error;
}
export async function listExpenseQuoteOptions(businessId: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('id,quote_number,client_name_snapshot')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
export async function getExpense(businessId: string, id: string) {
  const { data, error } = await supabase.rpc('get_business_expense', {
    p_business_id: businessId,
    p_expense_id: id,
  });
  if (error) throw error;
  return z.object({
    id:z.string().uuid(), quoteId:z.string().uuid().nullable(), amountCents:cents,
    occurredOn:z.string(), category:z.enum(expenseCategories),
    description:z.string().nullable(), recurring:z.boolean(),
  }).parse(data);
}

const marginSchema = z.object({
  quoteId: z.string().uuid(),
  hasExpenses: z.boolean(),
  receivedCents: cents,
  expenseCents: cents,
  marginCents: cents,
  expenses: z.array(
    z.object({
      id: z.string().uuid(),
      amountCents: cents,
      occurredOn: z.string(),
      category: z.enum(expenseCategories),
      description: z.string().nullable(),
    }),
  ),
});
export async function getQuoteExpenseMargin(
  businessId: string,
  quoteId: string,
) {
  const { data, error } = await supabase.rpc('get_quote_expense_margin', {
    p_business_id: businessId,
    p_quote_id: quoteId,
  });
  if (error) throw error;
  return marginSchema.parse(data);
}
