import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import {
  FadeInView,
  StepTransition,
  SuccessTransition,
  useReducedMotion,
} from '@/components/motion';
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  CompactCreateButton,
  ConfirmationDialog,
  DateInput,
  EmptyState,
  FloatingAction,
  FormSection,
  IconButton,
  InlineFeedback,
  Input,
  ListContainer,
  ListItem,
  MetricCard,
  MoneyInput,
  Screen,
  SearchInput,
  SegmentedControl,
  Select,
  Skeleton,
  Switch as PatternSwitch,
  Text,
  useToast,
} from '@/components/ui';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
} from '@/lib/haptics';
import { radii, spacing, useTheme } from '@/theme';

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

export function DesignSystemCatalog({
  previewTheme,
}: {
  previewTheme?: 'light' | 'dark';
}) {
  const { colors, preference, setPreference } = useTheme();
  const swatches = [
    ['Fundo', colors.background],
    ['Superfície', colors.surface],
    ['Texto', colors.textPrimary],
    ['Azul Atlântico', colors.primary],
    ['Âmbar', colors.accent],
    ['Sucesso', colors.success],
    ['Aviso', colors.warning],
  ] as const;
  const [step, setStep] = useState(1);
  const [haptics, setHaptics] = useState(isHapticsEnabled());
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [chipSelected, setChipSelected] = useState(true);
  const [checked, setChecked] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (previewTheme) void setPreference(previewTheme);
  }, [previewTheme, setPreference]);
  const toggleHaptics = (value: boolean) => {
    setHaptics(value);
    setHapticsEnabled(value);
  };

  return (
    <Screen background="subtle">
      <FadeInView>
        <Text variant="pageTitle">Fundação Tavi</Text>
        <Text color="textSecondary">Catálogo técnico com dados fictícios.</Text>
      </FadeInView>

      <Section title="Cores">
        <View style={styles.wrap}>
          {swatches.map(([label, value]) => (
            <View key={label} style={styles.swatchItem}>
              <View
                accessibilityLabel={`${label}: ${value}`}
                style={[
                  styles.swatch,
                  { backgroundColor: value, borderColor: colors.borderSubtle },
                ]}
              />
              <Text variant="caption">{label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Tema">
        <SegmentedControl
          label="Tema do catálogo"
          onChange={(value) => void setPreference(value)}
          options={[
            { label: 'Sistema', value: 'system' },
            { label: 'Claro', value: 'light' },
            { label: 'Escuro', value: 'dark' },
          ]}
          value={preference}
        />
      </Section>

      <Section title="Tipografia">
        <Text variant="display">Trabalho simples</Text>
        <Text variant="pageTitle">Título de página</Text>
        <Text variant="sectionTitle">Título de seção</Text>
        <Text variant="cardTitle">Título de card</Text>
        <Text>Corpo confortável em português.</Text>
        <Text variant="bodySmall">Corpo secundário para contexto.</Text>
        <Text variant="financial">R$ 1.240,00</Text>
      </Section>

      <Section title="Espaçamento e raios">
        <View style={styles.spacingRow}>
          {[4, 8, 12, 16, 24, 32].map((size) => (
            <View
              key={size}
              style={[
                styles.spaceBlock,
                {
                  backgroundColor: colors.primary,
                  height: size,
                  width: size,
                },
              ]}
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
              style={[
                styles.radiusBlock,
                { backgroundColor: colors.primarySubtle, borderRadius: radius },
              ]}
            >
              <Text variant="caption">{label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Botões">
        <Button label="Ação principal" haptic="selection" />
        <Button label="Ação secundária" variant="secondary" />
        <Button label="Ação contornada" variant="outline" />
        <Button label="Ação discreta" variant="ghost" />
        <Button label="Ação em texto" variant="link" />
        <Button label="Excluir" variant="danger" />
        <Button label="Carregando" loading />
        <Button label="Concluído" state="success" />
        <Button disabled label="Indisponível" />
      </Section>

      <Section title="Campos">
        <SegmentedControl
          label="Tipo de documento"
          onChange={setDocumentType}
          options={[
            { label: 'CPF', value: 'cpf' },
            { label: 'CNPJ', value: 'cnpj' },
          ]}
          value={documentType}
        />
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
        <SearchInput onChangeText={setSearch} value={search} />
        <MoneyInput label="Valor" placeholder="0,00" />
        <DateInput label="Data" placeholder="00/00/0000" />
        <Select
          label="Categoria"
          onPress={() => undefined}
          placeholder="Selecionar"
        />
        <Checkbox
          checked={checked}
          label="Aceito os termos de uso"
          onChange={setChecked}
        />
        <PatternSwitch
          description="Receba um resumo semanal por e-mail."
          label="Notificações por e-mail"
          onValueChange={setNotifyEnabled}
          value={notifyEnabled}
        />
      </Section>

      <Section title="Cards">
        <Card>
          <Text variant="cardTitle">Padrão</Text>
          <Text variant="bodySmall">
            Informação agrupada sem excesso visual.
          </Text>
        </Card>
        <Card variant="elevated">
          <Text variant="cardTitle">Elevado</Text>
        </Card>
        <Card variant="subtle">
          <Text variant="cardTitle">Sutil</Text>
        </Card>
        <Card variant="summary">
          <Text variant="cardTitle">Resumo operacional</Text>
        </Card>
        <Card variant="selected">
          <Text variant="cardTitle">Selecionado</Text>
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
        <View style={styles.wrap}>
          <MetricCard
            label="Aprovados"
            value="R$ 2.450,00"
            supportingText="6 orçamentos"
          />
          <MetricCard
            label="Em negociação"
            value="R$ 1.280,00"
            supportingText="3 orçamentos"
          />
        </View>
      </Section>

      <Section title="Formulário e ações de lista">
        <FormSection
          description="Agrupamento estrutural para campos relacionados."
          title="Dados do negócio"
        >
          <Input label="Nome fantasia" placeholder="Como você é conhecido" />
        </FormSection>
        <CompactCreateButton
          icon="clientAdd"
          label="Novo cliente"
          onPress={() => void triggerHaptic('selection')}
        />
        <FloatingAction
          icon="quote"
          label="Novo orçamento"
          onPress={() => void triggerHaptic('selection')}
        />
      </Section>

      <Section title="Listas e estados vazios">
        <ListContainer>
          <ListItem
            onPress={() => undefined}
            subtitle="(85) 99999-9999"
            title="Cliente exemplo"
            trailing={<Badge label="Ativo" variant="success" />}
          />
          <ListItem
            onPress={() => undefined}
            subtitle="45 min"
            title="Serviço exemplo"
            trailing={<Text variant="label">R$ 180,00</Text>}
          />
        </ListContainer>
        <EmptyState
          description="Cadastre o primeiro item para começar."
          title="Nada por aqui ainda"
        />
      </Section>

      <Section title="Status e feedback">
        <View style={styles.wrap}>
          <Badge label="Ativo" variant="success" />
          <Badge label="Pendente" variant="warning" />
          <Badge label="Falhou" variant="danger" />
          <Badge label="Novo" variant="info" />
        </View>
        <View style={styles.wrap}>
          <Chip
            label="Todos"
            onPress={() => setChipSelected(false)}
            selected={!chipSelected}
          />
          <Chip
            label="Ativos"
            onPress={() => setChipSelected(true)}
            selected={chipSelected}
          />
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

      <Section title="Toast e confirmação">
        <Button
          label="Mostrar toast"
          onPress={() =>
            showToast({
              message: 'O feedback não bloqueia sua próxima ação.',
              title: 'Alterações salvas',
              variant: 'success',
            })
          }
          variant="secondary"
        />
        <Button
          label="Abrir confirmação"
          onPress={() => setConfirmationVisible(true)}
          variant="outline"
        />
        <ConfirmationDialog
          confirmLabel="Confirmar"
          description="Use este padrão apenas para decisões importantes."
          onCancel={() => setConfirmationVisible(false)}
          onConfirm={() => setConfirmationVisible(false)}
          title="Confirmar ação?"
          visible={confirmationVisible}
        />
        <Button
          label="Abrir bottom sheet"
          onPress={() => setBottomSheetVisible(true)}
          variant="outline"
        />
        <BottomSheet
          description="Gesto de arrastar e snap ajustado ao conteúdo."
          onClose={() => setBottomSheetVisible(false)}
          title="Exemplo de bottom sheet"
          visible={bottomSheetVisible}
        >
          <Text>Conteúdo de exemplo dentro do sheet.</Text>
        </BottomSheet>
      </Section>

      <Section title="Navegação">
        <ProtectedPageHeader back settings title="Título de página" />
        <View style={styles.navPreview}>
          <ProtectedBottomNavigation selected="home" />
        </View>
      </Section>

      <Section title="Animações">
        <Text variant="bodySmall">
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
            icon={<Text>+</Text>}
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
  spaceBlock: {},
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radiusBlock: {
    alignItems: 'center',
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
  navPreview: { borderRadius: radii.large, overflow: 'hidden' },
});
