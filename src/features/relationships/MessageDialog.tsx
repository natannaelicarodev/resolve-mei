import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  InlineFeedback,
  Input,
  SegmentedControl,
} from '@/components/ui';
import {
  relationshipMessage,
  relationshipTemplates,
  whatsappMessageUrl,
} from './domain';
import { spacing } from '@/theme';
export function MessageDialog({
  visible,
  onClose,
  clientName,
  businessName,
  lastCompletedAt,
  phone,
}: {
  visible: boolean;
  onClose: () => void;
  clientName: string;
  businessName: string;
  lastCompletedAt: string;
  phone: string | null;
}) {
  const values = { clientName, businessName, lastCompletedAt };
  const [template, setTemplate] = useState<
    (typeof relationshipTemplates)[number]['id']
  >(relationshipTemplates[0].id);
  const [message, setMessage] = useState(() =>
    relationshipMessage(relationshipTemplates[0].text, values),
  );
  const [feedback, setFeedback] = useState('');
  const open = async () => {
    try {
      if (!phone) throw new Error();
      await Linking.openURL(whatsappMessageUrl(phone, message));
    } catch {
      setFeedback('Não foi possível abrir o WhatsApp para este telefone.');
    }
  };
  return (
    <Dialog
      visible={visible}
      title="Mensagem para o cliente"
      description="Revise o texto. Nada será enviado automaticamente."
      onClose={onClose}
    >
      <SegmentedControl
        label="Modelo"
        scrollable
        value={template}
        options={relationshipTemplates.map((x) => ({
          label: x.label,
          value: x.id,
        }))}
        onChange={(id) => {
          setTemplate(id);
          const item =
            relationshipTemplates.find((x) => x.id === id) ??
            relationshipTemplates[0];
          setMessage(relationshipMessage(item.text, values));
          setFeedback('');
        }}
      />
      <Input
        label="Mensagem"
        multiline
        maxLength={1000}
        showCounter
        value={message}
        onChangeText={setMessage}
        style={styles.input}
      />
      {feedback ? <InlineFeedback variant="error" message={feedback} /> : null}
      <View style={styles.actions}>
        <Button
          label="Copiar"
          variant="secondary"
          onPress={() =>
            void Clipboard.setStringAsync(message).then(() => setFeedback(''))
          }
        />
        <Button
          label="Abrir WhatsApp"
          disabled={!phone || !message.trim()}
          onPress={() => void open()}
        />
      </View>
    </Dialog>
  );
}
const styles = StyleSheet.create({
  input: { minHeight: 120, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
