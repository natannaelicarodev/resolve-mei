import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button, InlineFeedback, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';
import { validateAvatar } from './avatar';

export function PersonalImageField({
  currentUrl,
  fallbackInitial,
  disabled,
  selected,
  onSelected,
}: {
  currentUrl?: string;
  fallbackInitial?: string;
  disabled?: boolean;
  selected?: ImagePicker.ImagePickerAsset;
  onSelected: (asset: ImagePicker.ImagePickerAsset) => void;
}) {
  const { colors } = useTheme();
  const mounted = useRef(true);
  const [error, setError] = useState<string>();
  const imageUri = selected?.uri ?? currentUrl;
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const pickImage = async () => {
    setError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mounted.current) return;
    if (!permission.granted) {
      setError('Permita o acesso às fotos para escolher uma imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!mounted.current) return;
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      if (!asset) return;
      validateAvatar(asset);
      if (!mounted.current) return;
      onSelected(asset);
    } catch (caught) {
      if (!mounted.current) return;
      setError(
        caught instanceof Error && caught.message === 'AVATAR_INVALID_SIZE'
          ? 'A foto deve ter no máximo 5 MB.'
          : 'Escolha uma imagem JPEG, PNG ou WebP.',
      );
    }
  };
  return (
    <View style={styles.container}>
      <Text variant="label">Imagem do perfil</Text>
      {imageUri ? (
        <Image
          accessibilityLabel="Imagem atual do perfil"
          source={{ uri: imageUri }}
          style={styles.image}
        />
      ) : (
        <View
          accessibilityLabel="Avatar sem foto"
          style={[styles.fallback, { backgroundColor: colors.primarySubtle }]}
          testID="personal-image-fallback"
        >
          <Text color="primary" variant="title">
            {fallbackInitial ?? 'U'}
          </Text>
        </View>
      )}
      <Button
        disabled={disabled}
        label={imageUri ? 'Trocar foto' : 'Adicionar foto'}
        onPress={() => void pickImage()}
        variant="secondary"
      />
      <Text color="textMuted" variant="caption">
        JPEG, PNG ou WebP, com até 5 MB.
      </Text>
      {selected ? (
        <InlineFeedback
          message="Imagem selecionada e pronta para envio."
          variant="success"
        />
      ) : null}
      {error ? <InlineFeedback message={error} variant="error" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  image: {
    alignSelf: 'center',
    borderRadius: radii.circular,
    height: 112,
    width: 112,
  },
  fallback: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.circular,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
});
