import { useQuery } from '@tanstack/react-query';
import { getQuoteReceivable, getTotalReceivable } from './api';

export const receivablesQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'receivables', businessId] as const;

export function useQuoteReceivable(
  userId: string,
  businessId: string,
  quoteId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...receivablesQueryKey(userId, businessId), 'quote', quoteId],
    queryFn: () => getQuoteReceivable(businessId, quoteId),
    enabled: enabled && Boolean(userId && businessId && quoteId),
  });
}

export function useTotalReceivable(userId: string, businessId: string) {
  return useQuery({
    queryKey: [...receivablesQueryKey(userId, businessId), 'total'],
    queryFn: () => getTotalReceivable(businessId),
    enabled: Boolean(userId && businessId),
  });
}
