import { supabase } from '@/lib/supabase';

export type DashboardPeriod = 'month' | '3months' | '6months' | 'year';
const HOME_DASHBOARD_RPC = 'get_home_dashboard';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface HomeDashboardData {
  businessId: string;
  period: DashboardPeriod;
  periodStart: string;
  periodEnd: string;
  approvedCents: number;
  previousApprovedCents: number;
  previousApprovedCount: number;
  previousQuoteCount: number;
  negotiatingCents: number;
  approvedCount: number;
  openCount: number;
  quoteCount: number;
  monthly: { month: string; approvedCents: number }[];
  clients: { total: number; active: number; inactive: number };
  services: {
    serviceId: string | null;
    name: string;
    quoteCount: number;
    totalCents: number;
  }[];
}

function numberValue(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0)
    throw new Error('INVALID_DASHBOARD_RESPONSE');
  return parsed;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('INVALID_DASHBOARD_RESPONSE');
  return value as Record<string, unknown>;
}

async function getPreviousCounts(
  businessId: string,
  periodStart: string,
  periodEnd: string,
) {
  const start = new Date(`${periodStart}T03:00:00Z`);
  const end = new Date(`${periodEnd}T03:00:00Z`);
  const monthCount = Math.max(
    1,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      end.getUTCMonth() -
      start.getUTCMonth(),
  );
  const previousStart = new Date(start);
  previousStart.setUTCMonth(previousStart.getUTCMonth() - monthCount);
  const baseQuery = () =>
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('updated_at', previousStart.toISOString())
      .lt('updated_at', start.toISOString());
  const [all, approved] = await Promise.all([
    baseQuery(),
    baseQuery().eq('status', 'approved'),
  ]);
  if (all.error) throw all.error;
  if (approved.error) throw approved.error;
  return {
    previousApprovedCount: approved.count ?? 0,
    previousQuoteCount: all.count ?? 0,
  };
}

export async function getHomeDashboard(
  businessId: string,
  period: DashboardPeriod,
): Promise<HomeDashboardData> {
  const { data, error } = await supabase.rpc('get_home_dashboard', {
    p_business_id: businessId,
    p_period: period,
  });
  if (error) {
    if (__DEV__) {
      console.error('[home-dashboard]', {
        stage: 'rpc-call',
        rpc: HOME_DASHBOARD_RPC,
        code: error.code,
        hint: error.hint || undefined,
        status:
          'status' in error && typeof error.status === 'number'
            ? error.status
            : undefined,
        period,
        businessIdPresent: businessId.length > 0,
        businessIdValidUuid: UUID_PATTERN.test(businessId),
      });
    }
    throw error;
  }
  const root = objectValue(data);
  if (root.quote_count === undefined) {
    if (__DEV__) {
      console.error('[home-dashboard]', {
        stage: 'response-validation',
        rpc: HOME_DASHBOARD_RPC,
        code: 'INVALID_DASHBOARD_RESPONSE',
        hint: 'Missing response field: quote_count',
        status: undefined,
        period,
        businessIdPresent: businessId.length > 0,
        businessIdValidUuid: UUID_PATTERN.test(businessId),
      });
    }
    throw new Error('INVALID_DASHBOARD_RESPONSE');
  }
  if (root.business_id !== businessId || root.period !== period)
    throw new Error('DASHBOARD_IDENTITY_MISMATCH');
  const clients = objectValue(root.clients);
  const monthly = Array.isArray(root.monthly) ? root.monthly : [];
  const services = Array.isArray(root.services) ? root.services : [];
  const previousCounts =
    root.previous_approved_count !== undefined &&
    root.previous_quote_count !== undefined
      ? {
          previousApprovedCount: numberValue(root.previous_approved_count),
          previousQuoteCount: numberValue(root.previous_quote_count),
        }
      : typeof supabase.from === 'function'
        ? await getPreviousCounts(
            businessId,
            String(root.period_start),
            String(root.period_end),
          )
        : { previousApprovedCount: 0, previousQuoteCount: 0 };
  return {
    businessId,
    period,
    periodStart: String(root.period_start),
    periodEnd: String(root.period_end),
    approvedCents: numberValue(root.approved_cents),
    previousApprovedCents: numberValue(root.previous_approved_cents),
    ...previousCounts,
    negotiatingCents: numberValue(root.negotiating_cents),
    approvedCount: numberValue(root.approved_count),
    openCount: numberValue(root.open_count),
    quoteCount: numberValue(root.quote_count),
    clients: {
      total: numberValue(clients.total),
      active: numberValue(clients.active),
      inactive: numberValue(clients.inactive),
    },
    monthly: monthly.map((entry) => {
      const item = objectValue(entry);
      return {
        month: String(item.month),
        approvedCents: numberValue(item.approved_cents),
      };
    }),
    services: services.map((entry) => {
      const item = objectValue(entry);
      return {
        serviceId: typeof item.service_id === 'string' ? item.service_id : null,
        name: String(item.name),
        quoteCount: numberValue(item.quote_count),
        totalCents: numberValue(item.total_cents),
      };
    }),
  };
}
