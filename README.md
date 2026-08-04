# Monitoramento e Controle SEMED

Aplicação institucional integrada a um novo projeto Firebase: Authentication, Cloud Firestore, Cloud Storage, Cloud Functions e Firebase Hosting.

## Configuração do novo projeto

As credenciais antigas não são utilizadas. O deploy exige estes sete GitHub Actions Secrets:

- `FIREBASE_NEW_PROJECT_ID`
- `FIREBASE_NEW_SERVICE_ACCOUNT`
- `FIREBASE_NEW_API_KEY`
- `FIREBASE_NEW_AUTH_DOMAIN`
- `FIREBASE_NEW_STORAGE_BUCKET`
- `FIREBASE_NEW_APP_ID`
- `FIREBASE_NEW_MESSAGING_SENDER_ID`

Use somente valores pertencentes ao mesmo projeto Firebase. Em `FIREBASE_NEW_SERVICE_ACCOUNT`, cole o JSON integral da nova conta de serviço — nunca um caminho local.

O procedimento completo está em [CONFIGURACAO_FIREBASE.md](CONFIGURACAO_FIREBASE.md).

## Configuração local

Copie `firebase-config.example.js` para `firebase-config.js` e preencha os valores exibidos em **Firebase Console > Configurações do projeto > Geral > Seus aplicativos**. O arquivo com valores reais é ignorado pelo Git.

## Implantação

O workflow `.github/workflows/firebase-hosting.yml` é executado em push para `main` ou manualmente. Antes de publicar, ele valida se todos os dados e a chave privada pertencem ao novo projeto.
