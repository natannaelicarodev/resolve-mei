import { updateMyProfile } from '@/features/profile/api';
import { removeAvatar, uploadAvatar } from '@/features/profile/avatar';
import { supabase } from '@/lib/supabase';

jest.mock('@/features/profile/avatar', () => ({
  uploadAvatar: jest.fn(),
  removeAvatar: jest.fn(),
}));
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const input = { fullName: ' Ana Silva ', phone: '(11) 99999-9999' };
const image = {
  uri: 'file:///private/avatar.png',
  width: 100,
  height: 100,
  mimeType: 'image/png',
  fileSize: 1024,
};

function configure(error: Error | null) {
  const single = jest.fn().mockResolvedValue({
    data: {
      id: 'user-1',
      full_name: 'Ana Silva',
      phone: '11999999999',
      avatar_path: 'user-1/new.png',
    },
    error,
  });
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn((_values: unknown) => ({ eq }));
  jest.mocked(supabase.from).mockReturnValue({ update } as never);
  return { update, eq };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(removeAvatar).mockResolvedValue();
});

it('persists the personal image only in profiles.avatar_path', async () => {
  jest.mocked(uploadAvatar).mockResolvedValue('user-1/new.png');
  const chain = configure(null);
  await updateMyProfile('user-1', input, 'user-1/old.png', image);
  expect(supabase.from).toHaveBeenCalledWith('profiles');
  expect(chain.update).toHaveBeenCalledWith({
    full_name: 'Ana Silva',
    phone: '11999999999',
    avatar_path: 'user-1/new.png',
  });
  expect(chain.update.mock.calls[0]?.[0]).not.toHaveProperty('logo_path');
  expect(removeAvatar).toHaveBeenCalledWith('user-1/old.png');
});

it('removes the new upload and preserves the old one when the database fails', async () => {
  jest.mocked(uploadAvatar).mockResolvedValue('user-1/new.png');
  configure(new Error('database failed'));
  await expect(
    updateMyProfile('user-1', input, 'user-1/old.png', image),
  ).rejects.toThrow('database failed');
  expect(removeAvatar).toHaveBeenCalledWith('user-1/new.png');
  expect(removeAvatar).not.toHaveBeenCalledWith('user-1/old.png');
});

it('keeps the photo optional when only personal text changes', async () => {
  const chain = configure(null);
  await updateMyProfile('user-1', input, null);
  expect(uploadAvatar).not.toHaveBeenCalled();
  expect(chain.update.mock.calls[0]?.[0]).not.toHaveProperty('avatar_path');
});
