import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { countActiveServices, getService, listServices } from './api';
import type { ServiceCursor, ServiceStatusFilter } from './api';

export const servicesQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'services', businessId] as const;

export function useServices(
  userId: string,
  businessId: string,
  search: string,
  status: ServiceStatusFilter,
) {
  return useInfiniteQuery({
    queryKey: [...servicesQueryKey(userId, businessId), 'list', search, status],
    queryFn: ({ pageParam, signal }) =>
      listServices(businessId, search, status, pageParam, signal),
    initialPageParam: null as ServiceCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(userId && businessId),
  });
}

export function useService(
  userId: string,
  businessId: string,
  serviceId: string,
) {
  return useQuery({
    queryKey: [...servicesQueryKey(userId, businessId), 'detail', serviceId],
    queryFn: ({ signal }) => getService(businessId, serviceId, signal),
    enabled: Boolean(userId && businessId && serviceId),
  });
}

export function useActiveServiceCount(userId: string, businessId: string) {
  return useQuery({
    queryKey: [...servicesQueryKey(userId, businessId), 'active-count'],
    queryFn: ({ signal }) => countActiveServices(businessId, signal),
    enabled: Boolean(userId && businessId),
  });
}
