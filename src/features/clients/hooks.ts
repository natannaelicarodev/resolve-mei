import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  CLIENT_PAGE_SIZE,
  countActiveClients,
  getClient,
  listClients,
} from './api';
import type { ClientStatusFilter } from './api';

export const clientsQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'clients', businessId] as const;
export function useClients(
  userId: string,
  businessId: string,
  search: string,
  status: ClientStatusFilter,
  page = 0,
) {
  return useInfiniteQuery({
    queryKey: [
      ...clientsQueryKey(userId, businessId),
      'list',
      search,
      status,
      page,
    ],
    queryFn: ({ pageParam, signal }) =>
      listClients(businessId, search, status, pageParam, signal),
    initialPageParam: page,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === CLIENT_PAGE_SIZE ? page + pages.length : undefined,
    enabled: Boolean(userId && businessId),
  });
}
export function useClient(
  userId: string,
  businessId: string,
  clientId: string,
) {
  return useQuery({
    queryKey: [...clientsQueryKey(userId, businessId), 'detail', clientId],
    queryFn: ({ signal }) => getClient(businessId, clientId, signal),
    enabled: Boolean(userId && businessId && clientId),
  });
}
export function useActiveClientCount(userId: string, businessId: string) {
  return useQuery({
    queryKey: [...clientsQueryKey(userId, businessId), 'active-count'],
    queryFn: ({ signal }) => countActiveClients(businessId, signal),
    enabled: Boolean(userId && businessId),
  });
}
