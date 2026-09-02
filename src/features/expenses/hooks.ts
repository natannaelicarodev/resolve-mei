import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteExpense,
  deleteExpenseReceipt,
  getExpense,
  getExpenseMonth,
  getQuoteExpenseMargin,
  listExpenseQuoteOptions,
  listExpenseReceipts,
  saveExpense,
  uploadExpenseReceipt,
} from './api';
import type { ExpenseInput } from './domain';
export const expensesKey = (u: string, b: string) =>
  ['private', u, 'expenses', b] as const;
export function useExpenseMonth(u: string, b: string, m: string) {
  return useQuery({
    queryKey: [...expensesKey(u, b), 'month', m],
    queryFn: () => getExpenseMonth(b, m),
    enabled: Boolean(u && b && m),
  });
}
export function useExpenseQuoteOptions(u: string, b: string) {
  return useQuery({
    queryKey: [...expensesKey(u, b), 'quote-options'],
    queryFn: () => listExpenseQuoteOptions(b),
    enabled: Boolean(u && b),
  });
}
export function useExpense(u: string, b: string, id: string) {
  return useQuery({
    queryKey: [...expensesKey(u, b), 'detail', id],
    queryFn: () => getExpense(b, id),
    enabled: Boolean(u && b && id),
  });
}
export function useExpenseMutations(u: string, b: string) {
  const q = useQueryClient();
  const invalidate = () => q.invalidateQueries({ queryKey: expensesKey(u, b) });
  return {
    save: useMutation({
      mutationFn: (x: ExpenseInput) => saveExpense(b, x),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteExpense(b, id),
      onSuccess: invalidate,
    }),
  };
}
export const expenseReceiptsKey = (u: string, b: string, e: string) =>
  [...expensesKey(u, b), 'receipts', e] as const;
export function useExpenseReceipts(u: string, b: string, e: string) {
  return useQuery({
    queryKey: expenseReceiptsKey(u, b, e),
    queryFn: () => listExpenseReceipts(b, e),
    enabled: Boolean(u && b && e),
  });
}
export function useExpenseReceiptMutations(u: string, b: string, e: string) {
  const q = useQueryClient();
  const invalidate = () =>
    Promise.all([
      q.invalidateQueries({ queryKey: expenseReceiptsKey(u, b, e) }),
      q.invalidateQueries({ queryKey: expensesKey(u, b) }),
    ]);
  return {
    upload: useMutation({
      mutationFn: (asset: import('expo-image-picker').ImagePickerAsset) =>
        uploadExpenseReceipt({ businessId: b, expenseId: e, asset }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteExpenseReceipt(b, id),
      onSuccess: invalidate,
    }),
  };
}
export function useQuoteExpenseMargin(u: string, b: string, qid: string) {
  return useQuery({
    queryKey: [...expensesKey(u, b), 'quote-margin', qid],
    queryFn: () => getQuoteExpenseMargin(b, qid),
    enabled: Boolean(u && b && qid),
  });
}
