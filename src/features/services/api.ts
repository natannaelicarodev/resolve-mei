import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { normalizeServiceInput } from './schemas';
import type { ServiceFormData } from './schemas';

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceStatusFilter = 'all' | 'active' | 'inactive';
export const SERVICE_PAGE_SIZE = 20;

export interface ServiceCursor {
  createdAt: string;
  id: string;
}

export interface ServicePage {
  items: Service[];
  hasMore: boolean;
  nextCursor: ServiceCursor | null;
  totalCount: number;
}

export function escapeServiceSearchPattern(value: string) {
  return value
    .trim()
    .replace(/[,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\\%_]/g, '\\$&');
}

export async function listServices(
  businessId: string,
  search = '',
  status: ServiceStatusFilter = 'all',
  cursor: ServiceCursor | null = null,
  signal?: AbortSignal,
): Promise<ServicePage> {
  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId);
  if (status !== 'all') query = query.eq('status', status);
  const term = escapeServiceSearchPattern(search);
  if (term)
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (cursor)
    query = query.or(
      `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
    );
  if (signal) query = query.abortSignal(signal);
  const { data, count, error } = await query
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(SERVICE_PAGE_SIZE + 1);
  if (error) throw error;
  const rows = data ?? [];
  const items = rows.slice(0, SERVICE_PAGE_SIZE);
  const lastItem = items.at(-1);
  const hasMore = rows.length > SERVICE_PAGE_SIZE;
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && lastItem
        ? { createdAt: lastItem.created_at, id: lastItem.id }
        : null,
    totalCount: count ?? 0,
  };
}

export async function getService(
  businessId: string,
  serviceId: string,
  signal?: AbortSignal,
): Promise<Service | null> {
  let query = supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', serviceId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function createService(
  businessId: string,
  input: ServiceFormData,
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert({ business_id: businessId, ...normalizeServiceInput(input) })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  businessId: string,
  serviceId: string,
  input: ServiceFormData,
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update(normalizeServiceInput(input))
    .eq('business_id', businessId)
    .eq('id', serviceId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function setServiceStatus(
  businessId: string,
  serviceId: string,
  status: Service['status'],
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update({ status })
    .eq('business_id', businessId)
    .eq('id', serviceId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function countActiveServices(
  businessId: string,
  signal?: AbortSignal,
): Promise<number> {
  let query = supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');
  if (signal) query = query.abortSignal(signal);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
