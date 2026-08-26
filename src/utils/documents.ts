export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  return checkDigit(digits, 9, 10) && checkDigit(digits, 10, 11);
}

export function isValidCnpj(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  return checkCnpjDigit(digits, 12) && checkCnpjDigit(digits, 13);
}

function checkDigit(value: string, length: number, factor: number): boolean {
  const sum = value
    .slice(0, length)
    .split('')
    .reduce((total, digit) => total + Number(digit) * factor--, 0);
  const calculated = ((sum * 10) % 11) % 10;
  return calculated === Number(value[length]);
}

function checkCnpjDigit(value: string, length: number): boolean {
  const weights =
    length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = value
    .slice(0, length)
    .split('')
    .reduce(
      (total, digit, index) => total + Number(digit) * (weights[index] ?? 0),
      0,
    );
  const remainder = sum % 11;
  const calculated = remainder < 2 ? 0 : 11 - remainder;
  return calculated === Number(value[length]);
}

export function formatDocument(value: string, type: 'cpf' | 'cnpj'): string {
  const digits = digitsOnly(value).slice(0, type === 'cpf' ? 11 : 14);
  if (type === 'cpf') {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
