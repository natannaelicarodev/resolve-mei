import { useQuery } from '@tanstack/react-query';
import { getServiceOrderDetails, getServiceOrderForQuote } from './api';

export const serviceOrdersQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'service-orders', businessId] as const;

export function useServiceOrderForQuote(
  userId: string,
  businessId: string,
  quoteId: string,
) {
  return useQuery({
    queryKey: [...serviceOrdersQueryKey(userId, businessId), 'quote', quoteId],
    queryFn: ({ signal }) =>
      getServiceOrderForQuote(businessId, quoteId, signal),
    enabled: Boolean(userId && businessId && quoteId),
  });
}

export function useServiceOrder(
  userId: string,
  businessId: string,
  orderId: string,
) {
  return useQuery({
    queryKey: [...serviceOrdersQueryKey(userId, businessId), 'detail', orderId],
    queryFn: ({ signal }) =>
      getServiceOrderDetails(businessId, orderId, signal),
    enabled: Boolean(userId && businessId && orderId),
  });
}
