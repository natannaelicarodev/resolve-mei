import { router } from 'expo-router';
import { memo, useMemo, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon, Skeleton, Text } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { useTheme } from '@/theme';
import { markRender } from '@/lib/renderDiagnostics';
import type { ThemeColors } from '@/theme';
import {
  Card,
  Enter,
  HeroArtwork,
  ProfileAvatarImage,
  ShortcutTile,
  Tappable,
} from './DaylightPrimitives';
import type { Shortcut } from './DaylightPrimitives';
import { Illustration } from './Illustration';
import { OnboardingFocusArtwork } from './OnboardingFocusArtwork';
import { dayRadii, daySizes, daySpace, dayType, useDayTheme } from './theme';
import type { DayPalette } from './theme';
import type { OnboardingPriority } from '@/features/business/schemas';

const quoteMarkStyle = {
  alignItems: 'center',
  height: 40,
  justifyContent: 'center',
  width: 40,
} as const;

/**
 * The shortcuts this Home offers. Every one leads somewhere that exists — a
 * tile pointing at an unbuilt screen would teach the owner to distrust the
 * grid.
 */
const SHORTCUTS: readonly Shortcut[] = [
  {
    id: 'quotes',
    art: 'quote',
    label: 'Orçamentos',
    hint: 'Criar e acompanhar propostas',
    route: '/quotes',
  },
  {
    id: 'services',
    art: 'service',
    label: 'Serviços',
    hint: 'Catálogo e preços',
    route: '/services',
  },
  {
    id: 'expenses',
    art: 'expense',
    artSize: 40,
    label: 'Despesas',
    hint: 'Gastos e resultado',
    route: '/expenses',
  },
];

export interface DaylightHomeScreenProps {
  firstName?: string;
  businessName?: string;
  avatarUrl?: string;
  /** How many services are catalogued. Drives the setup suggestion. */
  serviceCount?: number;
  /** How many clients exist. Drives the setup suggestion. */
  clientCount?: number;
  /** True once the business has a logo saved. */
  hasLogo?: boolean;
  draftQuoteCount?: number;
  sentQuoteCount?: number;
  pendingLoading?: boolean;
  recentLoading?: boolean;
  recentQuotes?: RecentQuote[];
  highlightQuote?: RecentQuote;
  loading?: boolean;
  agendaActionCount?: number;
  agendaLoading?: boolean;
  reconnectCount?: number;
  reconnectLoading?: boolean;
  onboardingPriority?: OnboardingPriority | null;
  onboardingFocusVisible?: boolean;
  onConsumeOnboardingFocus?: () => void;
}

interface RecentQuote {
  clientName: string;
  id: string;
  quoteNumber: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'canceled';
  updatedAt: string;
}

const recentStatusLabels: Record<RecentQuote['status'], string> = {
  approved: 'Aprovado',
  canceled: 'Cancelado',
  draft: 'Rascunho',
  rejected: 'Recusado',
  sent: 'Enviado',
};

function QuoteStatusMark({ status }: { status: RecentQuote['status'] }) {
  const day = useDayTheme();
  const { colors } = useTheme();
  const quoteStatusMarks: Record<
    RecentQuote['status'],
    { color: string; soft: string }
  > = {
    approved: { color: day.income, soft: day.incomeSoft },
    canceled: { color: day.expense, soft: day.expenseSoft },
    draft: { color: colors.primary, soft: colors.primarySubtle },
    rejected: { color: day.expense, soft: day.expenseSoft },
    sent: { color: day.info, soft: day.infoSoft },
  };
  const mark = quoteStatusMarks[status];
  const statusPath = {
    approved: 'M27.1 30.5l2.1 2.1 4-4.3',
    canceled: 'M28 28.5l4.5 4.5m0-4.5L28 33',
    draft: 'M27.8 32.8l.7-3.2 3.1-3.1 2.4 2.4-3.1 3.1-3.1.8z',
    rejected: 'M28.2 28.7l4.1 4.1m.1-4.1l-4.1 4.1',
    sent: 'M27.5 30.8l6-3-2.8 6-.6-2.5-2.6-.5z',
  }[status];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={quoteMarkStyle}
    >
      <Svg height={40} viewBox="0 0 40 40" width={40}>
        <Path
          d="M8.5 4.5h15l6 6v18.75a3.25 3.25 0 01-3.25 3.25H11.75a3.25 3.25 0 01-3.25-3.25V4.5z"
          fill={colors.primarySubtle}
          stroke={colors.primary}
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Path
          d="M23.5 4.5v6h6"
          fill="none"
          stroke={colors.primary}
          strokeLinejoin="round"
          strokeWidth={1.7}
        />
        <Path
          d="M13 14.5h5.5M13 19h11.5M13 23.5h8"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={1.7}
        />
        <Path
          d="M13.2 9.7c.7-.65 2.7-.5 2.7.75 0 1.35-2.7.55-2.7 1.9 0 1.15 2 1.35 2.85.6M14.6 8.7v5.2"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={1.15}
        />
        <Circle
          cx={30.25}
          cy={30.25}
          fill={mark.soft}
          r={6.75}
          stroke={day.surface}
          strokeWidth={2}
        />
        <Path
          d={statusPath}
          fill="none"
          stroke={mark.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.65}
        />
      </Svg>
    </View>
  );
}

function formatRecentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}

/** A single next step, chosen from what the business is actually missing. */
interface Suggestion {
  title: string;
  body: string;
  route: string;
}

interface PendingItem {
  kind: 'draft' | 'sent' | 'setup';
  title: string;
  body: string;
  route: string;
}

/**
 * Picks one suggestion, in the order a business actually needs them: you cannot
 * quote without a service to sell, or send a quote without a client to send it
 * to. Returns nothing once the essentials are in place, because an empty space
 * is better than an invented task.
 */
function suggestionFor(
  serviceCount: number | undefined,
  clientCount: number | undefined,
  hasLogo: boolean,
): Suggestion | null {
  if (serviceCount === 0)
    return {
      title: 'Cadastre seu primeiro serviço',
      body: 'Com o catálogo pronto, montar um orçamento leva segundos.',
      route: '/services/new',
    };
  if (clientCount === 0)
    return {
      title: 'Adicione seu primeiro cliente',
      body: 'Guarde contato e documento uma vez e reaproveite em todo orçamento.',
      route: '/clients/new',
    };
  if (!hasLogo)
    return {
      title: 'Coloque sua marca nos orçamentos',
      body: 'Adicione o logotipo do seu negócio e envie propostas com a sua cara.',
      route: '/profile',
    };
  return null;
}

/**
 * The Home is a hub, not a dashboard.
 *
 * Money, totals and funnel detail live on their own screens. What belongs here
 * is a fast way into each area plus a short list of actions the owner can
 * resolve immediately. Financial figures stay off this screen deliberately.
 */
export const DaylightHomeScreen = memo(function DaylightHomeScreen({
  agendaActionCount,
  agendaLoading = false,
  reconnectCount,
  reconnectLoading = false,
  onboardingPriority,
  onboardingFocusVisible = false,
  onConsumeOnboardingFocus,
  avatarUrl,
  businessName,
  clientCount,
  draftQuoteCount,
  firstName,
  hasLogo = false,
  highlightQuote,
  loading = false,
  pendingLoading = false,
  recentLoading = false,
  recentQuotes = [],
  serviceCount,
  sentQuoteCount,
}: DaylightHomeScreenProps) {
  markRender('DaylightHomeScreen');
  const day = useDayTheme();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(day, colors), [colors, day]);
  const blurTarget = useRef<View | null>(null);
  const { fontScale, width } = useWindowDimensions();
  const compactShortcutGrid = width < 360 || fontScale > 1.15;
  const stackedHero = width < 340 || fontScale > 1.15;
  const stackedOperationalGroup = width < 340 || fontScale > 1.15;
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const suggestion = useMemo(
    () => suggestionFor(serviceCount, clientCount, hasLogo),
    [clientCount, hasLogo, serviceCount],
  );

  const pendingItems = useMemo(() => {
    const items: PendingItem[] = [];
    if (draftQuoteCount && highlightQuote?.status !== 'draft')
      items.push({
        kind: 'draft',
        title: 'Orçamentos em rascunho',
        body: `${draftQuoteCount} ${draftQuoteCount === 1 ? 'orçamento precisa' : 'orçamentos precisam'} ser finalizado${draftQuoteCount === 1 ? '' : 's'}.`,
        route: '/quotes',
      });
    if (sentQuoteCount && highlightQuote?.status !== 'sent')
      items.push({
        kind: 'sent',
        title: 'Aguardando resposta',
        body: `${sentQuoteCount} ${sentQuoteCount === 1 ? 'orçamento enviado precisa' : 'orçamentos enviados precisam'} de acompanhamento.`,
        route: '/quotes',
      });
    if (suggestion)
      items.push({
        kind: 'setup',
        title: suggestion.title,
        body: suggestion.body,
        route: suggestion.route,
      });
    return items.slice(0, 2);
  }, [draftQuoteCount, highlightQuote?.status, sentQuoteCount, suggestion]);

  const hero = useMemo(() => {
    if (onboardingFocusVisible && onboardingPriority) {
      if (
        onboardingPriority === 'quotes' ||
        onboardingPriority === 'collections'
      ) {
        const collecting = onboardingPriority === 'collections';
        if (serviceCount === 0)
          return {
            artwork: 'service' as const,
            body: collecting
              ? 'Cadastre o que você vende para criar a proposta e acompanhar o recebimento.'
              : 'Cadastre o que você vende para montar sua primeira proposta.',
            button: 'Cadastrar serviço',
            consumeOnPress: false,
            contextual: true,
            creates: true,
            route: '/services/new',
            title: collecting
              ? 'Prepare seu primeiro recebimento'
              : 'Comece seu primeiro orçamento',
          };
        if (clientCount === 0)
          return {
            artwork: 'client' as const,
            body: collecting
              ? 'Adicione um cliente para enviar a proposta e acompanhar o que falta receber.'
              : 'Adicione para quem você vai enviar sua primeira proposta.',
            button: 'Cadastrar cliente',
            consumeOnPress: false,
            contextual: true,
            creates: true,
            route: '/clients/new',
            title: collecting
              ? 'Prepare seu primeiro recebimento'
              : 'Comece seu primeiro orçamento',
          };
        return {
          artwork: 'quote' as const,
          body: collecting
            ? 'Crie e envie uma proposta para acompanhar cobranças e recebimentos.'
            : 'Seu catálogo e seus clientes estão prontos para a primeira proposta.',
          button: 'Criar orçamento',
          consumeOnPress: true,
          contextual: true,
          creates: true,
          route: '/quotes/new',
          title: collecting
            ? 'Comece a acompanhar recebimentos'
            : 'Crie seu primeiro orçamento',
        };
      }
      if (onboardingPriority === 'agenda')
        return {
          artwork: 'business' as const,
          body: 'Veja seus compromissos e mantenha prazos e serviços em dia.',
          button: 'Abrir agenda',
          consumeOnPress: true,
          contextual: true,
          creates: false,
          route: '/agenda',
          title: 'Organize sua agenda',
        };
      return {
        artwork: 'stats' as const,
        body: 'Registre suas primeiras movimentações para acompanhar custos e lucro.',
        button: 'Ver resultado',
        consumeOnPress: true,
        contextual: true,
        creates: false,
        route: '/result',
        title: 'Entenda seu resultado',
      };
    }
    if (highlightQuote?.status === 'draft')
      return {
        artwork: 'quoteHeroDraft' as const,
        body: `${highlightQuote.clientName} · Orçamento #${String(highlightQuote.quoteNumber).padStart(6, '0')}`,
        button: 'Continuar',
        consumeOnPress: false,
        contextual: false,
        creates: false,
        route: `/quotes/${highlightQuote.id}`,
        title: 'Continue seu orçamento',
      };
    if (highlightQuote?.status === 'sent')
      return {
        artwork: 'quoteHero' as const,
        body: `A proposta de ${highlightQuote.clientName} está aguardando resposta.`,
        button: 'Acompanhar',
        consumeOnPress: false,
        contextual: false,
        creates: false,
        route: `/quotes/${highlightQuote.id}`,
        title: 'Acompanhe a proposta',
      };
    return {
      artwork: 'quoteHeroNew' as const,
      body: 'Escolha o cliente, some os serviços e envie pelo WhatsApp.',
      button: 'Novo orçamento',
      consumeOnPress: false,
      contextual: false,
      creates: true,
      route: '/quotes/new',
      title: 'Comece um orçamento',
    };
  }, [
    clientCount,
    highlightQuote,
    onboardingFocusVisible,
    onboardingPriority,
    serviceCount,
  ]);

  const visibleRecentQuotes = useMemo(
    () => recentQuotes.filter((quote) => quote.id !== highlightQuote?.id),
    [highlightQuote?.id, recentQuotes],
  );

  // `BlurTargetView` é uma superfície nativa que existe só para o `BlurView`
  // do menu de criação ler o que está atrás dele — e esse blur roda apenas no
  // iOS; no Android o menu usa um backdrop opaco. Envolver a Home inteira nela
  // impedia o achatamento automático de views em toda a árvore, e o custo
  // aparecia como thread de UI lenta a cada transição.
  const Surface = Platform.OS === 'ios' ? BlurTargetView : View;

  return (
    <View style={styles.root}>
      <Surface ref={blurTarget} style={styles.screenContent}>
        <StatusBar style="light" />

        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <Tappable
              accessibilityLabel="Abrir configurações"
              onPress={() => router.push('/settings')}
              style={styles.headerButton}
            >
              <Icon name="settings" rawColor={day.onBrand} size="medium" />
            </Tappable>

            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.businessName}>
                {businessName ?? 'Meu negócio'}
              </Text>
              <Text numberOfLines={1} style={styles.greeting}>
                {greeting}
                {firstName ? `, ${firstName}` : ''}
              </Text>
            </View>

            <Tappable
              accessibilityLabel="Abrir perfil"
              onPress={() => router.push('/profile')}
              style={styles.headerButton}
            >
              {avatarUrl ? (
                <ProfileAvatarImage
                  style={styles.avatarImage}
                  uri={avatarUrl}
                />
              ) : (
                <Text style={styles.avatarText} testID="profile-image-fallback">
                  {firstName?.charAt(0).toUpperCase() ?? 'U'}
                </Text>
              )}
            </Tappable>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <View pointerEvents="none" style={styles.bodyShape} />
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingBottom: daySpace.xxxl,
              },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.bodyScroll}
          >
            {loading ? (
              <View
                accessibilityLabel="Carregando seu negócio"
                accessibilityState={{ busy: true }}
                style={styles.section}
              >
                <Skeleton height={96} radius={dayRadii.card} width="100%" />
                <View style={styles.gap} />
                <Skeleton height={20} radius={dayRadii.chip} width="52%" />
                <View style={styles.gap} />
                <Skeleton height={168} radius={dayRadii.card} width="100%" />
              </View>
            ) : (
              <>
                <Enter style={styles.section}>
                  <Card
                    style={[styles.hero, stackedHero && styles.heroStacked]}
                  >
                    {hero.contextual ? (
                      <Tappable
                        accessibilityLabel="Dispensar sugestão inicial"
                        onPress={() => onConsumeOnboardingFocus?.()}
                        style={styles.heroDismiss}
                      >
                        <Icon color="textMuted" name="close" size="small" />
                      </Tappable>
                    ) : null}
                    <View
                      style={[
                        styles.heroCopy,
                        stackedHero && styles.heroCopyStacked,
                      ]}
                    >
                      <Text style={styles.heroTitle}>{hero.title}</Text>
                      <Text style={styles.heroBody}>{hero.body}</Text>
                      <Tappable
                        accessibilityLabel={hero.button}
                        onPress={() => {
                          if (hero.consumeOnPress) onConsumeOnboardingFocus?.();
                          router.push(hero.route as never);
                        }}
                        style={styles.heroButton}
                      >
                        {hero.creates ? (
                          <Icon
                            name="add"
                            rawColor={day.onBrand}
                            size="small"
                          />
                        ) : null}
                        <Text style={styles.heroButtonText}>{hero.button}</Text>
                        {!hero.creates ? (
                          <Icon
                            name="forward"
                            rawColor={day.onBrand}
                            size="small"
                          />
                        ) : null}
                      </Tappable>
                    </View>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.heroArtwork,
                        hero.contextual &&
                          !stackedHero &&
                          styles.heroArtworkContextual,
                        stackedHero && styles.heroArtworkStacked,
                      ]}
                    >
                      <HeroArtwork>
                        {hero.contextual && onboardingPriority ? (
                          <OnboardingFocusArtwork
                            priority={onboardingPriority}
                            size={120}
                          />
                        ) : (
                          <Illustration name={hero.artwork} bare size={142} />
                        )}
                      </HeroArtwork>
                    </View>
                  </Card>
                </Enter>

                {agendaLoading ||
                reconnectLoading ||
                agendaActionCount !== undefined ||
                reconnectCount !== undefined ? (
                  <Enter index={1} style={styles.section}>
                    <Card
                      style={[
                        styles.operationalGroup,
                        stackedOperationalGroup &&
                          styles.operationalGroupStacked,
                        agendaActionCount === 0 &&
                        reconnectCount === 0 &&
                        !agendaLoading &&
                        !reconnectLoading
                          ? styles.operationalGroupCompact
                          : null,
                      ]}
                    >
                      {agendaLoading || agendaActionCount === undefined ? (
                        <View style={styles.operationalAction}>
                          <Skeleton
                            height={64}
                            radius={dayRadii.control}
                            width="100%"
                          />
                        </View>
                      ) : (
                        <Tappable
                          accessibilityLabel={`Abrir agenda e ações do dia. ${agendaActionCount} ação(ões).`}
                          onPress={() => router.push('/agenda' as never)}
                          style={styles.operationalAction}
                        >
                          <View style={styles.operationalHeader}>
                            <Text
                              numberOfLines={
                                stackedOperationalGroup ? undefined : 2
                              }
                              style={styles.operationalLabel}
                            >
                              Ações de hoje
                            </Text>
                            <View style={styles.operationalIconSlot}>
                              <Icon
                                name="date"
                                rawColor={colors.primary}
                                size="medium"
                              />
                            </View>
                          </View>
                          {agendaActionCount === 0 ? (
                            <View style={styles.operationalContent}>
                              <View style={styles.operationalContentCopy}>
                                <View style={styles.operationalClear}>
                                  <View style={styles.operationalStatusIcon}>
                                    <Icon
                                      name="success"
                                      rawColor={day.income}
                                      size="small"
                                    />
                                  </View>
                                  <Text
                                    numberOfLines={
                                      stackedOperationalGroup ? undefined : 2
                                    }
                                    style={styles.operationalClearText}
                                  >
                                    Nenhuma ação hoje
                                  </Text>
                                </View>
                              </View>
                              <Icon
                                name="forward"
                                rawColor={day.textMuted}
                                size="small"
                              />
                            </View>
                          ) : (
                            <View style={styles.operationalContent}>
                              <View style={styles.operationalContentCopy}>
                                <Text style={styles.operationalValue}>
                                  {agendaActionCount}
                                </Text>
                                <Text style={styles.operationalHint}>
                                  Visitas e vencimentos
                                </Text>
                              </View>
                              <Icon
                                name="forward"
                                rawColor={day.textMuted}
                                size="small"
                              />
                            </View>
                          )}
                        </Tappable>
                      )}

                      <View
                        pointerEvents="none"
                        style={[
                          styles.operationalDivider,
                          stackedOperationalGroup &&
                            styles.operationalDividerStacked,
                        ]}
                      />

                      {reconnectLoading || reconnectCount === undefined ? (
                        <View style={styles.operationalAction}>
                          <Skeleton
                            height={64}
                            radius={dayRadii.control}
                            width="100%"
                          />
                        </View>
                      ) : (
                        <Tappable
                          accessibilityLabel={`Abrir clientes para retomar. ${reconnectCount} cliente(s).`}
                          onPress={() =>
                            router.push('/clients?filter=reconnect' as never)
                          }
                          style={styles.operationalAction}
                        >
                          <View style={styles.operationalHeader}>
                            <Text
                              numberOfLines={
                                stackedOperationalGroup ? undefined : 2
                              }
                              style={styles.operationalLabel}
                            >
                              Clientes para retomar
                            </Text>
                            <View style={styles.operationalIconSlot}>
                              <Icon
                                name="client"
                                rawColor={colors.primary}
                                size="medium"
                              />
                            </View>
                          </View>
                          {reconnectCount === 0 ? (
                            <View style={styles.operationalContent}>
                              <View style={styles.operationalContentCopy}>
                                <View style={styles.operationalClear}>
                                  <View style={styles.operationalStatusIcon}>
                                    <Icon
                                      name="success"
                                      rawColor={day.income}
                                      size="small"
                                    />
                                  </View>
                                  <Text
                                    numberOfLines={
                                      stackedOperationalGroup ? undefined : 2
                                    }
                                    style={styles.operationalClearText}
                                  >
                                    Nenhum retorno vencido
                                  </Text>
                                </View>
                              </View>
                              <Icon
                                name="forward"
                                rawColor={day.textMuted}
                                size="small"
                              />
                            </View>
                          ) : (
                            <View style={styles.operationalContent}>
                              <View style={styles.operationalContentCopy}>
                                <Text style={styles.operationalValue}>
                                  {reconnectCount}
                                </Text>
                                <Text style={styles.operationalHint}>
                                  Retornos vencidos
                                </Text>
                              </View>
                              <Icon
                                name="forward"
                                rawColor={day.textMuted}
                                size="small"
                              />
                            </View>
                          )}
                        </Tappable>
                      )}
                    </Card>
                  </Enter>
                ) : null}

                <Enter index={1} style={styles.section}>
                  <Text style={styles.sectionTitle}>Gerencie seu negócio</Text>
                  <View
                    style={[
                      styles.grid,
                      compactShortcutGrid && styles.gridCompact,
                    ]}
                  >
                    {SHORTCUTS.map((shortcut, index) => (
                      <ShortcutTile
                        compact={compactShortcutGrid}
                        index={index}
                        key={shortcut.id}
                        shortcut={shortcut}
                      />
                    ))}
                  </View>
                </Enter>

                <Enter index={2} style={styles.section}>
                  <Text style={styles.sectionTitle}>Pendências do negócio</Text>
                  {pendingLoading ? (
                    <Skeleton height={76} radius={dayRadii.card} width="100%" />
                  ) : (
                    <View
                      style={[
                        styles.pendingPanel,
                        !pendingItems.length && styles.pendingPanelClear,
                      ]}
                    >
                      {pendingItems.length ? (
                        pendingItems.map((item, index) => (
                          <View key={`${item.kind}-${item.route}`}>
                            {index ? (
                              <View style={styles.pendingDivider} />
                            ) : null}
                            <Tappable
                              accessibilityHint="Abre a tela para resolver."
                              accessibilityLabel={`${item.title}. ${item.body}`}
                              onPress={() => router.push(item.route as never)}
                              style={styles.pendingRow}
                            >
                              {item.kind === 'draft' || item.kind === 'sent' ? (
                                <QuoteStatusMark status={item.kind} />
                              ) : (
                                <View style={styles.pendingIcon}>
                                  <Icon
                                    name={
                                      item.route.startsWith('/services')
                                        ? 'service'
                                        : item.route.startsWith('/clients')
                                          ? 'clientAdd'
                                          : 'profile'
                                    }
                                    rawColor={colors.primary}
                                    size="small"
                                  />
                                </View>
                              )}
                              <View style={styles.pendingCopy}>
                                <Text style={styles.pendingTitle}>
                                  {item.title}
                                </Text>
                                <Text style={styles.pendingBody}>
                                  {item.body}
                                </Text>
                              </View>
                              <Icon
                                name="forward"
                                rawColor={colors.primary}
                                size="small"
                              />
                            </Tappable>
                          </View>
                        ))
                      ) : (
                        <View
                          style={[styles.pendingRow, styles.pendingRowClear]}
                        >
                          <Icon
                            name="success"
                            rawColor={day.income}
                            size="medium"
                          />
                          <View style={styles.pendingCopy}>
                            <Text style={styles.pendingTitle}>Tudo em dia</Text>
                            <Text style={styles.pendingBody}>
                              Nenhuma pendência agora
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </Enter>

                <Enter index={3} style={styles.section}>
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitleInline}>
                      Atividade recente
                    </Text>
                    {visibleRecentQuotes.length ? (
                      <Tappable
                        accessibilityLabel="Ver todos os orçamentos"
                        onPress={() => router.push('/quotes')}
                        style={styles.sectionLink}
                      >
                        <Text style={styles.sectionLinkText}>Ver todos</Text>
                      </Tappable>
                    ) : null}
                  </View>
                  {recentLoading ? (
                    <View style={styles.activityLoading}>
                      <Skeleton
                        height={54}
                        radius={dayRadii.control}
                        width="100%"
                      />
                      <Skeleton
                        height={54}
                        radius={dayRadii.control}
                        width="100%"
                      />
                    </View>
                  ) : visibleRecentQuotes.length ? (
                    <View style={styles.activityList}>
                      {visibleRecentQuotes.map((quote, index) => (
                        <View key={quote.id}>
                          {index ? (
                            <View style={styles.activityDivider} />
                          ) : null}
                          <Tappable
                            accessibilityLabel={`Orçamento ${quote.quoteNumber}, ${quote.clientName}, ${recentStatusLabels[quote.status]}`}
                            onPress={() => router.push(`/quotes/${quote.id}`)}
                            style={styles.activityRow}
                          >
                            <QuoteStatusMark status={quote.status} />
                            <View style={styles.activityCopy}>
                              <Text
                                numberOfLines={1}
                                style={styles.activityTitle}
                              >
                                Orçamento #
                                {String(quote.quoteNumber).padStart(6, '0')}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={styles.activityBody}
                              >
                                {quote.clientName} ·{' '}
                                {recentStatusLabels[quote.status]}
                              </Text>
                            </View>
                            <View style={styles.activityMeta}>
                              <Text style={styles.activityDate}>
                                {formatRecentDate(quote.updatedAt)}
                              </Text>
                              <Icon
                                name="forward"
                                rawColor={day.textMuted}
                                size="small"
                              />
                            </View>
                          </Tappable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.activityEmpty}>
                      <Text style={styles.activityEmptyText}>
                        {highlightQuote
                          ? 'As demais atividades aparecerão aqui.'
                          : 'Seus orçamentos recentes aparecerão aqui.'}
                      </Text>
                    </View>
                  )}
                </Enter>
              </>
            )}
          </ScrollView>
        </View>

        <ProtectedBottomNavigation
          backgroundColor={day.canvas}
          blurTarget={blurTarget}
          selected="home"
          surfaceColor={day.surface}
          warmQuickCreate
        />
      </Surface>
    </View>
  );
});

const createStyles = (day: DayPalette, colors: ThemeColors) =>
  StyleSheet.create({
    root: { backgroundColor: day.canvas, flex: 1 },
    screenContent: { flex: 1 },

    headerSafe: { backgroundColor: colors.primary },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.md,
      paddingBottom: daySpace.xxl,
      paddingHorizontal: daySpace.lg,
      paddingTop: daySpace.md,
    },
    headerButton: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: dayRadii.pill,
      height: daySizes.control,
      justifyContent: 'center',
      width: daySizes.control,
    },
    headerCopy: { alignItems: 'center', flex: 1, minWidth: 0 },
    businessName: { ...dayType.heading, color: day.onBrand },
    greeting: {
      ...dayType.caption,
      color: day.onBrand,
      marginTop: 1,
      opacity: 0.85,
    },
    avatarImage: {
      borderRadius: dayRadii.pill,
      height: daySizes.control,
      width: daySizes.control,
    },
    avatarText: { ...dayType.bodyMedium, color: day.onBrand },

    body: {
      flex: 1,
      marginTop: -daySpace.lg,
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    },
    bodyShape: {
      backgroundColor: day.canvas,
      borderTopLeftRadius: dayRadii.sheet + daySpace.md,
      borderTopRightRadius: dayRadii.sheet + daySpace.md,
      bottom: 0,
      left: -daySpace.md,
      position: 'absolute',
      right: -daySpace.md,
      top: 0,
    },
    bodyScroll: { flex: 1 },
    scroll: { paddingBottom: daySizes.scrollTail, paddingTop: daySpace.lg },
    section: { marginBottom: daySpace.lg, paddingHorizontal: daySpace.lg },
    gap: { height: daySpace.md },
    sectionTitle: {
      ...dayType.label,
      color: day.textPrimary,
      fontFamily: 'Poppins_600SemiBold',
      marginBottom: daySpace.sm,
    },
    sectionHeadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: daySpace.xs,
    },
    sectionTitleInline: {
      ...dayType.label,
      color: day.textPrimary,
      fontFamily: 'Poppins_600SemiBold',
    },
    sectionLink: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: daySizes.touchTarget,
      paddingHorizontal: daySpace.sm,
    },
    sectionLinkText: { ...dayType.caption, color: colors.primary },

    hero: {
      backgroundColor: colors.primarySubtle,
      minHeight: 140,
      overflow: 'hidden',
      position: 'relative',
    },
    heroStacked: {
      minHeight: 268,
      paddingBottom: 116,
    },
    heroCopy: { maxWidth: '60%', minWidth: 0, zIndex: 1 },
    heroCopyStacked: { maxWidth: '100%' },
    heroTitle: { ...dayType.cardTitle, color: day.textPrimary },
    heroBody: {
      ...dayType.caption,
      color: day.textSecondary,
      marginTop: 2,
    },
    heroButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: dayRadii.control,
      flexDirection: 'row',
      gap: daySpace.xs + 2,
      minHeight: daySizes.control,
      justifyContent: 'center',
      marginTop: daySpace.md,
      paddingHorizontal: daySpace.lg,
    },
    heroButtonText: { ...dayType.label, color: day.onBrand },
    heroArtwork: {
      bottom: 0,
      position: 'absolute',
      right: daySpace.xs,
    },
    heroArtworkContextual: {
      bottom: undefined,
      right: -daySpace.xs,
      top: daySpace.xxxl,
    },
    heroArtworkStacked: {
      bottom: -daySpace.sm,
      right: daySpace.md,
    },
    heroDismiss: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: daySizes.touchTarget,
      minWidth: daySizes.touchTarget,
      position: 'absolute',
      right: daySpace.xs,
      top: daySpace.xs,
      zIndex: 2,
    },
    operationalGroup: {
      backgroundColor: day.surfaceMuted,
      flexDirection: 'row',
      minHeight: 124,
      overflow: 'hidden',
      padding: 0,
    },
    operationalGroupStacked: { flexDirection: 'column' },
    operationalGroupCompact: { minHeight: 112 },
    operationalAction: {
      flex: 1,
      justifyContent: 'flex-start',
      minWidth: 0,
      paddingHorizontal: daySpace.lg,
      paddingVertical: daySpace.md,
    },
    operationalHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: daySpace.sm,
      height: 40,
      justifyContent: 'space-between',
    },
    operationalLabel: {
      ...dayType.label,
      color: day.textPrimary,
      flex: 1,
      fontFamily: 'Poppins_600SemiBold',
      minWidth: 0,
    },
    operationalIconSlot: {
      alignItems: 'center',
      backgroundColor: colors.primarySubtle,
      borderRadius: dayRadii.chip,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    operationalContent: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.xs,
      justifyContent: 'flex-start',
      marginTop: daySpace.sm,
      minHeight: 40,
    },
    operationalContentCopy: { flex: 1, minWidth: 0 },
    operationalValue: { ...dayType.money, color: day.textPrimary },
    operationalHint: { ...dayType.caption, color: day.textSecondary },
    operationalClear: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.sm,
      minHeight: 40,
    },
    operationalStatusIcon: {
      alignItems: 'center',
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    operationalClearText: {
      ...dayType.caption,
      color: day.textSecondary,
      flex: 1,
    },
    operationalDivider: {
      alignSelf: 'stretch',
      backgroundColor: day.borderStrong,
      marginVertical: daySpace.md,
      width: StyleSheet.hairlineWidth,
    },
    operationalDividerStacked: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: daySpace.lg,
      marginVertical: 0,
      width: 'auto',
    },
    grid: { flexDirection: 'row', gap: daySpace.sm },
    gridCompact: { flexWrap: 'wrap' },

    pendingPanel: {
      backgroundColor: colors.primarySubtle,
      borderRadius: dayRadii.card,
      overflow: 'hidden',
    },
    pendingPanelClear: { backgroundColor: day.surfaceMuted },
    pendingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.md,
      padding: daySpace.lg,
    },
    pendingRowClear: {
      gap: daySpace.sm,
      minHeight: 56,
      paddingHorizontal: daySpace.md,
      paddingVertical: daySpace.sm,
    },
    pendingIcon: {
      alignItems: 'center',
      backgroundColor: day.surface,
      borderRadius: dayRadii.control,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    pendingCopy: { flex: 1, minWidth: 0 },
    pendingTitle: { ...dayType.label, color: day.textPrimary },
    pendingBody: {
      ...dayType.caption,
      color: day.textSecondary,
      marginTop: 2,
    },
    pendingDivider: {
      backgroundColor: day.border,
      height: StyleSheet.hairlineWidth,
      marginLeft: daySpace.lg + 36 + daySpace.md,
    },
    activityLoading: { gap: daySpace.xs },
    activityList: { paddingHorizontal: daySpace.xs },
    activityRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.md,
      minHeight: 64,
      paddingVertical: daySpace.sm,
    },
    activityCopy: { flex: 1, minWidth: 0 },
    activityTitle: { ...dayType.label, color: day.textPrimary },
    activityBody: {
      ...dayType.caption,
      color: day.textSecondary,
      marginTop: 1,
    },
    activityMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: daySpace.xs,
    },
    activityDate: {
      ...dayType.caption,
      color: day.textMuted,
      fontVariant: ['tabular-nums'],
    },
    activityDivider: {
      backgroundColor: day.border,
      height: StyleSheet.hairlineWidth,
      marginLeft: 40 + daySpace.md,
    },
    activityEmpty: {
      paddingHorizontal: daySpace.xs,
      paddingVertical: daySpace.md,
    },
    activityEmptyText: { ...dayType.caption, color: day.textSecondary },
  });
