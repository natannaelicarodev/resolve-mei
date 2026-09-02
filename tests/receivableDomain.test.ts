import {
  formatBigIntMoney,
  maskBigIntMoneyInput,
  moneyInputToCentsText,
  paymentMethodLabels,
  receivableErrorMessage,
} from '@/features/receivables/domain';

it('formats arbitrary bigint cents in pt-BR without Number precision loss', () => {
  expect(formatBigIntMoney('0')).toBe('R$ 0,00');
  expect(formatBigIntMoney('1')).toBe('R$ 0,01');
  expect(formatBigIntMoney('1234567890123456789')).toBe(
    'R$ 12.345.678.901.234.567,89',
  );
});

it('keeps money input as decimal digits suitable for a text RPC argument', () => {
  expect(maskBigIntMoneyInput('12345')).toBe('R$ 123,45');
  expect(moneyInputToCentsText('R$ 123,45')).toBe('12345');
  expect(moneyInputToCentsText('R$ 0,00')).toBe('0');
});

it('exposes the closed payment-method vocabulary in Portuguese', () => {
  expect(paymentMethodLabels).toEqual({
    cash: 'Dinheiro',
    pix: 'Pix',
    debit_card: 'Cartão de débito',
    credit_card: 'Cartão de crédito',
    bank_transfer: 'Transferência',
    other: 'Outro',
  });
});

it('explains balance and refund violations without leaking backend details', () => {
  expect(receivableErrorMessage(new Error('AMOUNT_EXCEEDS_BALANCE'))).toContain(
    'ultrapassa o saldo',
  );
  expect(
    receivableErrorMessage(new Error('REFUND_EXCEEDS_NET_RECEIVED')),
  ).toContain('líquido');
});
