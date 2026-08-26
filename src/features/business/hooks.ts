import { useQuery } from '@tanstack/react-query';

import { getMyBusiness } from './api';

export const businessQueryKey = (userId: string) =>
  ['private', userId, 'business'] as const;

export function useMyBusiness(userId?: string | null) {
  return useQuery({
    queryKey: businessQueryKey(userId ?? ''),
    queryFn: ({ signal }) => getMyBusiness(userId ?? '', signal),
    enabled: Boolean(userId),
  });
}
