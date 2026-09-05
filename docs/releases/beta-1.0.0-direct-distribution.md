# Beta 1.0.0 — distribuição direta

## Build aprovado

- Data: 5 de setembro de 2026
- Versão: `1.0.0`
- Android `versionCode`: `1`
- Commit: `261a3a2a3b690104733b6ac85b77bff64380e6fc`
- Application ID: `com.anonymous.resolvemei`
- Scheme: `resolvemei://`
- Artefato: `Tavi-beta-1.0.0-build1-261a3a2.apk`
- SHA-256: `567CBCD8187632DE0C3212427AC7641113DB95629CDD271F9F257E3D278E345E`

Este APK foi aprovado exclusivamente para distribuição direta aos testadores
beta, fora da Google Play.

## Pendência bloqueante para publicação na Google Play

O APK desta rodada é uma variante `release`, mas está assinado com o
certificado Android Debug configurado no projeto. Antes de qualquer publicação
na Google Play, será obrigatório:

1. gerar e custodiar uma chave de release definitiva;
2. configurar o build de produção para usar essa chave;
3. validar a assinatura do artefato final antes do envio à loja.

Como o certificado definitivo será diferente do certificado usado neste beta,
o Android não aceitará a instalação como atualização do APK atual. Os
testadores desta rodada precisarão desinstalar o aplicativo e instalar novamente
a versão assinada para produção. A desinstalação apaga dados mantidos apenas no
dispositivo; qualquer dado local que ainda não tenha sido sincronizado deverá
ser sincronizado ou exportado antes da migração.

## Pendências de QA não bloqueantes para este beta

- Corrigir três testes estruturais que falham por dependerem da indentação
  textual exata. Na validação deste build, 514 de 517 testes passaram; as três
  expectativas falhas encontraram o conteúdo funcional correspondente, mas com
  espaçamento diferente.
- Investigar os handles assíncronos que permanecem abertos após a suíte Jest,
  usando `--detectOpenHandles`. O aviso continua na lista geral de QA e não
  bloqueia esta distribuição.
