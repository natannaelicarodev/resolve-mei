import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Controller, useController, useWatch } from 'react-hook-form';
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { Image, StyleSheet, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { Button, Card, Input, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { formatDocument } from '@/utils/documents';
import { validateLogo } from './logo';
import type { BusinessFormData } from './schemas';

interface BusinessFormFieldsProps {
  control: Control<BusinessFormData>;
  setValue: UseFormSetValue<BusinessFormData>;
  selectedLogo?: ImagePicker.ImagePickerAsset;
  currentLogoUrl?: string;
  disabled?: boolean;
  onLogoSelected: (logo: ImagePicker.ImagePickerAsset) => void;
}

interface BusinessFieldProps {
  control: Control<BusinessFormData>;
  name: FieldPath<BusinessFormData>;
  label: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

function BusinessField({ control, name, label, ...props }: BusinessFieldProps) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Input
      {...props}
      error={fieldState.error?.message}
      label={label}
      onBlur={field.onBlur}
      onChangeText={field.onChange}
      value={field.value}
    />
  );
}

export function BusinessFormFields({
  control,
  setValue,
  selectedLogo,
  currentLogoUrl,
  disabled = false,
  onLogoSelected,
}: BusinessFormFieldsProps) {
  const [logoError, setLogoError] = useState<string>();
  const documentType = useWatch({ control, name: 'documentType' });
  const logoUri = selectedLogo?.uri ?? currentLogoUrl;

  const pickLogo = async () => {
    setLogoError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setLogoError('Permita o acesso às fotos para escolher um logotipo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    try {
      validateLogo(asset);
      onLogoSelected(asset);
    } catch (error) {
      setLogoError(
        error instanceof Error && error.message === 'LOGO_INVALID_SIZE'
          ? 'O logotipo deve ter no máximo 5 MB.'
          : 'Use uma imagem JPEG, PNG ou WebP.',
      );
    }
  };

  return (
    <>
      <Card>
        <Text variant="label">Negócio</Text>
        <BusinessField
          control={control}
          label="Nome do negócio"
          name="businessName"
        />
        <Text variant="label">Tipo de documento</Text>
        <View accessibilityRole="radiogroup" style={styles.segment}>
          <Button
            accessibilityRole="radio"
            accessibilityState={{ checked: documentType === 'cpf' }}
            disabled={disabled}
            label="CPF"
            onPress={() => {
              setValue('documentType', 'cpf');
              setValue('documentNumber', '');
            }}
            variant={documentType === 'cpf' ? 'primary' : 'secondary'}
          />
          <Button
            accessibilityRole="radio"
            accessibilityState={{ checked: documentType === 'cnpj' }}
            disabled={disabled}
            label="CNPJ"
            onPress={() => {
              setValue('documentType', 'cnpj');
              setValue('documentNumber', '');
            }}
            variant={documentType === 'cnpj' ? 'primary' : 'secondary'}
          />
        </View>
        <Controller
          control={control}
          name="documentNumber"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              keyboardType="number-pad"
              label={documentType.toUpperCase()}
              maxLength={documentType === 'cpf' ? 14 : 18}
              onBlur={field.onBlur}
              onChangeText={(value) =>
                field.onChange(formatDocument(value, documentType))
              }
              value={field.value}
            />
          )}
        />
        <BusinessField
          control={control}
          keyboardType="phone-pad"
          label="Telefone profissional"
          name="professionalPhone"
        />
        <BusinessField
          autoCapitalize="none"
          control={control}
          keyboardType="email-address"
          label="E-mail profissional"
          name="email"
        />
      </Card>
      <Card>
        <Text variant="label">Endereço</Text>
        <BusinessField control={control} label="Rua" name="street" />
        <BusinessField control={control} label="Número" name="number" />
        <BusinessField
          control={control}
          label="Complemento (opcional)"
          name="complement"
        />
        <BusinessField control={control} label="Bairro" name="neighborhood" />
        <BusinessField control={control} label="Cidade" name="city" />
        <BusinessField
          autoCapitalize="characters"
          control={control}
          label="Estado (UF)"
          maxLength={2}
          name="state"
        />
        <BusinessField
          control={control}
          keyboardType="number-pad"
          label="CEP"
          maxLength={9}
          name="postalCode"
        />
      </Card>
      <Card>
        <Text variant="label">Dados opcionais</Text>
        <BusinessField control={control} label="Chave Pix" name="pixKey" />
        {logoUri ? (
          <Image
            accessibilityLabel="Logotipo atual do negócio"
            source={{ uri: logoUri }}
            style={styles.logo}
          />
        ) : null}
        <Button
          disabled={disabled}
          label={logoUri ? 'Trocar logotipo' : 'Escolher logotipo'}
          onPress={() => void pickLogo()}
          variant="secondary"
        />
        {selectedLogo ? (
          <Text variant="caption">Imagem selecionada e pronta para envio.</Text>
        ) : !logoUri ? (
          <Text variant="caption">Você pode continuar sem logotipo.</Text>
        ) : null}
        {logoError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {logoError}
          </Text>
        ) : null}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: spacing.sm },
  error: { color: colors.danger },
  logo: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: radii.md,
  },
});
