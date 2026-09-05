import { useEffect } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CLIENT_PAGE_SIZE,
  countActiveClients,
  getClient,
  listClients,
  setClientStatus,
} from './api';
import type { Client, ClientStatusFilter } from './api';

export const clientsQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'clients', businessId] as const;

const clientsListQueryKey = (
  userId: string,
  businessId: string,
  search: string,
  status: ClientStatusFilter,
  page: number,
) =>
  [
    ...clientsQueryKey(userId, businessId),
    'list',
    search,
    status,
    page,
  ] as const;

export function useClients(
  userId: string,
  businessId: string,
  search: string,
  status: ClientStatusFilter,
  page = 0,
) {
  return useInfiniteQuery({
    queryKey: clientsListQueryKey(userId, businessId, search, status, page),
    queryFn: ({ pageParam, signal }) =>
      listClients(businessId, search, status, pageParam, signal),
    initialPageParam: page,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === CLIENT_PAGE_SIZE ? page + pages.length : undefined,
    enabled: Boolean(userId && businessId),
  });
}

const CLIENT_STATUS_FILTERS: readonly ClientStatusFilter[] = [
  'all',
  'active',
  'inactive',
];

/**
 * Warms the cache for every status tab, not just the one currently open. The
 * list screen switches status server-side (it's part of the query key), so
 * without this every tab tap used to be a fresh network round trip — on
 * device that showed up as the tab switch itself feeling stuck (confirmed
 * via `adb shell dumpsys gfxinfo`: thousands of high-input-latency events for
 * a handful of taps). Runs once per empty-search mount, not on every filter
 * change — prefetching on every keystroke of a search would defeat its own
 * purpose. `staleTime` on the query client (30s) is what makes a tab tap
 * inside that window resolve from cache instead of refetching.
 */
export function usePrefetchClientStatuses(
  userId: string,
  businessId: string,
  search: string,
) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId || !businessId || search) return;
    for (const status of CLIENT_STATUS_FILTERS) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: clientsListQueryKey(userId, businessId, search, status, 0),
        queryFn: ({ pageParam, signal }) =>
          listClients(businessId, search, status, pageParam as number, signal),
        initialPageParam: 0,
      });
    }
  }, [userId, businessId, search, queryClient]);
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
export function useClientMutations(userId: string, businessId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: clientsQueryKey(userId, businessId),
    });
  const archive = useMutation({
    mutationFn: (client: Client) =>
      setClientStatus(businessId, client.id, 'inactive'),
    onSuccess: invalidate,
  });
  const activate = useMutation({
    mutationFn: (client: Client) =>
      setClientStatus(businessId, client.id, 'active'),
    onSuccess: invalidate,
  });
  return { archive, activate };
}
