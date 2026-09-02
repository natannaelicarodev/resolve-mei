import {
  isActiveServiceOrder,
  serviceOrderErrorMessage,
  serviceOrderStatusLabels,
} from '@/features/service-orders/domain';

it('labels every persisted execution state', () => {
  expect(serviceOrderStatusLabels).toEqual({
    pending: 'Aguardando início',
    in_progress: 'Em execução',
    paused: 'Pausado',
    completed: 'Concluído',
    canceled: 'Cancelado',
  });
});

it('allows notes and controls only while execution is active', () => {
  expect(isActiveServiceOrder('in_progress')).toBe(true);
  expect(isActiveServiceOrder('pending')).toBe(false);
  expect(isActiveServiceOrder('paused')).toBe(true);
  expect(isActiveServiceOrder('completed')).toBe(false);
  expect(isActiveServiceOrder('canceled')).toBe(false);
});

it('explains concurrency and cancellation errors without exposing backend details', () => {
  expect(serviceOrderErrorMessage(new Error('SERVICE_ORDER_STALE'))).toContain(
    'outro dispositivo',
  );
  expect(serviceOrderErrorMessage(new Error('CANCEL_REASON_REQUIRED'))).toBe(
    'Informe o motivo do cancelamento.',
  );
});
