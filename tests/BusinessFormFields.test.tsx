import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { fireEvent, render } from '@testing-library/react-native';

import { BusinessFormFields } from '@/features/business/BusinessFormFields';
import { validateLogo } from '@/features/business/logo';
import type { BusinessFormData } from '@/features/business/schemas';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/features/business/logo', () => ({ validateLogo: jest.fn() }));

function FieldsHarness() {
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset>();
  const { control, setValue } = useForm<BusinessFormData>({
    defaultValues: {
      businessName: 'Ana Serviços',
      documentType: 'cpf',
      documentNumber: '529.982.247-25',
      professionalPhone: '11999999999',
      email: 'ana@example.com',
      street: 'Rua Um',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01001000',
      pixKey: '',
    },
  });
  return (
    <BusinessFormFields
      control={control}
      currentLogoUrl="https://signed.example/old"
      onLogoSelected={setLogo}
      selectedLogo={logo}
      setValue={setValue}
    />
  );
}

it('rejects an invalid logo and then previews a valid replacement', async () => {
  jest
    .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  const invalid = {
    uri: 'file:///invalid.svg',
    width: 100,
    height: 100,
    mimeType: 'image/svg+xml',
    fileSize: 1000,
  };
  const replacement = {
    uri: 'file:///replacement.webp',
    width: 100,
    height: 100,
    mimeType: 'image/webp',
    fileSize: 1024,
  };
  jest
    .mocked(ImagePicker.launchImageLibraryAsync)
    .mockResolvedValueOnce({ canceled: false, assets: [invalid] })
    .mockResolvedValueOnce({ canceled: false, assets: [replacement] });
  jest.mocked(validateLogo).mockImplementationOnce(() => {
    throw new Error('LOGO_INVALID_TYPE');
  });
  const screen = await render(<FieldsHarness />);

  fireEvent.press(screen.getByRole('button', { name: 'Trocar logotipo' }));
  expect(
    await screen.findByText('Use uma imagem JPEG, PNG ou WebP.'),
  ).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Trocar logotipo' }));
  const preview = await screen.findByLabelText('Logotipo atual do negócio');
  expect(preview.props.source).toEqual({ uri: 'file:///replacement.webp' });
  expect(
    screen.getByText('Imagem selecionada e pronta para envio.'),
  ).toBeTruthy();
  await screen.unmount();
});
