import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  InlineFeedback,
  Input,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { radii, sizes, spacing, useTheme } from '@/theme';
import type { Client, ClientStatusFilter } from './api';
import { CLIENT_PAGE_SIZE } from './api';
import { clientInitials, formatClientDocument, formatPhone } from './format';
import { useClients } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function ClientRow({ client }: { client: Client }) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      accessibilityLabel={`Abrir cliente ${client.name}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/clients/[id]',
          params: { id: client.id },
        })
      }
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
        <Text color="primary" variant="label">
          {clientInitials(client.name)}
        </Text>
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} variant="label">
          {client.name}
        </Text>
        <Text color="textSecondary" numberOfLines={1} variant="caption">
          {client.phone
            ? formatPhone(client.phone)
            : client.document
              ? formatClientDocument(client.document, client.type)
              : (client.email ?? 'Sem contato informado')}
        </Text>
      </View>
      {client.status === 'inactive' ? (
        <Badge label="Inativo" variant="neutral" />
      ) : null}
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="chevron-right"
        size={20}
      />
    </AnimatedPressable>
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

  const header = (
    <View style={styles.header}>
      <ProtectedPageHeader title="Clientes" />
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text variant="sectionTitle">Seus clientes</Text>
          <Text color="textSecondary">
            {query.isSuccess
              ? `${clients.length}${clients.length === CLIENT_PAGE_SIZE ? '+' : ''} encontrados`
              : 'Consulte e organize seus contatos'}
          </Text>
        </View>
        <Button
          accessibilityHint="Abre o formulário para adicionar um cliente."
          haptic="selection"
          icon={
            <MaterialCommunityIcons
              color={colors.textOnPrimary}
              name="account-plus-outline"
              size={20}
            />
          }
          label="Novo cliente"
          size="small"
          onPress={() => router.push('/clients/new')}
        />
      </View>
      <Input
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
    </View>
  );

  const empty = (
    <Card style={styles.empty}>
      <MaterialCommunityIcons name="account-search-outline" size={40} />
      <Text align="center" variant="cardTitle">
        {search ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}
      </Text>
      <Text align="center" color="textSecondary">
        {search
          ? 'Revise a busca ou limpe os filtros.'
          : 'Seus clientes aparecerão aqui conforme você cadastrá-los.'}
      </Text>
      {search ? (
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
      )}
    </Card>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      {query.isLoading ? (
        <View style={styles.content}>
          {header}
          <View
            accessible
            accessibilityLabel="Carregando clientes"
            accessibilityLiveRegion="polite"
            style={styles.loading}
          >
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </View>
        </View>
      ) : query.isError ? (
        <View style={styles.content}>
          {header}
          <InlineFeedback
            message="Não foi possível carregar os clientes."
            variant="error"
          />
          <Button
            label="Tentar novamente"
            onPress={() => void query.refetch()}
            variant="secondary"
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={clients}
          keyExtractor={(client) => client.id}
          ListEmptyComponent={empty}
          ListHeaderComponent={header}
          renderItem={({ item }) => <ClientRow client={item} />}
          style={styles.list}
        />
      )}
      <ProtectedBottomNavigation selected="clients" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    width: '100%',
  },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    width: '100%',
  },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  titleCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  loading: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  empty: { alignItems: 'center' },
});
