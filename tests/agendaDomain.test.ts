import {
  calendarGrid,
  calendarMonthLabel,
  formatAppointmentDate,
  maskTimeInput,
  moveCalendarMonth,
  parseTimeForDatabase,
} from '@/features/agenda/domain';

it('accepts an optional minute-precision civil time', () => {
  expect(maskTimeInput('0930')).toBe('09:30');
  expect(parseTimeForDatabase('09:30')).toBe('09:30:00');
  expect(parseTimeForDatabase('')).toBeNull();
  expect(parseTimeForDatabase('25:10')).toBeUndefined();
});

it('formats date and optional time without timezone conversion', () => {
  expect(formatAppointmentDate('2026-09-01', null)).toBe('01/09/2026');
  expect(formatAppointmentDate('2026-09-01', '14:30:00')).toBe(
    '01/09/2026, 14:30',
  );
});

it('moves the calendar month across year boundaries', () => {
  expect(moveCalendarMonth('2026-09-01', -1)).toBe('2026-08-01');
  expect(moveCalendarMonth('2026-09-01', 1)).toBe('2026-10-01');
  expect(moveCalendarMonth('2026-01-01', -1)).toBe('2025-12-01');
  expect(moveCalendarMonth('2026-12-01', 1)).toBe('2027-01-01');
});

it('labels the calendar month in Portuguese without a leading preposition', () => {
  expect(calendarMonthLabel('2026-09-01')).toBe('setembro 2026');
});

/**
 * September 2026 starts on a Tuesday, so the grid must pad two days from
 * August before day 1 and fill the trailing week with October — every row
 * a full week (Sun–Sat), never a partial one that would misalign columns.
 */
it('builds a full-week grid that pads leading and trailing days from neighboring months', () => {
  const grid = calendarGrid('2026-09-01');
  expect(grid.length % 7).toBe(0);
  expect(grid[0]).toEqual({ date: '2026-08-30', day: 30, inMonth: false });
  expect(grid[1]).toEqual({ date: '2026-08-31', day: 31, inMonth: false });
  expect(grid[2]).toEqual({ date: '2026-09-01', day: 1, inMonth: true });
  expect(grid.at(-1)).toEqual({ date: '2026-10-03', day: 3, inMonth: false });
  expect(grid.filter((cell) => cell.inMonth)).toHaveLength(30);
});
