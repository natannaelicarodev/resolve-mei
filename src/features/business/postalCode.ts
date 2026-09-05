import { digitsOnly } from '@/utils/documents';

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export interface PostalCodeAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const postalCodeQueryKey = (postalCode: string) =>
  ['public', 'postal-code', digitsOnly(postalCode)] as const;

export function formatPostalCode(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

export async function lookupPostalCode(
  postalCode: string,
  signal?: AbortSignal,
): Promise<PostalCodeAddress> {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 8) throw new Error('INVALID_POSTAL_CODE');

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal,
  });
  if (!response.ok) throw new Error('POSTAL_CODE_LOOKUP_FAILED');
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) throw new Error('POSTAL_CODE_NOT_FOUND');

  return {
    street: data.logradouro?.trim() ?? '',
    neighborhood: data.bairro?.trim() ?? '',
    city: data.localidade?.trim() ?? '',
    state: data.uf?.trim().toUpperCase() ?? '',
  };
}
