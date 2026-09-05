import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  ConfirmationDialog,
  DateInput,
  Dialog,
  FormSection,
  Icon,
  InlineFeedback,
  Input,
  MoneyInput,
  Screen,
  Select,
  Switch,
  Text,
} from '@/components/ui';
import { AnimatedPressable } from '@/components/motion';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { formatQuoteNumber } from '@/features/quotes/domain';
import {
  formatDateForDisplay,
  getTodayDatabaseDate,
  maskDateInput,
  parseDateForDatabase,
} from '@/features/quotes/date';
import {
  maskBigIntMoneyInput,
  moneyInputToCentsText,
} from '@/features/receivables/domain';
import { radii, sizes, spacing, useTheme } from '@/theme';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ExpenseReceiptSection } from './ExpenseReceiptSection';
import {
  expenseCategories,
  expenseCategoryLabels,
  expenseErrorMessage,
  type ExpenseCategory,
} from './domain';
import {
  useExpense,
  useExpenseMutations,
  useExpenseQuoteOptions,
} from './hooks';

export function ExpenseFormScreen({
  userId,
  businessId,
  expenseId,
  duplicateExpenseId,
}: {
  userId: string;
  businessId: string;
  expenseId?: string;
  duplicateExpenseId?: string;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const existing = useExpense(
    userId,
    businessId,
    expenseId ?? duplicateExpenseId ?? '',
  );
  const quotes = useExpenseQuoteOptions(userId, businessId);
  const mutations = useExpenseMutations(userId, businessId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(
    formatDateForDisplay(getTodayDatabaseDate()),
  );
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [description, setDescription] = useState('');
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [loadedExpenseId, setLoadedExpenseId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const discard = useUnsavedChangesGuard(dirty);
  const value = existing.data;
  if (value && loadedExpenseId !== value.id) {
    setLoadedExpenseId(value.id);
    setAmount(maskBigIntMoneyInput(value.amountCents));
    setDate(
      formatDateForDisplay(
        duplicateExpenseId ? getTodayDatabaseDate() : value.occurredOn,
      ),
    );
    setCategory(value.category);
    setDescription(value.description ?? '');
    setQuoteId(value.quoteId);
    setRecurring(value.recurring);
    // Esconder dado ja preenchido faria o usuario procurar por ele.
    if (value.quoteId || value.recurring) setLinkOpen(true);
    setDirty(false);
  }
  const parsedDate = parseDateForDatabase(date);
  const cents = moneyInputToCentsText(amount);
  const valid =
    BigInt(cents) > 0n &&
    Boolean(parsedDate) &&
    (!parsedDate || parsedDate <= getTodayDatabaseDate()) &&
    (category !== 'outros' || description.trim().length > 0);
  const selectedQuote = quotes.data?.find((item) => item.id === quoteId);
  function submit() {
    if (!parsedDate || !valid) return;
    mutations.save.mutate(
      {
        id: expenseId,
        amountCents: cents,
        occurredOn: parsedDate,
        category,
        description,
        quoteId,
        recurring,
      },
      {
        onSuccess: (saved) => {
          discard.allowNextNavigation();
          setDirty(false);
          const id = (saved as { id: string }).id;
          if (!expenseId) router.replace(`/expenses/${id}/edit` as never);
        },
      },
    );
  }
  return (
    <Screen
      background="subtle"
      contentContainerStyle={[
        styles.content,
        { backgroundColor: colors.backgroundSubtle },
      ]}
      keyboardAvoiding
      safeAreaColor={colors.primary}
      safeAreaEdges={['top', 'bottom']}
      style={{ backgroundColor: colors.primary }}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.identityBand,
          { backgroundColor: colors.primary, width: windowWidth + 4 },
        ]}
      >
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback={'/expenses' as never}
          dismissToBackFallback
          foregroundColor={colors.textInverse}
          title={expenseId ? 'Editar despesa' : 'Nova despesa'}
        />
        <View style={styles.intro}>
          <View
            style={[styles.introIcon, { backgroundColor: colors.textInverse }]}
          >
            <Icon
              name={expenseId ? 'edit' : 'money'}
              rawColor={colors.primary}
              size="large"
            />
          </View>
          <View style={styles.introCopy}>
            <Text style={{ color: colors.textInverse }} variant="sectionTitle">
              {expenseId ? 'Atualize o lançamento' : 'Registre um gasto'}
            </Text>
            <Text style={{ color: colors.textInverse }} variant="bodySmall">
              Registre apenas gastos que já aconteceram.
            </Text>
          </View>
        </View>
      </View>
      <Card style={styles.formCard} variant="elevated">
        <FormSection title="Despesa">
          <View
            style={[
              styles.amountField,
              {
                backgroundColor: colors.primarySubtle,
                borderColor: colors.primary,
              },
            ]}
          >
            <MoneyInput
              label="Valor"
              onChangeText={(value) => {
                setAmount(maskBigIntMoneyInput(value));
                setDirty(true);
              }}
              value={amount}
            />
          </View>
          <DateInput
            label="Data da despesa"
            onChangeText={(value) => {
              setDate(maskDateInput(value));
              setDirty(true);
            }}
            value={date}
            error={
              parsedDate && parsedDate > getTodayDatabaseDate()
                ? 'A data não pode estar no futuro.'
                : undefined
            }
          />
          <Select
            label="Categoria"
            onPress={() => setCategoryOpen(true)}
            value={expenseCategoryLabels[category]}
          />
          <Input
            label={category === 'outros' ? 'Descrição' : 'Descrição (opcional)'}
            maxLength={500}
            multiline
            onChangeText={(value) => {
              setDescription(value);
              setDirty(true);
            }}
            showCounter
            value={description}
            error={
              category === 'outros' && !description.trim()
                ? 'Obrigatória para Outros.'
                : undefined
            }
          />
        </FormSection>
      </Card>
      {/* O vínculo é opcional e conceitualmente separado do lançamento em si.
          Recolhido, o formulário não parece maior do que é; expandir ao toque
          comunica "isto é opcional" melhor que um rótulo dizendo isso. */}
      <Card variant="elevated">
        <AnimatedPressable
          accessibilityLabel="Vínculo e recorrência"
          accessibilityRole="button"
          accessibilityState={{ expanded: linkOpen }}
          haptic="selection"
          onPress={() => setLinkOpen((open) => !open)}
          style={styles.linkHeader}
        >
          <View style={styles.linkCopy}>
            <Text variant="cardTitle">Vínculo e recorrência</Text>
            <Text color="textSecondary" variant="bodySmall">
              {selectedQuote
                ? `#${formatQuoteNumber(selectedQuote.quote_number)} · ${selectedQuote.client_name_snapshot}`
                : recurring
                  ? 'Marcada como recorrente'
                  : 'Opcional'}
            </Text>
          </View>
          <Icon color="textMuted" name={linkOpen ? 'expand' : 'forward'} />
        </AnimatedPressable>
        {linkOpen ? (
          <>
            <Select
              label="Orçamento (opcional)"
              onPress={() => setQuoteOpen(true)}
              placeholder="Sem vínculo"
              value={
                selectedQuote
                  ? `#${formatQuoteNumber(selectedQuote.quote_number)} · ${selectedQuote.client_name_snapshot}`
                  : undefined
              }
            />
            <Switch
              description="Esta marcação não cria lançamentos automáticos."
              label="Despesa recorrente"
              onValueChange={(value) => {
                setRecurring(value);
                setDirty(true);
              }}
              value={recurring}
            />
          </>
        ) : null}
      </Card>
      {mutations.save.isError ? (
        <InlineFeedback
          message={expenseErrorMessage(mutations.save.error)}
          variant="error"
        />
      ) : null}
      <Button
        disabled={!valid || mutations.save.isPending}
        label={expenseId ? 'Salvar alterações' : 'Salvar despesa'}
        loading={mutations.save.isPending}
        onPress={submit}
      />
      {!expenseId ? (
        <Text color="textMuted" variant="caption">
          Depois de salvar, você poderá anexar até três comprovantes.
        </Text>
      ) : null}
      {expenseId ? (
        <ExpenseReceiptSection
          businessId={businessId}
          expenseId={expenseId}
          userId={userId}
        />
      ) : null}
      <Dialog
        onClose={() => setCategoryOpen(false)}
        title="Selecionar categoria"
        visible={categoryOpen}
      >
        <View style={styles.chips}>
          {expenseCategories.map((value) => (
            <Chip
              key={value}
              label={expenseCategoryLabels[value]}
              onPress={() => {
                setCategory(value);
                setDirty(true);
                setCategoryOpen(false);
              }}
              selected={category === value}
            />
          ))}
        </View>
      </Dialog>
      <Dialog
        onClose={() => setQuoteOpen(false)}
        title="Vincular orçamento"
        visible={quoteOpen}
      >
        <Button
          label="Sem vínculo"
          onPress={() => {
            setQuoteId(null);
            setDirty(true);
            setQuoteOpen(false);
          }}
          variant="secondary"
        />
        {quotes.data?.map((item) => (
          <Button
            key={item.id}
            label={`#${formatQuoteNumber(item.quote_number)} · ${item.client_name_snapshot}`}
            onPress={() => {
              setQuoteId(item.id);
              setDirty(true);
              setQuoteOpen(false);
            }}
            variant="ghost"
          />
        ))}
      </Dialog>
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        description="As alterações feitas nesta despesa ainda não foram salvas."
        destructive
        onCancel={discard.cancelDiscard}
        onConfirm={discard.confirmDiscard}
        title="Descartar alterações?"
        visible={discard.visible}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  introIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  introCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  formCard: { marginTop: -40 },
  amountField: {
    borderRadius: radii.control,
    borderWidth: 1,
    padding: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  linkHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  linkCopy: { flex: 1, gap: 2, minWidth: 0 },
});
