import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  CompactCreateButton,
  Divider,
  EmptyState,
  InlineFeedback,
  ListItem,
  ListPageHeader,
  SearchInput,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { radii, spacing, useTheme } from '@/theme';
import type { Client, ClientStatusFilter } from './api';
import { CLIENT_PAGE_SIZE } from './api';
import { clientInitials, formatClientDocument, formatPhone } from './format';
import { useClients } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function ClientRow({ client }: { client: Client }) {
  const { colors } = useTheme();
  return (
    <ListItem
      accessibilityLabel={`Abrir cliente ${client.name}`}
      leading={
        <View
          style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}
        >
          <Text color="primary" variant="label">
            {clientInitials(client.name)}
          </Text>
        </View>
      }
      onPress={() =>
        router.push({
          pathname: '/clients/[id]',
          params: { id: client.id },
        })
      }
      subtitle={
        client.phone
          ? formatPhone(client.phone)
          : client.document
            ? formatClientDocument(client.document, client.type)
            : (client.email ?? 'Sem contato informado')
      }
      title={client.name}
      trailing={
        <Badge
          label={client.status === 'active' ? 'Ativo' : 'Inativo'}
          variant={client.status === 'active' ? 'success' : 'neutral'}
        />
      }
    />
  );
}

export function ClientListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatusFilter>('all');
  const query = useClients(user?.id ?? '', businessId, search, status);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const clients = query.data ?? [];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <Screen
        safeAreaEdges={[]}
        contentContainerStyle={styles.screenContent}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void query.refetch()}
            refreshing={query.isFetching}
            tintColor={colors.primary}
          />
        }
      >
        <ListPageHeader
          title="Clientes"
          summary={
            query.isSuccess
              ? `${clients.length}${clients.length === CLIENT_PAGE_SIZE ? '+' : ''} encontrados`
              : 'Consulte e organize seus contatos'
          }
          action={
            <CompactCreateButton
              accessibilityHint="Abre o formulário para adicionar um cliente."
              icon="account-plus-outline"
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
          options={[
            { label: 'Todos', value: 'all' },
            { label: 'Ativos', value: 'active' },
            { label: 'Inativos', value: 'inactive' },
          ]}
          value={status}
          onChange={setStatus}
        />
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
        {query.isSuccess && clients.length === 0 ? (
          <EmptyState
            action={
              search ? (
                <Button
                  variant="ghost"
                  label="Limpar busca"
                  onPress={() => setInput('')}
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
                : 'Seus clientes aparecerão aqui conforme você cadastrá-los.'
            }
            icon="account-search-outline"
            title={
              search
                ? 'Nenhum resultado encontrado'
                : 'Nenhum cliente cadastrado'
            }
          />
        ) : null}
        {clients.length ? (
          <Card style={styles.list}>
            {clients.map((client, index) => (
              <View key={client.id}>
                {index > 0 ? <Divider /> : null}
                <ClientRow client={client} />
              </View>
            ))}
          </Card>
        ) : null}
      </Screen>
      <ProtectedBottomNavigation selected="clients" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  screenContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  loading: { gap: spacing.sm },
  list: { gap: 0, padding: 0, overflow: 'hidden' },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
