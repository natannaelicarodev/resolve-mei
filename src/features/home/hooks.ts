import { useQuery } from '@tanstack/react-query';
import { getHomeDashboard } from './api';
import type { DashboardPeriod } from './api';

export const homeDashboardQueryKey = (
  userId: string,
  businessId: string,
  period: DashboardPeriod,
) => ['private', userId, 'home', businessId, 'dashboard', period] as const;

export function useHomeDashboard(
  userId: string,
  businessId: string,
  period: DashboardPeriod,
) {
  return useQuery({
    queryKey: homeDashboardQueryKey(userId, businessId, period),
    queryFn: async () => {
      const result = await getHomeDashboard(businessId, period);
      if (result.businessId !== businessId || result.period !== period)
        throw new Error('DASHBOARD_IDENTITY_MISMATCH');
      return result;
    },
    enabled: Boolean(userId && businessId),
  });
}
