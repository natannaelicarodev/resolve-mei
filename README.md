# Tavi

## Design system

A fundação visual, critérios de componentes e padrões de acessibilidade estão documentados em [`docs/design-system/README.md`](docs/design-system/README.md). Em desenvolvimento, o catálogo técnico está disponível na rota `/design-system`.

Aplicativo mobile para profissionais autonomos, construido com Expo SDK 57, React Native, TypeScript estrito e Supabase hospedado. A Fase 2 inclui autenticacao, perfil profissional, onboarding e logotipo privado. Funcionalidades comerciais ainda nao fazem parte desta etapa.

## Requisitos no Windows

- Windows 10 ou 11.
- Node.js 22.13 ou superior.
- Git e pnpm 11 via Corepack.
- Android Studio com emulador, ou aparelho Android com Expo Go/development build.
- Um projeto hospedado no Supabase.

```powershell
corepack enable
corepack install
pnpm install
```

O simulador iOS e a compilacao nativa para iOS exigem macOS com Xcode.

## Ambiente

Crie `.env` a partir de `.env.example`:

```powershell
Copy-Item .env.example .env
```

Defina somente:

```dotenv
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

O nome da chave deve ser exatamente `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Variaveis `EXPO_PUBLIC_` ficam visiveis no bundle; use apenas a Project URL e a Publishable Key. Nunca use `service_role`, secret key, senha do banco ou connection string no aplicativo. Segredos futuros deverao permanecer em um backend.

## Migrations

As migrations nao sao aplicadas automaticamente e nao exigem Docker ou senha do banco. No Dashboard do Supabase, abra **SQL Editor**, crie uma nova consulta para cada arquivo e execute nesta ordem:

1. `supabase/migrations/202608250001_auth_profiles_businesses.sql`
2. `supabase/migrations/202608250002_business_logos_storage.sql`
3. `supabase/migrations/202608260003_authenticated_table_grants.sql`
4. `supabase/migrations/202608260004_clients.sql`
5. `supabase/migrations/202608260005_profile_avatars.sql`
6. `supabase/migrations/202608260006_services.sql`

Antes de validar a personalização do onboarding, aplique também
`supabase/migrations/202609040001_onboarding_personalization.sql`. Ela adiciona
a prioridade escolhida e o controle de consumo do destaque temporário da Home.

A primeira migration cria `profiles`, `businesses`, constraints, timestamps, trigger de perfil, indices, RLS e politicas por proprietario. A segunda cria/atualiza o bucket privado `business-logos`, limitado a 5 MB e JPEG/PNG/WebP, e restringe objetos a `{user_id}/{arquivo}`.

A terceira migration concede ao papel `authenticated` somente `SELECT`, `INSERT` e `UPDATE` em `profiles` e `businesses`. Grants e RLS atuam em etapas diferentes e sao necessarios conjuntamente: os grants autorizam quais operacoes o papel pode solicitar nas tabelas, enquanto as policies de RLS limitam quais linhas cada usuario autenticado pode acessar. Uma policy permissiva nao substitui o grant da operacao, e um grant nao ignora a RLS habilitada.

A quarta migration cria o cadastro de clientes. Ela concede somente `SELECT`, `INSERT` e `UPDATE` ao papel autenticado e usa RLS para vincular cada linha ao proprietario do negocio. A ausência de `DELETE` é intencional: clientes deixam de aparecer como ativos por alteração de status, sem exclusão física. Documentos opcionais são únicos por negócio quando informados.

A quinta migration adiciona `profiles.avatar_path` e cria o bucket privado `avatars`, limitado a 5 MB e JPEG/PNG/WebP. As policies isolam cada usuário na pasta `{user_id}/{arquivo}`. A foto pessoal não utiliza `businesses.logo_path`; referências antigas nesse campo não são copiadas automaticamente, pois não é seguro presumir que todo logotipo empresarial represente a pessoa.

A sexta migration cria o catálogo de serviços com preços inteiros em centavos, duração opcional e nome único por negócio sem diferenciar maiúsculas de minúsculas. O papel `authenticated` recebe somente `SELECT`, `INSERT` e atualização das colunas editáveis. A RLS valida a propriedade do negócio em todas as operações; não existe grant ou policy de `DELETE`, e `business_id` não pode ser atualizado pelo aplicativo.

As ações de WhatsApp consideram telefones brasileiros normalizados com DDD e acrescentam o código do país `55` somente ao abrir o link. O número persistido continua nacional, com 10 ou 11 dígitos.

Nao execute novamente uma migration ja registrada sem revisar o historico do projeto. Os arquivos nao usam operacoes destrutivas para mascarar conflitos.

## Configuracao do Supabase

Em **Authentication > Providers > Email**:

- mantenha Email habilitado;
- habilite **Confirm email** para exigir confirmacao antes do primeiro login;
- configure um provedor SMTP antes de uso real; o SMTP padrao serve apenas para desenvolvimento limitado.

Em **Authentication > URL Configuration**, mantenha uma Site URL apropriada ao ambiente e adicione em **Redirect URLs**:

```text
resolvemei://auth-callback
http://localhost:8081/auth-callback
```

O primeiro endereco atende development builds e builds nativos com scheme `resolvemei`. O segundo atende a validacao web local. URLs `exp://` do Expo Go mudam conforme maquina e rede e nao devem ser usadas como callback estavel. Para testar recuperacao nativa de forma confiavel, gere/instale um development build apos configurar o scheme.

O callback aceita o fluxo PKCE por `code` e o formato legado de tokens, estabelece a sessao sem exibir os parametros e encaminha recuperacoes para a tela de nova senha.

## Execucao

```powershell
pnpm dev
pnpm android
pnpm web
```

`pnpm android` requer emulador ativo ou aparelho conectado. Alteracoes no plugin do ImagePicker ou no scheme exigem reconstruir o app nativo; o Expo Go possui scheme e comportamento de deep link proprios.

## Teste manual

Cadastro e login:

1. Crie uma conta com nome, e-mail e senha forte.
2. Confirme o e-mail recebido, se a opcao estiver habilitada.
3. Entre e conclua o onboarding.
4. Feche e reabra o app para confirmar a sessao persistente.
5. Use Configuracoes para sair e confirme o bloqueio das rotas internas.

Isolamento entre usuarios:

1. Crie dois usuarios distintos e conclua o onboarding de ambos.
2. Entre alternadamente em cada conta.
3. Confirme que cada conta ve apenas seu perfil, negocio e logotipo.
4. No Table Editor e Storage, confirme que os registros possuem proprietarios/pastas diferentes. Nao desative RLS durante o teste.

Troca segura de contas:

1. Entre na conta A e confirme nome, telefone, avatar, clientes e serviços.
2. Saia e confirme que a tela pública substitui a navegação protegida.
3. Entre na conta B, preferencialmente com conexão lenta, e confirme que nenhum dado da conta A aparece durante o carregamento.
4. Confirme o fallback quando B não possuir avatar, telefone, negócio, clientes ou serviços.
5. Volte para A e confirme que somente os dados de A são carregados.
6. Feche e reabra o aplicativo autenticado em cada conta e repita a verificação.

Recuperacao de senha:

1. Na tela de login, escolha **Esqueci minha senha**.
2. Abra o e-mail no dispositivo com o app instalado.
3. Confirme que `resolvemei://auth-callback` abre a tela de nova senha.
4. Defina a senha e confirme que o mesmo link nao reutiliza o estado temporario.

## Qualidade

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm doctor
```

Os testes usam Jest, `jest-expo`, React Native Testing Library e mocks locais do Supabase. Nenhum teste acessa o projeto hospedado.

## Problemas comuns

- Variavel ausente: confira o nome `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e reinicie o Metro com `pnpm exec expo start --clear`.
- `Invalid login credentials`: use mensagem generica na interface e confirme e-mail/senha no painel apenas durante diagnostico autorizado.
- Perfil nao criado: verifique se a primeira migration foi aplicada e consulte os logs de Auth/Postgres no Dashboard.
- Upload negado: confirme a segunda migration, arquivo menor ou igual a 5 MB e tipo JPEG, PNG ou WebP.
- Link abre o navegador: instale um development build com o scheme e confira a allowlist de redirects.
- Limite de e-mails: configure SMTP no painel; o provedor padrao do Supabase possui limites de desenvolvimento.

## Escopo futuro

Orçamentos, ordens de serviço, recibos, cobranças, Pix operacional, assinaturas, notificações, administração, CI/CD e publicação permanecem fora desta fase.

# Teste manual - Fase 3, Etapa 3 (Orçamentos)

Antes do teste, aplique manualmente `supabase/migrations/202608260007_quotes.sql` no SQL Editor. Não use `service_role` no aplicativo.

1. Entre na conta A e confirme que existe um negócio concluído.
2. Crie um cliente e um serviço ativos.
3. Crie um orçamento com dois serviços e um item personalizado.
4. Ajuste quantidade, valor, desconto, validade e observações.
5. Salve como rascunho, reabra e edite.
6. Marque como enviado, aprove e confirme que a edição desapareceu.
7. Duplique e confirme novo número e status Rascunho.
8. Pesquise por número e cliente, filtre por status e teste mais de 20 registros.
9. Saia da conta A, entre na B e confirme que lista, formulário e métricas de A não aparecem.
10. Crie um orçamento diferente em B, volte para A e confirme o isolamento.
11. Repita com conexão lenta, campos vazios, logout durante salvamento e reinício completo do aplicativo.
