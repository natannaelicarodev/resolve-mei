import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyBusiness } from '@/features/business/hooks';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { HomeDashboard } from '@/features/home/HomeDashboard';
import { getMyProfile, profileQueryKey } from '@/features/profile/api';
import { useHomeDashboard } from '@/features/home/hooks';
import type { DashboardPeriod } from '@/features/home/api';
import { useFinancialPrivacy } from '@/features/home/useFinancialPrivacy';
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
  const financialPrivacy = useFinancialPrivacy(userId);
  const profileConfigured = data?.onboarding_completed === true;
  const missingPhone = !profile.data?.phone?.trim();
  const missingEmail = !data?.email?.trim();
  const hasContact = Boolean(profile.data && !missingPhone && !missingEmail);
  const contactPendingField = missingPhone
    ? 'phone'
    : missingEmail
      ? 'email'
      : undefined;
  const fullName = profile.data?.full_name?.trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : undefined;

  return (
    <HomeDashboard
      dashboard={dashboard.data}
      dashboardError={dashboard.isError}
      dashboardLoading={dashboard.isLoading}
      onPeriodChange={setPeriod}
      onRetry={() => void dashboard.refetch()}
      period={period}
      contactPendingField={contactPendingField}
      firstName={firstName}
      hasContact={hasContact}
      avatarUrl={avatarUrl}
      profileConfigured={profileConfigured}
      financialValuesHidden={financialPrivacy.hidden}
      financialPrivacyHydrated={financialPrivacy.hydrated}
      onFinancialPrivacyToggle={() => void financialPrivacy.toggle()}
    />
  );
}
