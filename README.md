# Monitoramento e Controle SEMED

Aplicação institucional integrada ao Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions e Firebase Hosting.

## Configuração Web

Copie `firebase-config.example.js` para `firebase-config.js` e informe os valores do aplicativo Web exibidos no Firebase Console. O arquivo real é ignorado pelo Git.

Ative no Console:

- Authentication com provedor E-mail/Senha;
- Cloud Firestore;
- Cloud Storage;
- Firebase Hosting;
- Cloud Functions.

## Administrador inicial

Crie o primeiro usuário no Firebase Authentication e um documento `users/{UID}` no Firestore:

```json
{
  "fullName": "Administrador SEMED",
  "email": "seu-email@dominio.gov.br",
  "role": "administrador",
  "active": true
}
```

## GitHub Actions Secrets

Configure em **Settings > Secrets and variables > Actions**:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_API_KEY`
- `FIREBASE_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`

`FIREBASE_SERVICE_ACCOUNT` deve receber o conteúdo JSON completo da conta de serviço, nunca um caminho do Windows.
