import {
  currentMonth,
  expenseCategoryLabels,
  monthLabel,
  compactMonthLabel,
  moveMonth,
} from '@/features/expenses/domain';

it('moves between calendar months across year boundaries', () => {
  expect(moveMonth('2026-01-01', -1)).toBe('2025-12-01');
  expect(moveMonth('2026-12-01', 1)).toBe('2027-01-01');
});

it('uses the Sao Paulo calendar month', () => {
  expect(currentMonth(new Date('2026-09-01T02:30:00Z'))).toBe('2026-08-01');
  expect(currentMonth(new Date('2026-09-01T03:30:00Z'))).toBe('2026-09-01');
});

it('provides a label for every closed expense category', () => {
  expect(Object.keys(expenseCategoryLabels)).toHaveLength(7);
  expect(expenseCategoryLabels.outros).toBe('Outros');
  expect(monthLabel('2026-08-01')).toMatch(/agosto/i);
  expect(monthLabel('2026-08-01')).toBe('agosto 2026');
  expect(compactMonthLabel('2026-09-01')).toBe('set 2026');
});
