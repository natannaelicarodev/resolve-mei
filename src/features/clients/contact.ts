import * as Linking from 'expo-linking';
import { digitsOnly } from '@/utils/documents';

export type ClientContactKind = 'phone' | 'whatsapp' | 'email';

export function buildContactUrl(kind: ClientContactKind, value: string) {
  if (kind === 'email')
    return `mailto:${encodeURIComponent(value.trim().toLowerCase())}`;
  const phone = digitsOnly(value);
  if (kind === 'phone') return `tel:${phone}`;
  return `https://wa.me/55${phone}`;
}

export async function openClientContact(
  kind: ClientContactKind,
  value: string,
) {
  const url = buildContactUrl(kind, value);
  if (!(await Linking.canOpenURL(url))) throw new Error('CONTACT_UNAVAILABLE');
  await Linking.openURL(url);
}
