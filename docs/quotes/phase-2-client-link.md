# Fase 2 — link protegido e resposta do cliente

## Escopo

Um proprietário autenticado publica uma versão imutável de um orçamento e
recebe uma única vez um token de alta entropia. O cliente abre uma página web
sem login, consulta o snapshot e registra uma decisão final. A aprovação não
representa pagamento, execução ou assinatura certificada.

O acesso é por posse. A interface deve avisar: “Compartilhe apenas com o
cliente. Quem tiver este link poderá visualizar e responder ao orçamento.” O
nome informado pelo visitante é autodeclarado e não verificado.

## Arquitetura

- `quote_public_links` guarda somente SHA-256 do token, versão, expiração,
  revogação e o snapshot JSONB com campos permitidos.
- `quote_client_decisions` registra uma decisão imutável por publicação.
- `quote_status_events` distingue publicação, resposta do cliente e alteração
  manual.
- `quote_public_rate_limits` aplica limite persistente no PostgreSQL por hash e
  janela, sem coletar IP ou user-agent.
- RPCs `issue_quote_public_link`, `revoke_quote_public_link` e
  `get_quote_public_link_state` exigem proprietário autenticado.
- RPCs `resolve_public_quote` e `respond_public_quote` aceitam `anon`, recebem o
  token no corpo POST e nunca expõem tabelas privadas diretamente.

O token usa 32 bytes de `gen_random_bytes`, codificação base64url e é retornado
somente pela emissão. O aplicativo o mantém apenas em estado efêmero para
copiar/compartilhar. Consultas privadas posteriores retornam metadados, nunca o
token.

## Campos públicos

O snapshot contém somente nome e contato profissional do negócio, nome do
destinatário, número, versão, datas, status publicado, itens, quantidade,
preços, desconto e totais. IDs internos, documentos, endereço, perfil, avatar,
Storage e hashes não entram no DTO.

`quotes.notes` não é publicado: o modelo atual não diferencia observação ao
cliente de nota interna. Uma futura mudança de schema deve criar campos com
semântica explícita antes de expor condições adicionais.

## Validade, versão e concorrência

O vencimento é o menor entre sete dias após a emissão e o fim da validade
comercial em `America/Sao_Paulo`. O servidor valida o prazo em toda consulta e
resposta. Um novo link revoga o anterior sob bloqueio da linha do orçamento.

Publicação incrementa `quotes.shared_version`. Alterações de termos revogam o
link ativo e avançam a versão. A resposta bloqueia link e orçamento na mesma
transação, compara a versão, cria a decisão única e atualiza o status. A
primeira decisão válida vence; retries retornam o estado já registrado.

## Ameaças e proteções

- Enumeração: token aleatório de 256 bits; número/UUID nunca autoriza acesso.
- Vazamento: hash em repouso; fragmento de URL; `Referrer-Policy: no-referrer`;
  sem analytics ou recursos externos; respostas `no-store` quando houver
  camada HTTP dedicada.
- XSS: React trata conteúdo como texto; não há `dangerouslySetInnerHTML`.
- Clickjacking: a hospedagem futura deve enviar `frame-ancestors 'none'` e
  `X-Frame-Options: DENY`.
- Abuso: limite persistente por hash e janela. CORS deve ser restrito na camada
  de hospedagem, sem ser tratado como autenticação.
- Isolamento: ações privadas validam `auth.uid()` no servidor; callbacks e
  tokens efêmeros são descartados quando usuário, negócio ou orçamento mudam.

## Configuração pendente para publicação

Definir `EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL` com a origem HTTPS da página pública,
sem fragmento ou segredo. Exemplo de formato: `https://dominio.example/q`.
Nenhuma URL de desenvolvimento deve ser apresentada ao cliente como produção.

Antes do deploy: aplicar migrations em ambiente homologado, configurar headers
`Cache-Control: no-store`, CSP, `Referrer-Policy: no-referrer`, `X-Robots-Tag:
noindex, nofollow`, CORS restrito e testar RLS/concorrência com duas contas. Não
há service role no app ou na página pública.

## Roteiro manual de homologação

1. Em ambiente local ou de homologação, aplique a migration e configure uma
   URL HTTPS própria em `EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL`.
2. Na conta A, abra um rascunho e confirme a publicação. Copie o link e confira
   que o orçamento passou para `sent` e que o token não reaparece após recarregar.
3. Abra o link em janela anônima, confira valores, validade e versão. Aprove ou
   rejeite com nome e, opcionalmente, motivo. Reenvie a mesma resposta para
   validar idempotência.
4. Volte à conta A, atualize o detalhe e a Home e confira status, nome
   autodeclarado, data e origem `client_link`.
5. Gere um novo link e confirme que o anterior fica indisponível. Repita com
   revogação manual e com alteração de item, desconto ou validade.
6. Abra o mesmo link em duas janelas e envie decisões concorrentes: somente a
   primeira deve prevalecer e a outra deve receber o estado final coerente.
7. Na conta B, tente consultar e revogar o link da conta A; ambas as operações
   privadas devem falhar sem revelar metadados.
8. Teste token inválido, expirado e muitas tentativas seguidas. A resposta
   pública deve continuar genérica, sem distinguir inexistente de revogado.
9. Use nomes e motivos com caracteres HTML para confirmar que aparecem apenas
   como texto. Inspecione rede, histórico, logs e analytics para confirmar que o
   token não sai do fragmento nem é registrado.

## Fora do escopo

PDF público, OTP, assinatura certificada, pagamentos, execução, agenda,
cobranças e automações de WhatsApp permanecem nas fases posteriores.
