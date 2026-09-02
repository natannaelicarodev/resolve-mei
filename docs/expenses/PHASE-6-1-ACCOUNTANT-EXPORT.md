# Fase 6.1 — Exportação para contador

## Fonte única

`get_expense_month` retorna totais, despesas por categoria, despesas individuais
e lançamentos financeiros individuais na mesma execução. A tela e os três
arquivos usam essa resposta, evitando divergência entre consultas.

## Arquivos

- `recebimentos-AAAA-MM.csv`: data, orçamento, cliente, forma de pagamento,
  tipo e valor. Estornos são negativos.
- `despesas-AAAA-MM.csv`: data, categoria, descrição, orçamento vinculado e
  valor.
- `resultado-mensal-AAAA-MM.pdf`: negócio, referência, totais, categorias e
  data/hora de geração.

CSV usa UTF-8 com BOM, vírgula, células escapadas e decimal com ponto sem
símbolo monetário. Arquivos vazios preservam o cabeçalho.

No Android/iOS, cada arquivo selecionado abre sequencialmente a folha nativa.
Na web, os CSVs são baixados e o PDF usa impressão/salvamento do navegador.
Sessão e identidade são verificadas antes e depois de cada arquivo; temporários
nativos são removidos após o retorno da folha de compartilhamento.

## Validação manual

1. Aplicar `202609010001_monthly_accountant_export.sql`.
2. Abrir **Resultado**, escolher um mês com movimentação e tocar em **Exportar**.
3. Selecionar os três arquivos e conferir as três folhas sequenciais.
4. Somar recebimentos menos estornos e comparar com **Recebido líquido**.
5. Somar despesas e comparar com **Despesas** e com as categorias do PDF.
6. Confirmar nomes seguros, ponto decimal e ausência de CPF, telefone ou endereço.
7. Repetir em um mês vazio e confirmar CSVs somente com cabeçalho e PDF zerado.
