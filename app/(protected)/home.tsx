import { useQuery } from '@tanstack/react-query';

import { useMyBusiness } from '@/features/business/hooks';
import { useActiveClientCount } from '@/features/clients/hooks';
import { DaylightHomeScreen } from '@/features/daylight/DaylightHomeScreen';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { getMyProfile, profileQueryKey } from '@/features/profile/api';
import { useQuotes } from '@/features/quotes/hooks';
import { useServices } from '@/features/services/hooks';
import { useAuth } from '@/providers/AuthProvider';

/**
 * The Home is a hub, so it fetches only what its shortcuts and compact pending
 * list need: business/profile setup, service/client counts, and exact counts of
 * draft and sent quotes. Financial totals stay on their dedicated screens.
 */
export default function HomeRoute() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const business = useMyBusiness(userId);
  const businessId = business.data?.id ?? '';

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

  const services = useServices(userId, businessId, '', 'all');
  const clientCount = useActiveClientCount(userId, businessId);
  const draftQuotes = useQuotes(userId, businessId, '', 'draft');
  const sentQuotes = useQuotes(userId, businessId, '', 'sent');
  const recentQuotes = useQuotes(userId, businessId, '', 'all');

  const fullName = profile.data?.full_name?.trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : undefined;
  const highlightedQuote =
    draftQuotes.data?.pages[0]?.items[0] ?? sentQuotes.data?.pages[0]?.items[0];

  return (
    <DaylightHomeScreen
      avatarUrl={avatar.data}
      businessName={business.data?.business_name}
      clientCount={clientCount.data}
      draftQuoteCount={draftQuotes.data?.pages[0]?.totalCount}
      firstName={firstName}
      hasLogo={Boolean(business.data?.logo_path)}
      highlightQuote={
        highlightedQuote
          ? {
              clientName: highlightedQuote.client_name_snapshot,
              id: highlightedQuote.id,
              quoteNumber: highlightedQuote.quote_number,
              status: highlightedQuote.status,
              updatedAt: highlightedQuote.updated_at,
            }
          : undefined
      }
      loading={business.isLoading}
      serviceCount={services.data?.pages[0]?.totalCount}
      sentQuoteCount={sentQuotes.data?.pages[0]?.totalCount}
      pendingLoading={draftQuotes.isLoading || sentQuotes.isLoading}
      recentLoading={recentQuotes.isLoading}
      recentQuotes={(recentQuotes.data?.pages[0]?.items ?? [])
        .filter((quote) => quote.id !== highlightedQuote?.id)
        .slice(0, 2)
        .map((quote) => ({
          clientName: quote.client_name_snapshot,
          id: quote.id,
          quoteNumber: quote.quote_number,
          status: quote.status,
          updatedAt: quote.updated_at,
        }))}
    />
  );
}
