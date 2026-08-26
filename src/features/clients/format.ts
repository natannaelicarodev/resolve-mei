import { digitsOnly, formatDocument } from '@/utils/documents';

export function formatClientDocument(
  value: string,
  type: 'person' | 'company',
) {
  return formatDocument(value, type === 'person' ? 'cpf' : 'cnpj');
}

export function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  return digits.length > 10
    ? digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
    : digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
}

export function clientInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'C'
  );
}
