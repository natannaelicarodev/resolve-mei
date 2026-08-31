# Orçamentos

## Exportação em PDF — Fase 1

Esta fase permite visualizar e compartilhar um orçamento salvo como PDF no
Android, plataforma do lançamento inicial. Na web, a mesma ação abre o diálogo nativo do navegador para
visualizar, imprimir ou salvar como PDF. A exportação não altera o status do
orçamento e não implementa envio por WhatsApp, e-mail, link público ou
assinatura.

### Fonte dos dados

- O orçamento e seus itens são recarregados do backend imediatamente antes da
  exportação, com escopo explícito de usuário, negócio e orçamento.
- Nome, contatos e itens do cliente vêm dos snapshots persistidos no orçamento.
- Os dados do emissor vêm do cadastro atual de `businesses`. Como a tabela de
  orçamento ainda não possui snapshot do negócio, uma nova exportação pode
  refletir alterações posteriores no nome, telefone, e-mail ou documento do
  negócio. Essa limitação é intencional nesta fase e não justificou uma
  migração remota.
- Valores monetários permanecem em centavos inteiros. Antes de renderizar, a
  exportação confere totais de itens, subtotal, desconto e total persistidos.
- Datas civis são formatadas diretamente como `DD/MM/AAAA`, sem conversão de
  fuso horário.

O PDF mostra somente informações necessárias à proposta. O documento do
cliente, endereço, PIX, avatar e outros dados privados não são incluídos. O
documento do emissor é exibido apenas quando cadastrado.

### Segurança e ciclo de vida

A sessão é validada antes e depois da leitura. Se usuário, negócio ou orçamento
mudarem durante uma operação, a exportação é descartada. O HTML é controlado,
escapa todo conteúdo inserido por usuário e não carrega imagens, fontes ou URLs
externas.

No Android, o `expo-print` devolve o PDF em Base64 e o app grava
`orcamento-NNNNNN.pdf` diretamente em uma pasta privada autorizada do cache. O
arquivo é removido ao final, inclusive em erro ou cancelamento. A prévia usa o visualizador de
impressão do sistema e não mantém arquivo. No navegador não se tenta
compartilhar uma URI local, pois esse fluxo não é suportado de forma confiável.

### Verificação manual

1. Entre na conta correta e abra um orçamento salvo.
2. Verifique rascunho, enviado, aprovado, recusado, cancelado e vencido.
3. Teste orçamento sem telefone, e-mail, documento, descrição, observação e
   desconto.
4. Teste textos longos, caracteres `<>&"'`, muitos itens e valores altos.
5. Confirme cabeçalho, tabela repetida, totais, rodapé e paginação em A4.
6. Use **Visualizar PDF** e cancele o visualizador; a tela deve continuar
   utilizável e o status não deve mudar.
7. Use **Compartilhar PDF** no Android; cancele e repita a operação.
8. Na web, use **Salvar ou imprimir PDF** e salve pelo diálogo do navegador.
9. Troque de conta durante uma leitura lenta; nenhum PDF da sessão anterior
   deve ser apresentado.

### Dependências

- `expo-print`: renderização e diálogo de impressão compatíveis com Expo 57.
- `expo-sharing`: seletor nativo de compartilhamento no Android e iOS.
- `expo-file-system`: nome previsível, cópia e limpeza do arquivo temporário.

## Próximas fases

A [Fase 2](./phase-2-client-link.md) adiciona link protegido por posse e resposta
do cliente. Fase 3: execução do serviço. Fase 4: recebimentos. Fase 5: agenda e
ações do dia. Fase 6: despesas e resultado. Fase 7: relacionamento e retorno.
Fase 8: IA e integrações.
