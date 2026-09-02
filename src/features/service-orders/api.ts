import { supabase } from '@/lib/supabase';
import type { QuoteWithItems } from '@/features/quotes/api';
import { getQuote } from '@/features/quotes/api';
import type {
  ServiceOrder,
  ServiceOrderEvent,
  ServiceOrderStatus,
} from './domain';

export interface ServiceOrderDetails {
  order: ServiceOrder;
  events: ServiceOrderEvent[];
  quote: QuoteWithItems;
}

function assertOrder(
  order: ServiceOrder,
  businessId: string,
  orderId?: string,
) {
  if (order.business_id !== businessId || (orderId && order.id !== orderId))
    throw new Error('SERVICE_ORDER_IDENTITY_MISMATCH');
}

export async function getServiceOrderForQuote(
  businessId: string,
  quoteId: string,
  signal?: AbortSignal,
) {
  let query = supabase
    .from('service_orders')
    .select('*')
    .eq('business_id', businessId)
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data) assertOrder(data, businessId);
  return data;
}

export async function getServiceOrderDetails(
  businessId: string,
  orderId: string,
  signal?: AbortSignal,
): Promise<ServiceOrderDetails | null> {
  let orderQuery = supabase
    .from('service_orders')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', orderId);
  let eventsQuery = supabase
    .from('service_order_events')
    .select('*')
    .eq('business_id', businessId)
    .eq('service_order_id', orderId)
    .order('created_at')
    .order('id');
  if (signal) {
    orderQuery = orderQuery.abortSignal(signal);
    eventsQuery = eventsQuery.abortSignal(signal);
  }
  const [orderResult, eventsResult] = await Promise.all([
    orderQuery.maybeSingle(),
    eventsQuery,
  ]);
  if (orderResult.error) throw orderResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (!orderResult.data) return null;
  assertOrder(orderResult.data, businessId, orderId);
  const quote = await getQuote(businessId, orderResult.data.quote_id, signal);
  if (!quote) throw new Error('SERVICE_ORDER_QUOTE_MISSING');
  return { order: orderResult.data, events: eventsResult.data ?? [], quote };
}

export async function createServiceOrder(businessId: string, quoteId: string) {
  const { data, error } = await supabase.rpc('create_service_order', {
    p_business_id: businessId,
    p_quote_id: quoteId,
  });
  if (error) throw error;
  const order = data as unknown as ServiceOrder;
  assertOrder(order, businessId);
  return order;
}

export async function transitionServiceOrder(
  businessId: string,
  orderId: string,
  expectedStatus: ServiceOrderStatus,
  status: ServiceOrderStatus,
  reason?: string,
) {
  const { data, error } = await supabase.rpc('transition_service_order', {
    p_business_id: businessId,
    p_service_order_id: orderId,
    p_expected_status: expectedStatus,
    p_status: status,
    p_reason: reason?.trim() || null,
  });
  if (error) throw error;
  const order = data as unknown as ServiceOrder;
  assertOrder(order, businessId, orderId);
  return order;
}

export async function addServiceOrderNote(
  businessId: string,
  orderId: string,
  note: string,
) {
  const { data, error } = await supabase.rpc('add_service_order_note', {
    p_business_id: businessId,
    p_service_order_id: orderId,
    p_note: note,
  });
  if (error) throw error;
  return data as unknown as ServiceOrderEvent;
}
