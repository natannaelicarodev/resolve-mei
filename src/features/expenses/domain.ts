export const expenseCategories = [
  'material',
  'transporte',
  'ferramentas_equipamentos',
  'alimentacao',
  'taxas_impostos',
  'marketing',
  'outros',
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  material: 'Material',
  transporte: 'Transporte',
  ferramentas_equipamentos: 'Ferramentas e equipamentos',
  alimentacao: 'Alimentação',
  taxas_impostos: 'Taxas e impostos',
  marketing: 'Marketing',
  outros: 'Outros',
};

export interface ExpenseSummary {
  id: string;
  quoteId: string | null;
  amountCents: string;
  occurredOn: string;
  category: ExpenseCategory;
  description: string | null;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
  quoteNumber: number | null;
  clientName: string | null;
  receiptCount: number;
}

export interface ExpenseMonth {
  month: string;
  receivedCents: string;
  expenseCents: string;
  resultCents: string;
  byCategory: { category: ExpenseCategory; amountCents: string }[];
  financialEntries: MonthlyFinancialEntry[];
  expenses: ExpenseSummary[];
}

export interface MonthlyFinancialEntry {
  id: string;
  occurredOn: string;
  quoteNumber: number;
  clientName: string;
  paymentMethod: 'cash'|'pix'|'debit_card'|'credit_card'|'bank_transfer'|'other';
  type: 'receipt'|'refund';
  amountCents: string;
}

export interface ExpenseInput {
  id?: string;
  amountCents: string;
  occurredOn: string;
  category: ExpenseCategory;
  description: string;
  quoteId: string | null;
  recurring: boolean;
}

export function currentMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-01`;
}

export function moveMonth(month: string, offset: number) {
  const [year = 1970, value = 1] = month.split('-').map(Number);
  const result = new Date(Date.UTC(year, value - 1 + offset, 1));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}T00:00:00Z`));
}

export function expenseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/INVALID_EXPENSE_AMOUNT/.test(message))
    return 'Informe um valor maior que zero.';
  if (/INVALID_EXPENSE_DATE/.test(message))
    return 'A data da despesa não pode estar no futuro.';
  if (/EXPENSE_DESCRIPTION_REQUIRED/.test(message))
    return 'Informe uma descrição para a categoria Outros.';
  if (/EXPENSE_RECEIPT_LIMIT_REACHED/.test(message))
    return 'Esta despesa já possui três comprovantes.';
  if (/RAW_TOO_LARGE/.test(message))
    return 'A imagem original deve ter no máximo 10 MB.';
  if (/COMPRESSED_TOO_LARGE/.test(message))
    return 'Não foi possível reduzir a imagem para menos de 3 MB.';
  return 'Não foi possível concluir a operação. Tente novamente.';
}
