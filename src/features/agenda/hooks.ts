import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAppointment,
  getAgendaOverview,
  getOrderAppointments,
  rescheduleAppointment,
  resolveAppointment,
} from './api';

export const agendaQueryKey = (userId: string, businessId: string) =>
  ['private', userId, 'agenda', businessId] as const;

export function useOrderAppointments(
  userId: string,
  businessId: string,
  orderId: string,
) {
  return useQuery({
    queryKey: [...agendaQueryKey(userId, businessId), 'order', orderId],
    queryFn: ({ signal }) => getOrderAppointments(businessId, orderId, signal),
    enabled: Boolean(userId && businessId && orderId),
  });
}

export function useAgendaOverview(userId: string, businessId: string) {
  return useQuery({
    queryKey: [...agendaQueryKey(userId, businessId), 'overview'],
    queryFn: () => getAgendaOverview(businessId),
    enabled: Boolean(userId && businessId),
  });
}

export function useAppointmentMutations(userId: string, businessId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: agendaQueryKey(userId, businessId) });
  return {
    create: useMutation({ mutationFn: createAppointment, onSuccess: invalidate }),
    reschedule: useMutation({ mutationFn: rescheduleAppointment, onSuccess: invalidate }),
    resolve: useMutation({ mutationFn: resolveAppointment, onSuccess: invalidate }),
  };
}
