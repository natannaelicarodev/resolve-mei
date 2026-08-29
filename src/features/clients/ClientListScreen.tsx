import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import {
  Button,
  Card,
  InlineFeedback,
  Skeleton,
  StatusLed,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  getThemeShadows,
  motion,
  radii,
  sizes,
  spacing,
  useTheme,
} from '@/theme';
import type { Client, ClientStatusFilter } from './api';
import { CLIENT_PAGE_SIZE } from './api';
import { clientInitials, formatClientDocument, formatPhone } from './format';
import { useClients } from './hooks';

const FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
] as const;

function clientContact(client: Client) {
  if (client.phone) return formatPhone(client.phone);
  if (client.document)
    return formatClientDocument(client.document, client.type);
  return client.email ?? 'Sem contato informado';
}

function ClientRow({ client, index }: { client: Client; index: number }) {
  const { colors } = useTheme();
  const active = client.status === 'active';

  return (
    <FadeInView delay={Math.min(index, 8) * motion.stagger}>
      <AnimatedPressable
        accessibilityLabel={`Abrir cliente ${client.name}`}
        accessibilityRole="button"
        onPress={() =>
          router.push({ pathname: '/clients/[id]', params: { id: client.id } })
        }
        style={[
          styles.clientRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        testID="client-list-row"
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text color="textSecondary" variant="label">
            {clientInitials(client.name).slice(0, 1)}
          </Text>
        </View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={styles.clientName} variant="label">
            {client.name}
          </Text>
          <Text
            color="textMuted"
            numberOfLines={1}
            style={styles.contact}
            variant="caption"
          >
            {clientContact(client)}
          </Text>
        </View>
        <StatusLed active={active} />
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={20}
        />
      </AnimatedPressable>
    </FadeInView>
  );
}

function ClientRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.clientRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Skeleton height={38} radius={radii.small} width={38} />
      <View style={styles.rowCopy}>
        <Skeleton height={12} width="55%" />
        <Skeleton height={10} width="35%" />
      </View>
      <Skeleton height={16} radius={radii.pill} width={54} />
    </View>
  );
}

function ClientFilters({
  value,
  onChange,
}: {
  value: ClientStatusFilter;
  onChange: (status: ClientStatusFilter) => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const activeIndex = FILTERS.findIndex((filter) => filter.value === value);
  const [position] = useState(() => new Animated.Value(activeIndex));
  useEffect(() => {
    if (reducedMotion) {
      position.setValue(activeIndex);
      return;
    }
    const animation = Animated.spring(position, {
      toValue: activeIndex,
      useNativeDriver: false,
      ...motion.spring,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, position, reducedMotion]);
  return (
    <View
      accessibilityLabel="Filtrar clientes"
      accessibilityRole="radiogroup"
      style={[
        styles.filters,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Animated.View
        importantForAccessibility="no"
        pointerEvents="none"
        style={[
          styles.filterThumb,
          {
            backgroundColor: colors.primary,
            left: position.interpolate({
              inputRange: FILTERS.map((_, filterIndex) => filterIndex),
              outputRange: FILTERS.map(
                (_, filterIndex) => `${(filterIndex * 100) / FILTERS.length}%`,
              ),
            }),
            width: `${100 / FILTERS.length}%`,
          },
        ]}
      />
      {FILTERS.map((filter) => {
        const selected = value === filter.value;
        return (
          <AnimatedPressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            containerStyle={styles.filterSlot}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={styles.filter}
          >
            <Text
              color={selected ? 'textOnPrimary' : 'textSecondary'}
              style={styles.filterText}
              variant="status"
            >
              {filter.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

export function ClientListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors, resolvedTheme } = useTheme();
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
    <FadeInView style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title} variant="sectionTitle">
            Clientes
          </Text>
          <Text color="textMuted" style={styles.count} variant="caption">
            {query.isSuccess
              ? `${clients.length}${clients.length === CLIENT_PAGE_SIZE ? '+' : ''} encontrados`
              : 'Consulte e organize seus contatos'}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityHint="Abre o formulário para adicionar um cliente."
          accessibilityLabel="Novo cliente"
          accessibilityRole="button"
          onPress={() => router.push('/clients/new')}
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            getThemeShadows(resolvedTheme).floating,
          ]}
        >
          <MaterialCommunityIcons
            color={colors.textOnPrimary}
            name="plus"
            size={18}
          />
          <Text color="textOnPrimary" style={styles.addLabel} variant="status">
            Novo cliente
          </Text>
        </AnimatedPressable>
      </View>
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="magnify"
          size={19}
        />
        <TextInput
          accessibilityLabel="Buscar clientes"
          autoCapitalize="none"
          onChangeText={setInput}
          placeholder="Nome, documento, telefone ou e-mail"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={input}
        />
      </View>
      <ClientFilters onChange={setStatus} value={status} />
    </FadeInView>
  );

  const empty = (
    <Card style={styles.empty}>
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="account-search-outline"
        size={40}
      />
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
          label="Limpar busca"
          onPress={() => setInput('')}
          variant="ghost"
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
            {[0, 1, 2].map((skeletonIndex) => (
              <FadeInView
                delay={skeletonIndex * motion.stagger}
                key={skeletonIndex}
              >
                <ClientRowSkeleton />
              </FadeInView>
            ))}
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
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={empty}
          ItemSeparatorComponent={ListGap}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => (
            <ClientRow client={item} index={index} />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      <ProtectedBottomNavigation selected="clients" />
    </SafeAreaView>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.md,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    paddingBottom: spacing.xl,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  header: { gap: 12, marginBottom: 14 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  titleCopy: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 22, lineHeight: 28 },
  count: { fontSize: 12, lineHeight: 18 },
  addButton: {
    alignItems: 'center',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  addLabel: { fontSize: 11 },
  search: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 12, minHeight: 44, paddingVertical: 0 },
  filters: {
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 3,
    position: 'relative',
  },
  filterThumb: {
    borderRadius: radii.small,
    bottom: 3,
    position: 'absolute',
    top: 3,
  },
  filterSlot: { flex: 1 },
  filter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterText: { fontSize: 11 },
  listGap: { height: 8 },
  loading: { gap: 8 },
  clientRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.small,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  rowCopy: { flex: 1, gap: 1, minWidth: 0 },
  clientName: { fontSize: 12, lineHeight: 17 },
  contact: { fontSize: 10, lineHeight: 14 },
  empty: { alignItems: 'center', marginTop: 8 },
});
