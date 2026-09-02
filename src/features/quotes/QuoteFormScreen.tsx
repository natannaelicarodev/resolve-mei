import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Badge,
  Card,
  ConfirmationDialog,
  Divider,
  InlineFeedback,
  InlineLoading,
  Icon,
  Input,
  ListItem,
  SearchInput,
  Select,
  Screen,
  Text,
} from '@/components/ui';
import { useClients } from '@/features/clients/hooks';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { useServices } from '@/features/services/hooks';
import { normalizeError } from '@/lib/errors';
import { spacing } from '@/theme';
import { quotesQueryKey } from './hooks';
import {
  calculateQuoteTotals,
  centsToMoneyInput,
  moneyInputToCents,
} from './domain';
import { saveQuote } from './api';
import type { QuoteWithItems } from './api';
import { defaultQuoteValues, quoteSchema } from './schemas';
import type { QuoteFormData } from './schemas';
import { formatDateForDisplay, maskDateInput } from './date';

function quoteToForm(quote: QuoteWithItems): QuoteFormData {
  return {
    clientId: quote.client_id,
    validUntil: formatDateForDisplay(quote.valid_until),
    discountCents: quote.discount_cents,
    notes: quote.notes ?? '',
    items: quote.items.map((item) => ({
      serviceId: item.service_id,
      name: item.name_snapshot,
      description: item.description_snapshot ?? '',
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
  };
}

export function QuoteFormScreen({
  userId,
  businessId,
  quote,
}: {
  userId: string;
  businessId: string;
  quote?: QuoteWithItems;
}) {
  return (
    <QuoteForm
      key={`${userId}:${businessId}:${quote?.id ?? 'new'}`}
      businessId={businessId}
      quote={quote}
      userId={userId}
    />
  );
}

function QuoteForm({
  userId,
  businessId,
  quote,
}: {
  userId: string;
  businessId: string;
  quote?: QuoteWithItems;
}) {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const mounted = useRef(true);
  const locked = useRef(false);
  const allowNavigation = useRef(false);
  const pendingNavigationAction = useRef<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientInput, setClientInput] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientLabel, setSelectedClientLabel] = useState(
    quote?.client_name_snapshot,
  );
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [serviceInput, setServiceInput] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  useEffect(() => {
    const timer = setTimeout(() => setClientSearch(clientInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [clientInput]);
  useEffect(() => {
    const timer = setTimeout(() => setServiceSearch(serviceInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [serviceInput]);
  const clients = useClients(userId, businessId, clientSearch, 'active');
  const services = useServices(userId, businessId, serviceSearch, 'active');
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote ? quoteToForm(quote) : defaultQuoteValues(),
  });
  const fields = useFieldArray({ control: form.control, name: 'items' });
  const items = useWatch({ control: form.control, name: 'items' }) ?? [];
  const selectedClientId = useWatch({
    control: form.control,
    name: 'clientId',
  });
  const clientRows = clients.data?.pages.flat() ?? [];
  const serviceRows = services.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedClientName =
    clientRows.find((client) => client.id === selectedClientId)?.name ??
    selectedClientLabel;
  const discount =
    useWatch({ control: form.control, name: 'discountCents' }) ?? 0;
  const totals = calculateQuoteTotals(items, discount);
  useEffect(() => {
    const removeListener = navigation.addListener('beforeRemove', (event) => {
      if (!form.formState.isDirty || allowNavigation.current) return;
      event.preventDefault();
      pendingNavigationAction.current = event.data.action;
      setConfirmDiscard(true);
    });
    return removeListener;
  }, [form.formState.isDirty, navigation]);
  const mutation = useMutation({
    mutationFn: ({
      data,
      status,
      expectedUserId,
      expectedBusinessId,
      expectedQuoteId,
      identity: expectedIdentity,
    }: {
      data: QuoteFormData;
      status: 'draft' | 'sent';
      expectedUserId: string;
      expectedBusinessId: string;
      expectedQuoteId: string | null;
      identity: string;
    }) => {
      if (
        !mounted.current ||
        expectedUserId !== userId ||
        expectedBusinessId !== businessId ||
        expectedQuoteId !== (quote?.id ?? null) ||
        expectedIdentity !== `${userId}:${businessId}:${quote?.id ?? 'new'}`
      )
        throw new Error('QUOTE_SESSION_CHANGED');
      return saveQuote(businessId, data, status, quote?.id);
    },
    onSuccess: (saved, variables) => {
      if (
        !mounted.current ||
        saved.business_id !== variables.expectedBusinessId ||
        variables.expectedUserId !== userId
      )
        return;
      void queryClient.invalidateQueries({
        queryKey: quotesQueryKey(userId, businessId),
      });
      allowNavigation.current = true;
      router.replace({
        pathname: '/quotes/[id]',
        params: { id: saved.id },
      } as unknown as Href);
    },
    onError: (error) => {
      locked.current = false;
      if (mounted.current)
        form.setError('root', { message: normalizeError(error).message });
    },
  });
  const submit = (status: 'draft' | 'sent') =>
    form.handleSubmit((data) => {
      if (locked.current || !mounted.current) return;
      locked.current = true;
      form.clearErrors('root');
      mutation.mutate({
        data,
        status,
        expectedUserId: userId,
        expectedBusinessId: businessId,
        expectedQuoteId: quote?.id ?? null,
        identity: `${userId}:${businessId}:${quote?.id ?? 'new'}`,
      });
    })();

  return (
    <Screen keyboardAvoiding safeAreaEdges={['top', 'bottom']}>
      <ProtectedPageHeader
        back
        backFallback={'/quotes' as Href}
        title={quote ? 'Editar orçamento' : 'Novo orçamento'}
      />
      <Card>
        <Text variant="cardTitle">Cliente</Text>
        <Select
          error={form.formState.errors.clientId?.message}
          label="Cliente do orçamento"
          onPress={() => setClientPickerOpen((open) => !open)}
          placeholder="Escolher cliente"
          value={selectedClientName}
        />
        {clientPickerOpen ? (
          <View style={styles.picker}>
            <SearchInput
              label="Buscar cliente"
              onChangeText={setClientInput}
              placeholder="Nome, documento, telefone ou e-mail"
              value={clientInput}
            />
            {clients.isLoading ? (
              <InlineLoading label="Carregando clientes" />
            ) : null}
            {clients.isError ? (
              <InlineFeedback
                message="Não foi possível carregar os clientes."
                variant="error"
              />
            ) : null}
            {clients.isSuccess && clientRows.length === 0 ? (
              <InlineFeedback
                message="Nenhum cliente ativo encontrado."
                variant="info"
              />
            ) : null}
            {clientRows.length ? (
              <Card style={styles.optionList}>
                {clientRows.map((client, index) => (
                  <View key={client.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListItem
                      accessibilityLabel={`Selecionar cliente ${client.name}`}
                      onPress={() => {
                        form.setValue('clientId', client.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setSelectedClientLabel(client.name);
                        setClientPickerOpen(false);
                      }}
                      title={client.name}
                      trailing={
                        selectedClientId === client.id ? (
                          <Badge label="Selecionado" variant="success" />
                        ) : undefined
                      }
                    />
                  </View>
                ))}
              </Card>
            ) : null}
            {clients.hasNextPage ? (
              <Button
                label="Carregar mais clientes"
                loading={clients.isFetchingNextPage}
                onPress={() => void clients.fetchNextPage()}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}
        {form.formState.errors.clientId ? (
          <InlineFeedback
            message={form.formState.errors.clientId.message ?? ''}
            variant="error"
          />
        ) : null}
      </Card>
      <Card>
        <Text variant="cardTitle">Itens</Text>
        <Button
          label={
            servicePickerOpen ? 'Fechar catálogo' : 'Adicionar do catálogo'
          }
          onPress={() => setServicePickerOpen((open) => !open)}
          variant="secondary"
        />
        {servicePickerOpen ? (
          <View style={styles.picker}>
            <SearchInput
              label="Buscar serviço"
              onChangeText={setServiceInput}
              placeholder="Nome ou descrição"
              value={serviceInput}
            />
            {services.isLoading ? (
              <InlineLoading label="Carregando serviços" />
            ) : null}
            {services.isError ? (
              <InlineFeedback
                message="Não foi possível carregar os serviços."
                variant="error"
              />
            ) : null}
            {services.isSuccess && serviceRows.length === 0 ? (
              <InlineFeedback
                message="Nenhum serviço ativo encontrado."
                variant="info"
              />
            ) : null}
            {serviceRows.map((service) => (
              <Button
                key={service.id}
                label={`Adicionar ${service.name}`}
                onPress={() =>
                  fields.append({
                    serviceId: service.id,
                    name: service.name,
                    description: service.description ?? '',
                    quantity: 1,
                    unitPriceCents: service.price_cents,
                  })
                }
                variant="secondary"
              />
            ))}
            {services.hasNextPage ? (
              <Button
                label="Carregar mais serviços"
                loading={services.isFetchingNextPage}
                onPress={() => void services.fetchNextPage()}
                variant="ghost"
              />
            ) : null}
          </View>
        ) : null}
        <Button
          icon={<Icon color="primary" name="add" size="small" />}
          label="Adicionar item personalizado"
          onPress={() =>
            fields.append({
              serviceId: null,
              name: '',
              description: '',
              quantity: 1,
              unitPriceCents: 0,
            })
          }
          variant="secondary"
        />
        {fields.fields.map((field, index) => (
          <View key={field.id} style={styles.item}>
            <Controller
              control={form.control}
              name={`items.${index}.name`}
              render={({ field: itemField, fieldState }) => (
                <Input
                  label={`Nome do item ${index + 1}`}
                  value={itemField.value}
                  onChangeText={itemField.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.description`}
              render={({ field: itemField }) => (
                <Input
                  label="Descrição complementar"
                  value={itemField.value}
                  onChangeText={itemField.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field: itemField, fieldState }) => (
                <Input
                  label="Quantidade"
                  keyboardType="number-pad"
                  value={String(itemField.value)}
                  onChangeText={(value) =>
                    itemField.onChange(Number(value.replace(/\D/g, '')))
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.unitPriceCents`}
              render={({ field: itemField }) => (
                <Input
                  label="Valor unitário"
                  keyboardType="number-pad"
                  value={centsToMoneyInput(itemField.value)}
                  onChangeText={(value) =>
                    itemField.onChange(moneyInputToCents(value))
                  }
                />
              )}
            />
            <Button
              label="Remover item"
              onPress={() => fields.remove(index)}
              variant="ghost"
            />
          </View>
        ))}
        {form.formState.errors.items?.root?.message ? (
          <InlineFeedback
            message={form.formState.errors.items.root.message}
            variant="error"
          />
        ) : null}
      </Card>
      <Card>
        <Controller
          control={form.control}
          name="validUntil"
          render={({ field, fieldState }) => (
            <Input
              accessibilityHint="Digite dia, mês e ano usando somente números."
              keyboardType="number-pad"
              label="Validade"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              value={field.value}
              onChangeText={(value) => field.onChange(maskDateInput(value))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="discountCents"
          render={({ field, fieldState }) => (
            <Input
              label="Desconto"
              keyboardType="number-pad"
              value={centsToMoneyInput(field.value)}
              onChangeText={(value) => field.onChange(moneyInputToCents(value))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Observações"
              value={field.value}
              onChangeText={field.onChange}
              multiline
            />
          )}
        />
        <Text>Subtotal: {centsToMoneyInput(totals.subtotalCents)}</Text>
        <Text variant="cardTitle">
          Total: {centsToMoneyInput(totals.totalCents)}
        </Text>
      </Card>
      {form.formState.errors.root?.message ? (
        <InlineFeedback
          message={form.formState.errors.root.message}
          variant="error"
        />
      ) : null}
      <Button
        disabled={mutation.isPending}
        loading={mutation.isPending}
        label="Salvar como rascunho"
        onPress={() => void submit('draft')}
      />
      <Button
        disabled={mutation.isPending}
        label="Salvar e marcar como enviado"
        onPress={() => void submit('sent')}
        variant="secondary"
      />
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar"
        destructive
        description="As alterações feitas neste orçamento não foram salvas."
        onCancel={() => {
          pendingNavigationAction.current = null;
          setConfirmDiscard(false);
        }}
        onConfirm={() => {
          const action = pendingNavigationAction.current;
          if (!action) return;
          allowNavigation.current = true;
          setConfirmDiscard(false);
          navigation.dispatch(action);
        }}
        title="Descartar alterações?"
        visible={confirmDiscard}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { gap: spacing.sm, paddingVertical: spacing.sm },
  picker: { gap: spacing.sm },
  optionList: { gap: 0, overflow: 'hidden', padding: 0 },
});
