import { businessQueryKey } from '@/features/business/hooks';
import { clientsQueryKey } from '@/features/clients/hooks';
import { profileQueryKey } from '@/features/profile/api';
import { servicesQueryKey } from '@/features/services/hooks';

it('namespaces every private domain by authenticated user', () => {
  expect(profileQueryKey('user-a')).toEqual(['private', 'user-a', 'profile']);
  expect(businessQueryKey('user-a')).toEqual(['private', 'user-a', 'business']);
  expect(clientsQueryKey('user-a', 'business-a')).toEqual([
    'private',
    'user-a',
    'clients',
    'business-a',
  ]);
  expect(servicesQueryKey('user-a', 'business-a')).toEqual([
    'private',
    'user-a',
    'services',
    'business-a',
  ]);
});
