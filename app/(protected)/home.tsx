import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { consumeOnboardingFocus } from '@/features/business/api';
import type { Business } from '@/features/business/api';
import { businessQueryKey, useMyBusiness } from '@/features/business/hooks';
import { useActiveClientCount } from '@/features/clients/hooks';
import { DaylightHomeScreen } from '@/features/daylight/DaylightHomeScreen';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { useAgendaOverview } from '@/features/agenda/hooks';
import { getMyProfile, profileQueryKey } from '@/features/profile/api';
import { useQuotes } from '@/features/quotes/hooks';
import { useServices } from '@/features/services/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { useReconnectClients } from '@/features/relationships/hooks';
import { markRender } from '@/lib/renderDiagnostics';

/**
 * The Home is a hub, so it fetches only what its shortcuts and compact pending
 * list need: business/profile setup, service/client counts, and exact counts of
 * draft and sent quotes. Financial totals stay on their dedicated screens.
 */
export default function HomeRoute() {
  markRender('HomeRoute');
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
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
  const agenda = useAgendaOverview(userId, businessId);
  const reconnect = useReconnectClients(userId, businessId);
  const agendaActionCount = agenda.data
    ? agenda.data.appointments.filter(
        (item) => item.overdue || item.scheduledOn === agenda.data?.today,
      ).length + agenda.data.financialDueToday.length
    : undefined;
  const consumeFocus = useMutation({
    mutationFn: () => {
      if (!userId || !businessId) throw new Error('Missing business identity');
      return consumeOnboardingFocus(userId, businessId);
    },
    onMutate: async () => {
      const key = businessQueryKey(userId);
      const previous = queryClient.getQueryData<Business | null>(key);
      queryClient.setQueryData<Business | null>(key, (current) =>
        current
          ? {
              ...current,
              onboarding_focus_consumed_at: new Date().toISOString(),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined)
        queryClient.setQueryData(businessQueryKey(userId), context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: businessQueryKey(userId) }),
  });
  const handleConsumeFocus = useCallback(() => {
    if (!consumeFocus.isPending) consumeFocus.mutate();
  }, [consumeFocus]);

  const fullName = profile.data?.full_name?.trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : undefined;
  const highlightedQuoteSource =
    draftQuotes.data?.pages[0]?.items[0] ?? sentQuotes.data?.pages[0]?.items[0];
  const highlightQuote = useMemo(
    () =>
      highlightedQuoteSource
        ? {
            clientName: highlightedQuoteSource.client_name_snapshot,
            id: highlightedQuoteSource.id,
            quoteNumber: highlightedQuoteSource.quote_number,
            status: highlightedQuoteSource.status,
            updatedAt: highlightedQuoteSource.updated_at,
          }
        : undefined,
    [highlightedQuoteSource],
  );
  const recentQuoteItems = recentQuotes.data?.pages[0]?.items;
  const homeRecentQuotes = useMemo(
    () =>
      (recentQuoteItems ?? [])
        .filter((quote) => quote.id !== highlightedQuoteSource?.id)
        .slice(0, 2)
        .map((quote) => ({
          clientName: quote.client_name_snapshot,
          id: quote.id,
          quoteNumber: quote.quote_number,
          status: quote.status,
          updatedAt: quote.updated_at,
        })),
    [highlightedQuoteSource?.id, recentQuoteItems],
  );

  return (
    <DaylightHomeScreen
      avatarUrl={avatar.data}
      businessName={business.data?.business_name}
      clientCount={clientCount.data}
      draftQuoteCount={draftQuotes.data?.pages[0]?.totalCount}
      firstName={firstName}
      hasLogo={Boolean(business.data?.logo_path)}
      highlightQuote={highlightQuote}
      loading={business.isLoading}
      onboardingPriority={business.data?.onboarding_priority}
      onboardingFocusVisible={Boolean(
        business.data?.onboarding_priority &&
        !business.data?.onboarding_focus_consumed_at,
      )}
      onConsumeOnboardingFocus={handleConsumeFocus}
      serviceCount={services.data?.pages[0]?.totalCount}
      sentQuoteCount={sentQuotes.data?.pages[0]?.totalCount}
      pendingLoading={draftQuotes.isLoading || sentQuotes.isLoading}
      recentLoading={recentQuotes.isLoading}
      agendaActionCount={agendaActionCount}
      agendaLoading={agenda.isLoading}
      reconnectCount={reconnect.data?.clients.length}
      reconnectLoading={reconnect.isLoading}
      recentQuotes={homeRecentQuotes}
    />
  );
}
