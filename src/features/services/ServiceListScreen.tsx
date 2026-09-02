import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  CompactCreateButton,
  Divider,
  EmptyState,
  InlineFeedback,
  ListItem,
  ListPageHeader,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { sizes, spacing, useTheme } from '@/theme';
import type { Service, ServiceStatusFilter } from './api';
import { formatDuration, formatPriceCents } from './format';
import { useServices } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function ServiceRow({ service }: { service: Service }) {
  const duration = formatDuration(service.estimated_duration_minutes);
  const subtitle = [service.description, duration].filter(Boolean).join(' · ');
  return (
    <ListItem
      accessibilityLabel={`${service.name}, ${formatPriceCents(service.price_cents)}${duration ? `, ${duration}` : ''}${service.status === 'inactive' ? ', inativo' : ''}`}
      onPress={() =>
        router.push({
          pathname: '/services/[id]',
          params: { id: service.id },
        })
      }
      subtitle={subtitle || undefined}
      title={service.name}
      trailing={
        <View style={styles.trailing}>
          <Text numberOfLines={1} style={styles.price} variant="monetaryValue">
            {formatPriceCents(service.price_cents)}
          </Text>
          {/* Só a exceção ganha selo: marcar "Ativo" em toda linha gasta a
              coluna com o estado normal e deixa o inativo menos visível. */}
          {service.status === 'active' ? null : (
            <Badge label="Inativo" variant="neutral" />
          )}
        </View>
      }
    />
  );
}

export function ServiceListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ServiceStatusFilter>('all');
  const query = useServices(user?.id ?? '', businessId, search, status);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const services = useMemo(() => {
    const unique = new Map<string, Service>();
    for (const page of query.data?.pages ?? [])
      for (const service of page.items) unique.set(service.id, service);
    return [...unique.values()];
  }, [query.data?.pages]);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  };
  const header = (
    <View style={styles.header}>
      <ListPageHeader
        title="Serviços"
        summary={
          query.isSuccess
            ? `${totalCount} ${totalCount === 1 ? 'resultado' : 'resultados'}`
            : 'Organize o que seu negócio oferece'
        }
        action={
          <CompactCreateButton
            accessibilityHint="Abre o formulário para adicionar um serviço."
            icon="service"
            label="Novo serviço"
            onPress={() => router.push('/services/new')}
          />
        }
      />
      <SearchInput
        label="Buscar serviços"
        onChangeText={setInput}
        placeholder="Nome ou descrição"
        reserveMessageSpace={false}
        value={input}
      />
      <SegmentedControl
        label="Filtrar serviços"
        onChange={setStatus}
        options={[
          { label: 'Todos', value: 'all' },
          { label: 'Ativos', value: 'active' },
          { label: 'Inativos', value: 'inactive' },
        ]}
        value={status}
      />
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      {query.isLoading ? (
        <View style={styles.content}>
          {header}
          <View
            accessible
            accessibilityLabel="Carregando serviços"
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
            message="Não foi possível carregar os serviços."
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
          data={services}
          keyExtractor={(service) => service.id}
          ListEmptyComponent={
            <EmptyState
              action={
                search || status !== 'all' ? (
                  <Button
                    label="Limpar busca e filtros"
                    onPress={() => {
                      setInput('');
                      setSearch('');
                      setStatus('all');
                    }}
                    variant="ghost"
                  />
                ) : (
                  <Button
                    label="Cadastrar serviço"
                    onPress={() => router.push('/services/new')}
                  />
                )
              }
              description={
                search || status !== 'all'
                  ? 'Revise a busca ou altere o filtro.'
                  : 'Seus serviços aparecerão aqui conforme você cadastrá-los.'
              }
              icon="search"
              title={
                search || status !== 'all'
                  ? 'Nenhum serviço encontrado'
                  : 'Nenhum serviço cadastrado'
              }
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator
                accessibilityLabel="Carregando mais serviços"
                color={colors.primary}
                style={styles.footer}
              />
            ) : null
          }
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={header}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => <ServiceRow service={item} />}
          style={styles.list}
        />
      )}
      <ProtectedBottomNavigation selected="services" />
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
  loading: { gap: spacing.sm },
  trailing: { alignItems: 'flex-end', flexShrink: 0, gap: spacing.xs },
  price: { flexShrink: 0 },
  footer: { padding: spacing.lg },
});
