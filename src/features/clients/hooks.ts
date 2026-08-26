import { useQuery } from '@tanstack/react-query';
import { countActiveClients, getClient, listClients } from './api';
import type { ClientStatusFilter } from './api';

export const clientsQueryKey = (businessId: string) =>
  ['clients', businessId] as const;
export function useClients(
  businessId: string,
  search: string,
  status: ClientStatusFilter,
  page = 0,
) {
  return useQuery({
    queryKey: [...clientsQueryKey(businessId), 'list', search, status, page],
    queryFn: () => listClients(businessId, search, status, page),
    enabled: Boolean(businessId),
  });
}
export function useClient(businessId: string, clientId: string) {
  return useQuery({
    queryKey: [...clientsQueryKey(businessId), 'detail', clientId],
    queryFn: () => getClient(businessId, clientId),
    enabled: Boolean(businessId && clientId),
  });
}
export function useActiveClientCount(businessId: string) {
  return useQuery({
    queryKey: [...clientsQueryKey(businessId), 'active-count'],
    queryFn: () => countActiveClients(businessId),
    enabled: Boolean(businessId),
  });
}
