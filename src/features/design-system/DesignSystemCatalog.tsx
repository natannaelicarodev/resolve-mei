import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import {
  FadeInView,
  StepTransition,
  SuccessTransition,
  useReducedMotion,
} from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  IconButton,
  InlineFeedback,
  Input,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
} from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

const swatches = [
  ['Fundo', colors.background],
  ['Superfície', colors.surface],
  ['Grafite', colors.textPrimary],
  ['Verde', colors.primary],
  ['Azul', colors.secondary],
  ['Amarelo', colors.accent],
  ['Coral', colors.accentCoral],
] as const;

function Section({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text variant="sectionTitle">{title}</Text>
      {children}
    </View>
  );
}

export function DesignSystemCatalog() {
  const [step, setStep] = useState(1);
  const [haptics, setHaptics] = useState(isHapticsEnabled());
  const reducedMotion = useReducedMotion();
  const toggleHaptics = (value: boolean) => {
    setHaptics(value);
    setHapticsEnabled(value);
  };

  return (
    <Screen background="subtle">
      <FadeInView>
        <Text variant="pageTitle">Fundação ResolveMEI</Text>
        <Text color="textSecondary">Catálogo técnico com dados fictícios.</Text>
      </FadeInView>

      <Section title="Cores">
        <View style={styles.wrap}>
          {swatches.map(([label, value]) => (
            <View key={label} style={styles.swatchItem}>
              <View
                accessibilityLabel={`${label}: ${value}`}
                style={[styles.swatch, { backgroundColor: value }]}
              />
              <Text variant="caption">{label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Tipografia">
        <Text variant="display">Trabalho simples</Text>
        <Text variant="pageTitle">Título de página</Text>
        <Text variant="sectionTitle">Título de seção</Text>
        <Text variant="cardTitle">Título de card</Text>
        <Text>Corpo confortável em português.</Text>
        <Text variant="bodySecondary">Corpo secundário para contexto.</Text>
        <Text variant="financial">R$ 1.240,00</Text>
      </Section>

      <Section title="Espaçamento e raios">
        <View style={styles.spacingRow}>
          {[4, 8, 12, 16, 24, 32].map((size) => (
            <View
              key={size}
              style={[styles.spaceBlock, { height: size, width: size }]}
            />
          ))}
        </View>
        <View style={styles.radiusRow}>
          {Object.entries({
            pequeno: radii.small,
            médio: radii.medium,
            grande: radii.large,
            card: radii.card,
          }).map(([label, radius]) => (
            <View
              key={label}
              style={[styles.radiusBlock, { borderRadius: radius }]}
            >
              <Text variant="caption">{label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Botões">
        <Button label="Ação principal" haptic="selection" />
        <Button label="Ação secundária" variant="secondary" />
        <Button label="Ação discreta" variant="ghost" />
        <Button label="Excluir" variant="danger" />
        <Button label="Carregando" loading />
        <Button label="Concluído" state="success" />
        <Button disabled label="Indisponível" />
      </Section>

      <Section title="Campos">
        <Input
          helperText="Mensagem de ajuda persistente."
          label="Normal"
          placeholder="Digite aqui"
        />
        <Input label="Preenchido" value="Cliente exemplo" />
        <Input
          error="Revise esta informação."
          label="Com erro"
          value="Valor inválido"
        />
        <Input editable={false} label="Desabilitado" value="Sem edição" />
        <Input label="Somente leitura" readOnly value="Informação fixa" />
        <Input
          label="Com contador"
          maxLength={40}
          showCounter
          value="Descrição curta"
        />
      </Section>

      <Section title="Cards">
        <Card>
          <Text variant="cardTitle">Padrão</Text>
          <Text variant="bodySecondary">
            Informação agrupada sem excesso visual.
          </Text>
        </Card>
        <Card variant="elevated">
          <Text variant="cardTitle">Elevado</Text>
        </Card>
        <Card
          accessibilityLabel="Abrir cliente fictício"
          onPress={() => void triggerHaptic('selection')}
          variant="interactive"
        >
          <Text variant="cardTitle">Interativo</Text>
        </Card>
        <Card variant="highlighted">
          <Text variant="cardTitle">Destaque</Text>
        </Card>
        <Card variant="success">
          <Text>Pagamento confirmado</Text>
        </Card>
        <Card variant="warning">
          <Text>Documento pendente</Text>
        </Card>
        <Card variant="danger">
          <Text>Falha no envio</Text>
        </Card>
      </Section>

      <Section title="Status e feedback">
        <View style={styles.wrap}>
          <Badge label="Ativo" variant="success" />
          <Badge label="Pendente" variant="warning" />
          <Badge label="Falhou" variant="danger" />
          <Badge label="Novo" variant="info" />
        </View>
        <InlineFeedback
          message="As alterações foram salvas."
          variant="success"
        />
        <InlineFeedback
          message="Confira os campos destacados."
          variant="error"
        />
        <InlineFeedback
          message="O vencimento está próximo."
          variant="warning"
        />
        <InlineFeedback
          message="Este é um ambiente de demonstração."
          variant="info"
        />
      </Section>

      <Section title="Carregamento">
        <Skeleton height={20} width="60%" />
        <Skeleton height={72} />
        <Skeleton height={44} width={120} />
      </Section>

      <Section title="Animações">
        <Text variant="bodySecondary">
          Movimento reduzido do sistema: {reducedMotion ? 'ativo' : 'inativo'}
        </Text>
        <StepTransition direction={step === 1 ? 'back' : 'forward'} step={step}>
          <Card variant="highlighted">
            <Text variant="cardTitle">Etapa {step}</Text>
            <Text>Container estável para fluxos curtos.</Text>
          </Card>
        </StepTransition>
        <Button
          label="Alternar etapa"
          onPress={() => setStep((current) => (current === 1 ? 2 : 1))}
          variant="secondary"
        />
        <SuccessTransition
          haptic={false}
          message="Serviço salvo com sucesso."
        />
      </Section>

      <Section title="Haptics">
        <View style={styles.toggle}>
          <Text variant="label">Feedback tátil</Text>
          <Switch
            accessibilityLabel="Ativar feedback tátil"
            onValueChange={toggleHaptics}
            value={haptics}
          />
        </View>
        <View style={styles.wrap}>
          <Button
            label="Seleção"
            onPress={() => void triggerHaptic('selection')}
            size="small"
            variant="secondary"
          />
          <Button
            label="Sucesso"
            onPress={() => void triggerHaptic('success')}
            size="small"
          />
          <IconButton
            accessibilityLabel="Testar confirmação tátil"
            icon={<Text>✓</Text>}
            onPress={() => void triggerHaptic('success')}
          />
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatchItem: { gap: spacing.xs, width: 72 },
  swatch: {
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    height: 52,
    width: 72,
  },
  spacingRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 40,
  },
  spaceBlock: { backgroundColor: colors.secondary },
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radiusBlock: {
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    height: 64,
    justifyContent: 'center',
    width: 76,
  },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
});
