# Beta 1.0.1 — distribuição direta

## Build gerado

- Data: 6 de setembro de 2026
- Versão: `1.0.1`
- Android `versionCode`: `2`
- Application ID preservado: `com.anonymous.resolvemei`
- Scheme preservado: `resolvemei://`
- Arquitetura: `arm64-v8a`
- Artefato: `Tavi-beta-1.0.1-build2.apk`
- SHA-256: `E6BDC19E08DD53AE635285DE434B3214AEC2C4D6204DBD1720E4E86185EB906F`

Esta atualização conclui a troca reversível do nome visível para Tavi e
usa na autenticação o wordmark aprovado, recolorido pelos tokens do tema. O
application ID, o scheme, os callbacks e as chaves de persistência permanecem
inalterados para permitir a atualização dos aparelhos beta sem apagar dados.

## Verificação

- Gradle `app:assembleRelease`: aprovado.
- Assinatura APK v2: aprovada.
- Suíte Jest: 111 suítes e 522 testes aprovados.
- O aviso de handles assíncronos abertos continua como pendência de QA.

## Assinatura temporária do beta

O APK continua assinado com o mesmo certificado Android Debug usado na rodada
anterior. Antes da publicação na Google Play será necessário adotar uma chave
de release definitiva; nessa mudança, os testadores precisarão desinstalar e
reinstalar o aplicativo.
