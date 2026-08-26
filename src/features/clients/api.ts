import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { normalizeClientInput } from './schemas';
import type { ClientFormData } from './schemas';

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientStatusFilter = 'all' | 'active' | 'inactive';
export const CLIENT_PAGE_SIZE = 20;

export async function listClients(
  businessId: string,
  search = '',
  status: ClientStatusFilter = 'all',
  page = 0,
  signal?: AbortSignal,
) {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId);
  if (status !== 'all') query = query.eq('status', status);
  const term = search.trim().replace(/[,%()]/g, '');
  if (term)
    query = query.or(
      `name.ilike.%${term}%,document.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  if (signal) query = query.abortSignal(signal);
  const from = page * CLIENT_PAGE_SIZE;
  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .order('name')
    .range(from, from + CLIENT_PAGE_SIZE - 1);
  if (error) throw error;
  return data;
}

export async function getClient(
  businessId: string,
  clientId: string,
  signal?: AbortSignal,
): Promise<Client> {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', clientId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function createClient(
  businessId: string,
  input: ClientFormData,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ business_id: businessId, ...normalizeClientInput(input) })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  businessId: string,
  clientId: string,
  input: ClientFormData,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(normalizeClientInput(input))
    .eq('business_id', businessId)
    .eq('id', clientId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function setClientStatus(
  businessId: string,
  clientId: string,
  status: Client['status'],
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({ status })
    .eq('business_id', businessId)
    .eq('id', clientId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function countActiveClients(
  businessId: string,
  signal?: AbortSignal,
): Promise<number> {
  let query = supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');
  if (signal) query = query.abortSignal(signal);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
