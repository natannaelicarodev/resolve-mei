import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  CompactCreateButton,
  Dialog,
  Divider,
  EmptyState,
  InlineFeedback,
  Input,
  ListItem,
  ListPageHeader,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { radii, sizes, spacing, useTheme } from '@/theme';
import {
  useReconnectClients,
  useRelationshipMutations,
} from '@/features/relationships/hooks';
import type { Client } from './api';
import { clientInitials } from './format';
import { lastVisitLabel, reconnectIndex, serverStatusFor } from './listFilter';
import type { ClientListFilter } from './listFilter';
import { useClients } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function ClientRow({
  client,
  daysSince,
  needsReconnect,
  divided,
  first,
  last,
}: {
  client: Client;
  daysSince: number | undefined;
  needsReconnect: boolean;
  divided: boolean;
  first: boolean;
  last: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderRightWidth: StyleSheet.hairlineWidth,
        },
        first && {
          borderTopLeftRadius: radii.card,
          borderTopRightRadius: radii.card,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        last && {
          borderBottomLeftRadius: radii.card,
          borderBottomRightRadius: radii.card,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      {divided ? <Divider /> : null}
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
    </View>
  );
}

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
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientListFilter>(
    initialFilter ?? 'all',
  );
  const [intervalOpen, setIntervalOpen] = useState(false);
  const userId = user?.id ?? '';
  const query = useClients(userId, businessId, search, serverStatusFor(filter));
  // Uma consulta só traz todos os vencidos; o índice evita procurar dentro de
  // um array a cada linha enquanto a lista rola.
  const reconnect = useReconnectClients(userId, businessId);
  const mutations = useRelationshipMutations(userId, businessId);
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

  const header = (
    <View style={styles.header}>
      <ListPageHeader
        title="Clientes"
        summary={
          query.isSuccess
            ? `${clients.length}${query.hasNextPage ? '+' : ''} encontrados`
            : 'Consulte e organize seus contatos'
        }
        action={
          <CompactCreateButton
            accessibilityHint="Abre o formulário para adicionar um cliente."
            icon="clientAdd"
            label="Novo cliente"
            onPress={() => router.push('/clients/new')}
          />
        }
      />
      <SearchInput
        label="Buscar clientes"
        placeholder="Nome, documento, telefone ou e-mail"
        reserveMessageSpace={false}
        value={input}
        onChangeText={setInput}
      />
      <SegmentedControl
        label="Filtrar clientes"
        onChange={setFilter}
        options={[
          { label: 'Todos', value: 'all' },
          { label: 'Ativos', value: 'active' },
          { label: 'Inativos', value: 'inactive' },
          { label: 'Para retomar', value: 'reconnect' },
        ]}
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
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <FlatList
        contentContainerStyle={styles.screenContent}
        data={clients}
        keyExtractor={(client) => client.id}
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
                ) : filter === 'reconnect' ? (
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
                    : 'Seus clientes aparecerão aqui conforme você cadastrá-los.'
              }
              icon={filter === 'reconnect' ? 'success' : 'search'}
              title={
                search
                  ? 'Nenhum resultado encontrado'
                  : filter === 'reconnect'
                    ? 'Nenhuma retomada pendente'
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
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void query.refetch()}
            refreshing={query.isFetching}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item: client, index }) => (
          <ClientRow
            client={client}
            daysSince={overdue.get(client.id)}
            divided={index > 0}
            first={index === 0}
            last={index === clients.length - 1}
            needsReconnect={overdue.has(client.id)}
          />
        )}
        style={styles.list}
      />
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
      <ProtectedBottomNavigation selected="clients" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
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
  header: { gap: spacing.lg, marginBottom: spacing.lg },
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
});
