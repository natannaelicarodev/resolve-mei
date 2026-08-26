import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/database';
import type { QuoteFormData } from './schemas';
import type { QuoteStatus } from './domain';
import { parseDateForDatabase } from './date';

export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type QuoteWithItems = Quote & { items: QuoteItem[] };
export type QuoteStatusFilter = 'all' | QuoteStatus | 'expired';
export const QUOTE_PAGE_SIZE = 20;

export interface QuoteCursor {
  createdAt: string;
  id: string;
}

export interface QuotePage {
  items: Quote[];
  nextCursor: QuoteCursor | null;
  totalCount: number;
}

export function escapeQuoteSearchPattern(value: string) {
  return value
    .trim()
    .replace(/[,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\%_]/g, '\\$&');
}

function assertQuoteIdentity(
  quote: Quote,
  businessId: string,
  quoteId?: string,
) {
  if (quote.business_id !== businessId || (quoteId && quote.id !== quoteId))
    throw new Error('QUOTE_IDENTITY_MISMATCH');
}

export async function listQuotes(
  businessId: string,
  search = '',
  status: QuoteStatusFilter = 'all',
  cursor: QuoteCursor | null = null,
  signal?: AbortSignal,
): Promise<QuotePage> {
  let query = supabase
    .from('quotes')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId);
  if (status !== 'all' && status !== 'expired')
    query = query.eq('status', status);
  if (status === 'expired')
    query = query
      .eq('status', 'sent')
      .lt('valid_until', new Date().toISOString().slice(0, 10));
  const term = escapeQuoteSearchPattern(search);
  if (term) {
    const numeric = Number(term.replace(/\D/g, ''));
    query =
      Number.isSafeInteger(numeric) && numeric > 0
        ? query.or(
            `client_name_snapshot.ilike.%${term}%,quote_number.eq.${numeric}`,
          )
        : query.ilike('client_name_snapshot', `%${term}%`);
  }
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  if (signal) query = query.abortSignal(signal);
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(QUOTE_PAGE_SIZE + 1);
  if (error) throw error;
  const rows = data ?? [];
  const items = rows.slice(0, QUOTE_PAGE_SIZE);
  for (const quote of items) assertQuoteIdentity(quote, businessId);
  const last = items.at(-1);
  return {
    items,
    totalCount: count ?? 0,
    nextCursor:
      rows.length > QUOTE_PAGE_SIZE && last
        ? { createdAt: last.created_at, id: last.id }
        : null,
  };
}

export async function getQuote(
  businessId: string,
  quoteId: string,
  signal?: AbortSignal,
): Promise<QuoteWithItems | null> {
  let quoteQuery = supabase
    .from('quotes')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', quoteId);
  let itemsQuery = supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('position');
  if (signal) {
    quoteQuery = quoteQuery.abortSignal(signal);
    itemsQuery = itemsQuery.abortSignal(signal);
  }
  const [quoteResult, itemsResult] = await Promise.all([
    quoteQuery.maybeSingle(),
    itemsQuery,
  ]);
  if (quoteResult.error) throw quoteResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (!quoteResult.data) return null;
  assertQuoteIdentity(quoteResult.data, businessId, quoteId);
  if ((itemsResult.data ?? []).some((item) => item.quote_id !== quoteId))
    throw new Error('QUOTE_ITEM_IDENTITY_MISMATCH');
  return { ...quoteResult.data, items: itemsResult.data ?? [] };
}

function quotePayload(input: QuoteFormData) {
  return input.items.map((item) => ({
    service_id: item.serviceId,
    name: item.name.trim(),
    description: item.description.trim(),
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  })) as Json;
}

export async function saveQuote(
  businessId: string,
  input: QuoteFormData,
  status: 'draft' | 'sent',
  quoteId?: string,
): Promise<QuoteWithItems> {
  const validUntil = parseDateForDatabase(input.validUntil);
  if (!validUntil) throw new Error('INVALID_QUOTE_DATE');
  const { data, error } = await supabase.rpc('save_quote', {
    p_business_id: businessId,
    p_client_id: input.clientId,
    p_valid_until: validUntil,
    p_discount_cents: input.discountCents,
    p_notes: input.notes,
    p_status: status,
    p_items: quotePayload(input),
    p_quote_id: quoteId ?? null,
  });
  if (error) throw error;
  const quote = data as unknown as QuoteWithItems;
  assertQuoteIdentity(quote, businessId, quoteId);
  return quote;
}

export async function transitionQuote(
  businessId: string,
  quoteId: string,
  status: QuoteStatus,
): Promise<Quote> {
  const { data, error } = await supabase.rpc('transition_quote', {
    p_business_id: businessId,
    p_quote_id: quoteId,
    p_status: status,
  });
  if (error) throw error;
  const quote = data as unknown as Quote;
  assertQuoteIdentity(quote, businessId, quoteId);
  return quote;
}

export async function duplicateQuote(
  businessId: string,
  quoteId: string,
): Promise<QuoteWithItems> {
  const { data, error } = await supabase.rpc('duplicate_quote', {
    p_business_id: businessId,
    p_quote_id: quoteId,
  });
  if (error) throw error;
  const quote = data as unknown as QuoteWithItems;
  assertQuoteIdentity(quote, businessId);
  if (quote.id === quoteId || quote.status !== 'draft')
    throw new Error('INVALID_QUOTE_DUPLICATION');
  return quote;
}

export async function getQuoteMetrics(
  businessId: string,
  signal?: AbortSignal,
) {
  const fortalezaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = Number(
    fortalezaDate.find((part) => part.type === 'year')?.value,
  );
  const month = Number(
    fortalezaDate.find((part) => part.type === 'month')?.value,
  );
  const start = new Date(Date.UTC(year, month - 1, 1, 3));
  const end = new Date(Date.UTC(year, month, 1, 3));
  let openQuery = supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['draft', 'sent']);
  let approvedQuery = supabase
    .from('quotes')
    .select('total_cents')
    .eq('business_id', businessId)
    .eq('status', 'approved')
    .gte('updated_at', start.toISOString())
    .lt('updated_at', end.toISOString());
  if (signal) {
    openQuery = openQuery.abortSignal(signal);
    approvedQuery = approvedQuery.abortSignal(signal);
  }
  const [open, approved] = await Promise.all([openQuery, approvedQuery]);
  if (open.error) throw open.error;
  if (approved.error) throw approved.error;
  return {
    openCount: open.count ?? 0,
    approvedCents: (approved.data ?? []).reduce(
      (sum, quote) => sum + quote.total_cents,
      0,
    ),
  };
}
