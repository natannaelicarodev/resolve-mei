import { useQuery } from '@tanstack/react-query';
import { useMyBusiness } from '@/features/business/hooks';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { HomeDashboard } from '@/features/home/HomeDashboard';
import { useActiveClientCount } from '@/features/clients/hooks';
import { getMyProfile, profileQueryKey } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeRoute() {
  const { user } = useAuth();
  const { data } = useMyBusiness();
  const profile = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getMyProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const avatar = useQuery({
    queryKey: ['profile-avatar', 'signed', profile.data?.avatar_path],
    queryFn: () => createAvatarSignedUrl(profile.data?.avatar_path ?? ''),
    enabled: Boolean(profile.data?.avatar_path),
    staleTime: 4 * 60 * 1000,
  });
  const avatarUrl = avatar.data;
  const clientCount = useActiveClientCount(data?.id ?? '');
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
      activeClientCount={clientCount.data}
      clientCountError={clientCount.isError}
      clientCountLoading={clientCount.isLoading}
      contactPendingField={contactPendingField}
      firstName={firstName}
      hasContact={hasContact}
      avatarUrl={avatarUrl}
      profileConfigured={profileConfigured}
    />
  );
}
