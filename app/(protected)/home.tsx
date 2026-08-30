import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyBusiness } from '@/features/business/hooks';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import { getMyProfile, profileQueryKey } from '@/features/profile/api';
import { useHomeDashboard } from '@/features/home/hooks';
import type { DashboardPeriod } from '@/features/home/api';
import { useQuotes } from '@/features/quotes/hooks';
import { useServices } from '@/features/services/hooks';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeRoute() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data } = useMyBusiness(userId);
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const profile = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: ({ signal }) => getMyProfile(userId, signal),
    enabled: Boolean(userId),
  });
  const avatar = useQuery({
    queryKey: [
      'private',
      userId,
      'profile-avatar',
      'signed',
      profile.data?.avatar_path,
    ],
    queryFn: () => createAvatarSignedUrl(profile.data?.avatar_path ?? ''),
    enabled: Boolean(userId && profile.data?.avatar_path),
    staleTime: 4 * 60 * 1000,
  });
  const avatarUrl = avatar.data;
  const dashboard = useHomeDashboard(userId, data?.id ?? '', period);
  const recentQuotes = useQuotes(userId, data?.id ?? '', '', 'all');
  const services = useServices(userId, data?.id ?? '', '', 'all');
  const fullName = profile.data?.full_name?.trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : undefined;

  return (
    <HomeMockupScreen
      dashboard={dashboard.data}
      dashboardError={dashboard.isError}
      dashboardLoading={dashboard.isLoading}
      businessName={data?.business_name}
      onPeriodChange={setPeriod}
      onRetry={() => {
        void dashboard.refetch();
        void recentQuotes.refetch();
      }}
      period={period}
      firstName={firstName}
      avatarUrl={avatarUrl}
      recentQuotes={recentQuotes.data?.pages[0]?.items.slice(0, 12)}
      recentQuotesLoading={recentQuotes.isLoading}
      recentQuotesError={recentQuotes.isError}
      serviceCount={services.data?.pages[0]?.totalCount}
    />
  );
}
