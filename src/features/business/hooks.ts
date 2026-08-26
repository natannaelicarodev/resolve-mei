import { useQuery } from '@tanstack/react-query';

import { getMyBusiness } from './api';

export const businessQueryKey = ['business', 'mine'] as const;

export function useMyBusiness(enabled = true) {
  return useQuery({
    queryKey: businessQueryKey,
    queryFn: getMyBusiness,
    enabled,
  });
}
