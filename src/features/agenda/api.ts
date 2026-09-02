import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { appointmentStatuses } from './domain';
import type { AgendaOverview, ServiceAppointment } from './domain';

const appointmentSchema = z.object({
  id: z.string().uuid(),
  service_order_id: z.string().uuid(),
  business_id: z.string().uuid(),
  client_id: z.string().uuid(),
  scheduled_on: z.string(),
  scheduled_time: z.string().nullable(),
  status: z.enum(appointmentStatuses),
  note: z.string().nullable(),
  resolution_note: z.string().nullable(),
  rescheduled_from_id: z.string().uuid().nullable(),
  actor_user_id: z.string().uuid(),
  resolved_by_user_id: z.string().uuid().nullable(),
  resolved_at: z.string().nullable(),
  created_at: z.string(),
});

const overviewSchema = z.object({
  today: z.string(),
  appointments: z.array(
    z.object({
      id: z.string().uuid(),
      serviceOrderId: z.string().uuid(),
      scheduledOn: z.string(),
      scheduledTime: z.string().nullable(),
      note: z.string().nullable(),
      clientName: z.string(),
      quoteNumber: z.number().int(),
      overdue: z.boolean(),
    }),
  ),
  financialDueToday: z.array(
    z.object({
      quoteId: z.string().uuid(),
      quoteNumber: z.number().int(),
      clientName: z.string(),
      balanceCents: z.string().regex(/^\d+$/),
    }),
  ),
});

function parseAppointment(data: unknown, businessId: string) {
  const parsed = appointmentSchema.parse(data);
  if (parsed.business_id !== businessId)
    throw new Error('APPOINTMENT_IDENTITY_MISMATCH');
  return parsed;
}

export async function getOrderAppointments(
  businessId: string,
  orderId: string,
  signal?: AbortSignal,
): Promise<ServiceAppointment[]> {
  let query = supabase
    .from('service_appointments')
    .select('*')
    .eq('business_id', businessId)
    .eq('service_order_id', orderId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((item) => parseAppointment(item, businessId));
}

export async function createAppointment(input: {
  businessId: string;
  orderId: string;
  scheduledOn: string;
  scheduledTime: string | null;
  note?: string;
}) {
  const { data, error } = await supabase.rpc('create_service_appointment', {
    p_business_id: input.businessId,
    p_service_order_id: input.orderId,
    p_scheduled_on: input.scheduledOn,
    p_scheduled_time: input.scheduledTime,
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return parseAppointment(data, input.businessId);
}

export async function rescheduleAppointment(input: {
  businessId: string;
  appointmentId: string;
  scheduledOn: string;
  scheduledTime: string | null;
  note?: string;
}) {
  const { data, error } = await supabase.rpc(
    'reschedule_service_appointment',
    {
      p_business_id: input.businessId,
      p_appointment_id: input.appointmentId,
      p_scheduled_on: input.scheduledOn,
      p_scheduled_time: input.scheduledTime,
      p_note: input.note?.trim() || null,
    },
  );
  if (error) throw error;
  return parseAppointment(data, input.businessId);
}

export async function resolveAppointment(input: {
  businessId: string;
  appointmentId: string;
  status: 'completed' | 'canceled';
  note?: string;
}) {
  const { data, error } = await supabase.rpc('resolve_service_appointment', {
    p_business_id: input.businessId,
    p_appointment_id: input.appointmentId,
    p_status: input.status,
    p_resolution_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return parseAppointment(data, input.businessId);
}

export async function getAgendaOverview(
  businessId: string,
): Promise<AgendaOverview> {
  const { data, error } = await supabase.rpc('get_agenda_overview', {
    p_business_id: businessId,
  });
  if (error) throw error;
  return overviewSchema.parse(data);
}
