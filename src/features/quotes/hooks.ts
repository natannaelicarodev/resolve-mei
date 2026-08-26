import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getQuote, getQuoteMetrics, listQuotes } from './api';
import type { QuoteCursor, QuoteStatusFilter } from './api';

export const quotesQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'quotes', businessId] as const;

export function useQuotes(
  userId: string,
  businessId: string,
  search: string,
  status: QuoteStatusFilter,
) {
  return useInfiniteQuery({
    queryKey: [...quotesQueryKey(userId, businessId), 'list', search, status],
    queryFn: ({ pageParam, signal }) =>
      listQuotes(businessId, search, status, pageParam, signal),
    initialPageParam: null as QuoteCursor | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(userId && businessId),
  });
}

export function useQuote(userId: string, businessId: string, quoteId: string) {
  return useQuery({
    queryKey: [...quotesQueryKey(userId, businessId), 'detail', quoteId],
    queryFn: ({ signal }) => getQuote(businessId, quoteId, signal),
    enabled: Boolean(userId && businessId && quoteId),
  });
}

export function useQuoteMetrics(userId: string, businessId: string) {
  return useQuery({
    queryKey: [...quotesQueryKey(userId, businessId), 'metrics'],
    queryFn: ({ signal }) => getQuoteMetrics(businessId, signal),
    enabled: Boolean(userId && businessId),
  });
}
