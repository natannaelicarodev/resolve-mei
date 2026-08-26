import * as Linking from 'expo-linking';
import { buildContactUrl, openClientContact } from '@/features/clients/contact';

jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

describe('client contact actions', () => {
  it('builds sanitized phone, Brazilian WhatsApp and email links', () => {
    expect(buildContactUrl('phone', '(11) 99999-1234')).toBe('tel:11999991234');
    expect(buildContactUrl('whatsapp', '(11) 99999-1234')).toBe(
      'https://wa.me/5511999991234',
    );
    expect(buildContactUrl('email', ' CLIENTE@EXAMPLE.COM ')).toBe(
      'mailto:cliente%40example.com',
    );
  });

  it('opens supported links and reports unavailable handlers', async () => {
    jest
      .mocked(Linking.canOpenURL)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await openClientContact('phone', '11999991234');
    expect(Linking.openURL).toHaveBeenCalledWith('tel:11999991234');
    await expect(openClientContact('email', 'a@example.com')).rejects.toThrow(
      'CONTACT_UNAVAILABLE',
    );
  });
});
