import type { Database } from '@/types/database';

export type ServiceOrder =
  Database['public']['Tables']['service_orders']['Row'];
export type ServiceOrderEvent =
  Database['public']['Tables']['service_order_events']['Row'];
export type ServiceOrderStatus = ServiceOrder['status'];

export const serviceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  pending: 'Aguardando início',
  in_progress: 'Em execução',
  paused: 'Pausado',
  completed: 'Concluído',
  canceled: 'Cancelado',
};

export const serviceOrderEventLabels: Record<
  ServiceOrderEvent['event_type'],
  string
> = {
  created: 'Ordem de serviço criada',
  started: 'Serviço iniciado',
  paused: 'Serviço pausado',
  resumed: 'Serviço retomado',
  completed: 'Serviço concluído',
  reopened: 'Ordem reaberta',
  canceled: 'Serviço cancelado',
  note: 'Observação adicionada',
};

export function isActiveServiceOrder(status: ServiceOrderStatus) {
  return status === 'in_progress' || status === 'paused';
}

export function serviceOrderErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/QUOTE_NOT_APPROVED/.test(message))
    return 'Somente um orçamento aprovado pode iniciar o serviço.';
  if (/SERVICE_ORDER_ALREADY_EXISTS/.test(message))
    return 'Este orçamento já possui uma execução registrada.';
  if (/SERVICE_ORDER_STALE/.test(message))
    return 'A situação mudou em outro dispositivo. Atualize a tela e tente novamente.';
  if (/CANCEL_REASON_REQUIRED/.test(message))
    return 'Informe o motivo do cancelamento.';
  if (/REOPEN_REASON_REQUIRED/.test(message))
    return 'Informe o motivo da reabertura.';
  if (/INVALID_NOTE/.test(message))
    return 'A observação deve ter entre 1 e 2.000 caracteres.';
  if (/SERVICE_ORDER_NOT_ACTIVE/.test(message))
    return 'A execução precisa estar iniciada ou pausada.';
  return 'Não foi possível concluir a ação. Tente novamente.';
}
