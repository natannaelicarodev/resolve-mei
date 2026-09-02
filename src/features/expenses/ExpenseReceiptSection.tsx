import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Dialog, InlineFeedback, Text } from '@/components/ui';
import { radii, spacing } from '@/theme';
import { expenseErrorMessage } from './domain';
import { useExpenseReceiptMutations, useExpenseReceipts } from './hooks';

export function ExpenseReceiptSection({
  userId,
  businessId,
  expenseId,
}: {
  userId: string;
  businessId: string;
  expenseId: string;
}) {
  const query = useExpenseReceipts(userId, businessId, expenseId);
  const mutations = useExpenseReceiptMutations(userId, businessId, expenseId);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string>();
  const busy = mutations.upload.isPending || mutations.remove.isPending;
  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
          });
    const asset = !result.canceled ? result.assets[0] : undefined;
    if (asset)
      mutations.upload.mutate(asset, {
        onSuccess: () => setAdding(false),
      });
  }
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.flex} variant="cardTitle">
          Comprovantes
        </Text>
        <Badge label={`${query.data?.length ?? 0}/3`} variant="info" />
      </View>
      {query.data?.map((item) => (
        <View key={item.id} style={styles.receipt}>
          <Image
            accessibilityLabel="Comprovante da despesa"
            source={{ uri: item.signedUrl }}
            style={styles.image}
          />
          <Button
            label="Excluir comprovante"
            onPress={() => setDeleting(item.id)}
            variant="danger"
          />
        </View>
      ))}
      {(query.data?.length ?? 0) < 3 ? (
        <Button
          disabled={busy}
          label="Adicionar comprovante"
          onPress={() => setAdding(true)}
          variant="secondary"
        />
      ) : null}
      {mutations.upload.isError || mutations.remove.isError ? (
        <InlineFeedback
          message={expenseErrorMessage(
            mutations.upload.error ?? mutations.remove.error,
          )}
          variant="error"
        />
      ) : null}
      <Dialog
        description="A imagem será convertida para JPEG e comprimida."
        onClose={() => !busy && setAdding(false)}
        title="Adicionar comprovante"
        visible={adding}
      >
        <Button
          disabled={busy}
          label="Tirar foto"
          loading={mutations.upload.isPending}
          onPress={() => void pick('camera')}
        />
        <Button
          disabled={busy}
          label="Escolher da galeria"
          onPress={() => void pick('library')}
          variant="secondary"
        />
      </Dialog>
      <Dialog
        description="O arquivo será removido permanentemente."
        onClose={() => !busy && setDeleting(undefined)}
        title="Excluir comprovante?"
        visible={Boolean(deleting)}
      >
        <Button
          label="Voltar"
          onPress={() => setDeleting(undefined)}
          variant="ghost"
        />
        <Button
          loading={mutations.remove.isPending}
          label="Excluir"
          onPress={() =>
            deleting &&
            mutations.remove.mutate(deleting, {
              onSuccess: () => setDeleting(undefined),
            })
          }
          variant="danger"
        />
      </Dialog>
    </Card>
  );
}
const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  receipt: { gap: spacing.sm },
  image: { aspectRatio: 4 / 3, borderRadius: radii.medium, width: '100%' },
});
