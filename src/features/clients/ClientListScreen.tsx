import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion';
import {
  Badge,
  Button,
  ConfirmationDialog,
  Dialog,
  EmptyState,
  Icon,
  InlineFeedback,
  Input,
  ListItem,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { Illustration } from '@/features/daylight/Illustration';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { getThemeShadows, radii, sizes, spacing, useTheme } from '@/theme';
import {
  useReconnectClients,
  useRelationshipMutations,
} from '@/features/relationships/hooks';
import type { Client } from './api';
import { clientInitials } from './format';
import { lastVisitLabel, reconnectIndex, serverStatusFor } from './listFilter';
import type { ClientListFilter } from './listFilter';
import {
  useClientMutations,
  useClients,
  usePrefetchClientStatuses,
} from './hooks';
import { useAuth } from '@/providers/AuthProvider';

const SWIPE_ACTION_WIDTH = 64;

const FILTER_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
  { label: 'Para retomar', value: 'reconnect' },
] as const;

const FILTER_TITLES: Record<ClientListFilter, string> = {
  all: 'Todos os clientes',
  active: 'Clientes ativos',
  inactive: 'Clientes inativos',
  reconnect: 'Clientes para retomar',
};

// A faixa tem largura fixa para o Swipeable medi-la corretamente. O próprio
// card revela as ações durante o gesto; animar cada preenchimento novamente
// a partir de `translation` deixava worklets tentando atualizar Views Fabric
// já desmontadas quando uma troca de filtro substituía as linhas.
function SwipeAction({
  backgroundColor,
  icon,
  label,
  onPress,
}: {
  backgroundColor: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.swipeAction}>
      <View style={[styles.swipeActionFill, { backgroundColor }]}>
        <AnimatedPressable
          accessibilityLabel={label}
          accessibilityRole="button"
          haptic="selection"
          onPress={onPress}
          style={styles.swipeActionPressable}
        >
          {icon}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const ClientRow = memo(function ClientRow({
  client,
  daysSince,
  needsReconnect,
  onToggleStatus,
}: {
  client: Client;
  daysSince: number | undefined;
  needsReconnect: boolean;
  onToggleStatus: (client: Client) => void;
}) {
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const isActive = client.status === 'active';
  return (
    <View
      style={[
        styles.cardWrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        shadows.rest,
      ]}
    >
      <Swipeable
        containerStyle={styles.swipeContainer}
        friction={1}
        overshootRight={false}
        renderRightActions={(_progress, _translation, swipeableMethods) => (
          <View style={styles.swipeActions}>
            {isActive ? (
              <SwipeAction
                backgroundColor={colors.danger}
                icon={<Icon name="delete" rawColor={colors.textInverse} />}
                label={`Inativar ${client.name}`}
                onPress={() => {
                  swipeableMethods.close();
                  onToggleStatus(client);
                }}
              />
            ) : (
              <SwipeAction
                backgroundColor={colors.success}
                icon={<Icon name="success" rawColor={colors.textInverse} />}
                label={`Ativar ${client.name}`}
                onPress={() => {
                  swipeableMethods.close();
                  onToggleStatus(client);
                }}
              />
            )}
            <SwipeAction
              backgroundColor={colors.info}
              icon={<Icon name="preview" rawColor={colors.textInverse} />}
              label={`Ver ${client.name}`}
              onPress={() => {
                swipeableMethods.close();
                router.push({
                  pathname: '/clients/[id]',
                  params: { id: client.id },
                });
              }}
            />
            <SwipeAction
              backgroundColor={colors.primary}
              icon={<Icon name="edit" rawColor={colors.textInverse} />}
              label={`Editar ${client.name}`}
              onPress={() => {
                swipeableMethods.close();
                router.push(`/clients/${client.id}/edit` as never);
              }}
            />
          </View>
        )}
        rightThreshold={40}
      >
        <ListItem
          accessibilityLabel={`Abrir cliente ${client.name}. ${lastVisitLabel(daysSince)}.${needsReconnect ? ' Retomada pendente.' : ''}`}
          leading={
            <View
              style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}
            >
              <Text color="primary" variant="label">
                {clientInitials(client.name)}
              </Text>
              {/* Ponto no canto do avatar em vez de mais um selo na linha: o
                  olho varre a coluna sem parar para ler cada uma. O rótulo
                  acessível acima já carrega o mesmo aviso em texto. */}
              {needsReconnect ? (
                <View
                  style={[
                    styles.attention,
                    {
                      backgroundColor: colors.warning,
                      borderColor: colors.surface,
                    },
                  ]}
                  testID={`client-attention-${client.id}`}
                />
              ) : null}
            </View>
          }
          onPress={() =>
            router.push({
              pathname: '/clients/[id]',
              params: { id: client.id },
            })
          }
          subtitle={lastVisitLabel(daysSince)}
          title={client.name}
          trailing={
            client.status === 'active' ? null : (
              <Badge label="Inativo" variant="neutral" />
            )
          }
        />
      </Swipeable>
    </View>
  );
});

const DEFAULT_RECONNECT_DAYS = 90;

/**
 * Substitui o card de prazo que vivia na tela "Clientes para retomar": a
 * configuração acompanha o filtro que ela governa, em vez de justificar uma
 * rota inteira só para si.
 */
function ReconnectIntervalDialog({
  current,
  onClose,
  onSave,
  saving,
  visible,
}: {
  current: number | undefined;
  onClose: () => void;
  onSave: (days: number) => void;
  saving: boolean;
  visible: boolean;
}) {
  const [days, setDays] = useState('');
  const value = days || String(current ?? DEFAULT_RECONNECT_DAYS);
  const valid =
    /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3650;
  return (
    <Dialog
      description="Clientes sem atendimento concluído por mais tempo que este prazo aparecem para retomar."
      onClose={saving ? () => undefined : onClose}
      title="Prazo de retorno"
      visible={visible}
    >
      <Input
        helperText="Padrão: 90 dias."
        keyboardType="number-pad"
        label="Dias sem atendimento"
        onChangeText={setDays}
        value={value}
      />
      <Button
        disabled={!valid}
        label="Salvar prazo"
        loading={saving}
        onPress={() => onSave(Number(value))}
      />
    </Dialog>
  );
}

export function ClientListScreen({
  businessId,
  initialFilter,
}: {
  businessId: string;
  initialFilter?: ClientListFilter;
}) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  // Mesmo azul das outras telas financeiras/operacionais (Agenda, Despesas,
  // Home): Clientes era a última lista com fundo plano, destoando das que já
  // ganharam a faixa de identidade.
  const bandColor = colors.primary;
  const bandForeground = colors.textInverse;
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientListFilter>(
    initialFilter ?? 'all',
  );
  const [intervalOpen, setIntervalOpen] = useState(false);
  const [archiving, setArchiving] = useState<Client>();
  const userId = user?.id ?? '';
  const query = useClients(userId, businessId, search, serverStatusFor(filter));
  usePrefetchClientStatuses(userId, businessId, search);
  // Uma consulta só traz todos os vencidos; o índice evita procurar dentro de
  // um array a cada linha enquanto a lista rola.
  const reconnect = useReconnectClients(userId, businessId);
  const mutations = useRelationshipMutations(userId, businessId);
  const clientMutations = useClientMutations(userId, businessId);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const overdue = useMemo(
    () => reconnectIndex(reconnect.data?.clients),
    [reconnect.data?.clients],
  );
  const clients = useMemo(() => {
    const all = query.data?.pages.flat() ?? [];
    return filter === 'reconnect'
      ? all.filter((client) => overdue.has(client.id))
      : all;
  }, [filter, overdue, query.data?.pages]);

  // Estável entre renders: sem isso, cada digitação na busca ou troca de
  // filtro recriava a função e invalidava o `React.memo` de toda linha
  // visível na lista, mesmo as que não mudaram.
  const handleToggleStatus = useCallback(
    (target: Client) => {
      if (target.status === 'active') {
        setArchiving(target);
        return;
      }
      clientMutations.activate.mutate(target, {
        onSuccess: () =>
          showToast({ title: `${target.name} está ativo`, variant: 'success' }),
      });
    },
    [clientMutations.activate, showToast],
  );

  // This used to be `ListHeaderComponent` content. That unmounts and
  // remounts its whole subtree whenever the element it receives is a new
  // reference — and since the SegmentedControl needs the current `filter` to
  // paint the right tab, its element was necessarily a new reference on
  // every single tab tap, no matter how this was memoized. On device
  // (`adb shell dumpsys gfxinfo`, a fresh app process each time) that showed
  // up as thousands of `RetryableMountingLayerException: Unable to find
  // SurfaceMountingManager` errors in logcat — a Reanimated worklet from an
  // option that had just been unmounted still trying to update a Fabric view
  // that no longer existed — and frame counts that kept getting worse, not
  // better, across two rounds of memoization attempts. Rendering it as a
  // plain sibling of the FlatList instead of through `ListHeaderComponent`
  // means it only ever re-renders on filter change, never unmounts.
  const filterHeader = (
    <View style={[styles.header, styles.filterHeader]}>
      <SegmentedControl
        label="Filtrar clientes"
        onChange={setFilter}
        options={FILTER_OPTIONS}
        scrollable
        value={filter}
      />
      {/* O intervalo de retomada só faz sentido enquanto esse filtro está
          ativo — fora dele seria uma configuração órfã no meio da lista. */}
      {filter === 'reconnect' ? (
        <View style={styles.reconnectBar}>
          <Text color="textSecondary" variant="bodySmall">
            {reconnect.data
              ? `Retomar após ${reconnect.data.reconnectAfterDays} dias sem atendimento`
              : 'Carregando intervalo de retomada'}
          </Text>
          <Button
            label="Configurar"
            onPress={() => setIntervalOpen(true)}
            size="small"
            variant="ghost"
          />
        </View>
      ) : null}
      {query.isSuccess && clients.length > 0 ? (
        <View accessibilityRole="header" style={styles.listContext}>
          <Text variant="sectionTitle">{FILTER_TITLES[filter]}</Text>
          <Text color="textMuted" variant="caption">
            {clients.length}{' '}
            {clients.length === 1
              ? 'cliente nesta visualização'
              : 'clientes nesta visualização'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const listHeader = (
    <View style={styles.header}>
      {query.isLoading ? (
        <View style={styles.loading}>
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : null}
      {query.isError ? (
        <>
          <InlineFeedback
            variant="error"
            message="Não foi possível carregar os clientes."
          />
          <Button
            variant="secondary"
            label="Tentar novamente"
            onPress={() => void query.refetch()}
          />
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, { backgroundColor: bandColor }]}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.band,
          { backgroundColor: bandColor, width: windowWidth + 4 },
        ]}
      >
        <View style={styles.bandStage}>
          <View style={styles.bandTitle}>
            <ProtectedPageHeader
              foregroundColor={bandForeground}
              title="Clientes"
            />
          </View>
          <AnimatedPressable
            accessibilityHint="Abre o formulário para adicionar um cliente."
            accessibilityLabel="Novo cliente"
            accessibilityRole="button"
            haptic="selection"
            style={styles.newClientTarget}
            onPress={() => router.push('/clients/new')}
          >
            <View
              style={[
                styles.newClientButton,
                {
                  backgroundColor: colors.textInverse,
                  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.18)`,
                },
              ]}
            >
              <Icon name="add" rawColor={colors.primary} size="small" />
              <Text color="primary" numberOfLines={1} variant="badge">
                Novo cliente
              </Text>
            </View>
          </AnimatedPressable>
        </View>
        <SearchInput
          label="Buscar clientes"
          labelColor="textInverse"
          placeholder="Nome, documento, telefone ou e-mail"
          reserveMessageSpace={false}
          value={input}
          onChangeText={setInput}
        />
      </View>
      <View style={[styles.body, { backgroundColor: colors.background }]}>
        {filterHeader}
        <FlatList
          contentContainerStyle={styles.screenContent}
          data={clients}
          keyExtractor={(client) => client.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            query.isSuccess ? (
              <EmptyState
                action={
                  search ? (
                    <Button
                      variant="ghost"
                      label="Limpar busca"
                      onPress={() => setInput('')}
                    />
                  ) : filter === 'reconnect' ||
                    filter === 'active' ||
                    filter === 'inactive' ? (
                    <Button
                      label="Ver todos os clientes"
                      onPress={() => setFilter('all')}
                      variant="ghost"
                    />
                  ) : (
                    <Button
                      label="Cadastrar cliente"
                      onPress={() => router.push('/clients/new')}
                    />
                  )
                }
                description={
                  search
                    ? 'Revise a busca ou limpe os filtros.'
                    : filter === 'reconnect'
                      ? 'Nenhum cliente passou do prazo de retorno configurado.'
                      : filter === 'active'
                        ? 'Nenhum cliente ativo no momento.'
                        : filter === 'inactive'
                          ? 'Nenhum cliente inativo no momento.'
                          : 'Seus clientes aparecerão aqui conforme você cadastrá-los.'
                }
                icon={
                  filter === 'reconnect' ||
                  filter === 'active' ||
                  filter === 'inactive'
                    ? 'success'
                    : 'search'
                }
                illustration={
                  filter === 'all' && !search ? (
                    <Illustration bare name="clientEmpty" size={160} />
                  ) : undefined
                }
                title={
                  search
                    ? 'Nenhum resultado encontrado'
                    : filter === 'reconnect'
                      ? 'Nenhuma retomada pendente'
                      : filter === 'active'
                        ? 'Nenhum cliente ativo'
                        : filter === 'inactive'
                          ? 'Nenhum cliente inativo'
                          : 'Nenhum cliente cadastrado'
                }
              />
            ) : null
          }
          ListFooterComponent={
            clients.length > 0 && query.hasNextPage ? (
              <View style={styles.footer}>
                <Button
                  label="Carregar mais clientes"
                  loading={query.isFetchingNextPage}
                  onPress={() => void query.fetchNextPage()}
                  variant="secondary"
                />
              </View>
            ) : null
          }
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void query.refetch()}
              refreshing={query.isFetching}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: client }) => (
            <ClientRow
              client={client}
              daysSince={overdue.get(client.id)}
              needsReconnect={overdue.has(client.id)}
              onToggleStatus={handleToggleStatus}
            />
          )}
          style={styles.list}
        />
      </View>
      <ReconnectIntervalDialog
        current={reconnect.data?.reconnectAfterDays}
        onClose={() => setIntervalOpen(false)}
        onSave={(days) =>
          mutations.settings.mutate(days, {
            onSuccess: () => setIntervalOpen(false),
          })
        }
        saving={mutations.settings.isPending}
        visible={intervalOpen}
      />
      <ConfirmationDialog
        cancelLabel="Voltar"
        confirmLabel="Inativar cliente"
        description={
          archiving
            ? `${archiving.name} deixará de aparecer entre os clientes ativos. O histórico é mantido.`
            : ''
        }
        destructive
        loading={clientMutations.archive.isPending}
        onCancel={() => setArchiving(undefined)}
        onConfirm={() =>
          archiving &&
          clientMutations.archive.mutate(archiving, {
            onSuccess: () => {
              showToast({
                title: `${archiving.name} está inativo`,
                variant: 'success',
              });
              setArchiving(undefined);
            },
          })
        }
        title="Inativar cliente?"
        visible={Boolean(archiving)}
      />
      <ProtectedBottomNavigation selected="clients" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  // Largura explícita (não margem negativa cancelando padding) evita a fresta
  // de subpixel já vista em Despesas/Resultado/Agenda. Sem altura fixa
  // chutada: o card cresce com o conteúdo real (header + resumo + botão),
  // nunca corta nem sobra vazio.
  band: {
    alignSelf: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bandStage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  bandTitle: { flex: 1, minWidth: 0 },
  newClientTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
  },
  newClientButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 38,
    paddingHorizontal: spacing.md,
  },
  body: { flex: 1 },
  screenContent: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: 0,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    paddingBottom: 112,
    paddingTop: spacing.sm,
    width: '100%',
  },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  // Was reachable only through `screenContent`'s padding while it lived
  // inside `ListHeaderComponent` — now a sibling of the FlatList, it needs
  // its own horizontal padding and the same max-width centering the list
  // content uses, to stay visually aligned with it.
  filterHeader: {
    alignSelf: 'center',
    maxWidth: sizes.contentMaxWidth,
    marginBottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: '100%',
  },
  listContext: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  loading: { gap: spacing.sm },
  footer: { marginTop: spacing.lg },
  list: { flex: 1 },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  // A borda na cor da superfície separa o ponto do avatar sem precisar de
  // espaço em volta, então ele cabe dentro dos 42px sem empurrar o layout.
  attention: {
    borderRadius: radii.circular,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    right: -1,
    top: -1,
    width: 12,
  },
  reconnectBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  // Cards soltos (raio nos 4 cantos, sombra, espaçados) em vez de um bloco
  // único colado: cada cliente é uma unidade visual própria, mais fácil de
  // escanear item a item do que uma coluna contínua com divisores.
  cardWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  swipeContainer: { overflow: 'hidden' },
  // O wrapper que a lib usa para as ações à direita é `row-reverse` — sem
  // acompanhar isso aqui, o grupo (largura menor que a faixa `absoluteFill`
  // inteira) ficava ancorado à esquerda do espaço disponível em vez de colado
  // na borda da tela, sobrando um vão visível entre ele e a extremidade. A
  // ordem de declaração no JSX (Inativar, Ver, Editar) é o que fica invertido
  // aqui para compensar; `index` de cada uma continua o mesmo (0 = revela
  // primeiro, mais perto do card).
  swipeActions: { flexDirection: 'row-reverse', height: '100%' },
  swipeAction: {
    overflow: 'hidden',
    width: SWIPE_ACTION_WIDTH,
  },
  swipeActionFill: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  swipeActionPressable: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
});
