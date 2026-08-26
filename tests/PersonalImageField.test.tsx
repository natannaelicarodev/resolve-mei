import * as ImagePicker from 'expo-image-picker';
import { fireEvent, render } from '@testing-library/react-native';

import { PersonalImageField } from '@/features/profile/PersonalImageField';
import { validateAvatar } from '@/features/profile/avatar';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/features/profile/avatar', () => ({ validateAvatar: jest.fn() }));

const asset = {
  uri: 'file:///private/photo.png',
  width: 100,
  height: 100,
  mimeType: 'image/png',
  fileSize: 1024,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
});

it('shows the name fallback and selects a valid personal photo', async () => {
  jest
    .mocked(ImagePicker.launchImageLibraryAsync)
    .mockResolvedValue({ canceled: false, assets: [asset] });
  const onSelected = jest.fn();
  const screen = await render(
    <PersonalImageField fallbackInitial="A" onSelected={onSelected} />,
  );
  expect(screen.getByTestId('personal-image-fallback')).toBeTruthy();
  expect(screen.getByText('A')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
  expect(validateAvatar).toHaveBeenCalledWith(asset);
  expect(onSelected).toHaveBeenCalledWith(asset);
});

it.each([
  ['AVATAR_INVALID_SIZE', 'A foto deve ter no máximo 5 MB.'],
  ['AVATAR_INVALID_TYPE', 'Escolha uma imagem JPEG, PNG ou WebP.'],
])('shows a safe validation message for %s', async (code, message) => {
  jest
    .mocked(ImagePicker.launchImageLibraryAsync)
    .mockResolvedValue({ canceled: false, assets: [asset] });
  jest.mocked(validateAvatar).mockImplementation(() => {
    throw new Error(code);
  });
  const screen = await render(<PersonalImageField onSelected={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
  expect(await screen.findByText(message)).toBeTruthy();
});

it('uses the replace action when a signed photo exists', async () => {
  const screen = await render(
    <PersonalImageField
      currentUrl="https://signed.example/photo"
      onSelected={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeTruthy();
  expect(screen.getByLabelText('Imagem atual do perfil')).toBeTruthy();
});

it('ignores a pending picker result after unmounting', async () => {
  let resolvePicker: (value: {
    canceled: false;
    assets: [typeof asset];
  }) => void = () => undefined;
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockReturnValue(
    new Promise((resolve) => {
      resolvePicker = resolve;
    }),
  );
  const onSelected = jest.fn();
  const screen = await render(<PersonalImageField onSelected={onSelected} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
  await screen.unmount();
  resolvePicker({ canceled: false, assets: [asset] });
  await Promise.resolve();
  expect(onSelected).not.toHaveBeenCalled();
});
