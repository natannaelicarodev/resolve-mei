import { getHomeDashboard } from '@/features/home/api';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));

const emptyResponse = {
  business_id: 'business-a',
  period: 'month',
  period_start: '2026-08-01',
  period_end: '2026-09-01',
  approved_cents: 0,
  previous_approved_cents: 0,
  negotiating_cents: 0,
  approved_count: 0,
  open_count: 0,
  quote_count: 0,
  monthly: [{ month: '2026-08-01', approved_cents: 0 }],
  clients: { total: 0, active: 0, inactive: 0 },
  services: [],
};

beforeEach(() => jest.clearAllMocks());

it('normalizes a successful empty dashboard without treating it as an error', async () => {
  jest
    .mocked(supabase.rpc)
    .mockResolvedValue({ data: emptyResponse, error: null } as never);
  await expect(getHomeDashboard('business-a', 'month')).resolves.toMatchObject({
    businessId: 'business-a',
    approvedCents: 0,
    quoteCount: 0,
    services: [],
  });
});

it('keeps a missing RPC as a real error and logs only sanitized metadata', async () => {
  const error = {
    name: 'PostgrestError',
    code: 'PGRST202',
    message: 'Could not find the function with internal schema details',
    details: 'private detail',
    hint: 'private hint',
  };
  jest.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as never);
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  await expect(getHomeDashboard('business-a', 'month')).rejects.toBe(error);
  expect(supabase.rpc).toHaveBeenCalledWith('get_home_dashboard', {
    p_business_id: 'business-a',
    p_period: 'month',
  });
  expect(consoleError).toHaveBeenCalledWith('[home-dashboard]', {
    stage: 'rpc-call',
    rpc: 'get_home_dashboard',
    code: 'PGRST202',
    hint: 'private hint',
    status: undefined,
    period: 'month',
    businessIdPresent: true,
    businessIdValidUuid: false,
  });
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(error.message);
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(error.details);
  consoleError.mockRestore();
});

it('rejects a response for another business or period', async () => {
  jest.mocked(supabase.rpc).mockResolvedValue({
    data: { ...emptyResponse, business_id: 'business-b' },
    error: null,
  } as never);
  await expect(getHomeDashboard('business-a', 'month')).rejects.toThrow(
    'DASHBOARD_IDENTITY_MISMATCH',
  );
});
