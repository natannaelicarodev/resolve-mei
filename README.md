# ResolveMEI

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

A primeira migration cria `profiles`, `businesses`, constraints, timestamps, trigger de perfil, indices, RLS e politicas por proprietario. A segunda cria/atualiza o bucket privado `business-logos`, limitado a 5 MB e JPEG/PNG/WebP, e restringe objetos a `{user_id}/{arquivo}`.

A terceira migration concede ao papel `authenticated` somente `SELECT`, `INSERT` e `UPDATE` em `profiles` e `businesses`. Grants e RLS atuam em etapas diferentes e sao necessarios conjuntamente: os grants autorizam quais operacoes o papel pode solicitar nas tabelas, enquanto as policies de RLS limitam quais linhas cada usuario autenticado pode acessar. Uma policy permissiva nao substitui o grant da operacao, e um grant nao ignora a RLS habilitada.

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

Clientes, catalogo de servicos, orcamentos, ordens de servico, recibos, cobrancas, Pix operacional, assinaturas, notificacoes, administracao, CI/CD e publicacao permanecem fora desta fase.
