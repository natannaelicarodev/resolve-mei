import { formatAppointmentDate, maskTimeInput, parseTimeForDatabase } from '@/features/agenda/domain';

it('accepts an optional minute-precision civil time', () => {
  expect(maskTimeInput('0930')).toBe('09:30');
  expect(parseTimeForDatabase('09:30')).toBe('09:30:00');
  expect(parseTimeForDatabase('')).toBeNull();
  expect(parseTimeForDatabase('25:10')).toBeUndefined();
});

it('formats date and optional time without timezone conversion', () => {
  expect(formatAppointmentDate('2026-09-01', null)).toBe('01/09/2026');
  expect(formatAppointmentDate('2026-09-01', '14:30:00')).toBe('01/09/2026, 14:30');
});
