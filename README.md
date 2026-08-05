# Monitoramento e Controle SEMED

Aplicação institucional integrada a um novo projeto Firebase: Authentication, Cloud Firestore, Cloud Storage, Cloud Functions e Firebase Hosting.

## Configuração do novo projeto

O aplicativo está vinculado ao projeto `semed-gestao`. O deploy exige somente o GitHub Actions Repository Secret `FIREBASE_SERVICE_ACCOUNT_SEMED_GESTAO`, contendo o JSON integral de uma nova conta de serviço desse mesmo projeto — nunca um caminho local.

O procedimento completo está em [CONFIGURACAO_FIREBASE.md](CONFIGURACAO_FIREBASE.md).

## Configuração local

Copie `firebase-config.example.js` para `firebase-config.js` e preencha os valores exibidos em **Firebase Console > Configurações do projeto > Geral > Seus aplicativos**. O arquivo com valores reais é ignorado pelo Git.

## Implantação

O workflow `.github/workflows/firebase-hosting.yml` é executado em push para `main` ou manualmente. Antes de publicar, ele valida se todos os dados e a chave privada pertencem ao novo projeto.
