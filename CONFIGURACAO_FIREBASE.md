# Configuração Firebase — Monitoramento e Controle SEMED

## 1. Serviços que devem ser ativados

No Firebase Console, ative:

1. **Authentication > Sign-in method > E-mail/Senha**;
2. **Cloud Firestore** em modo nativo;
3. **Cloud Storage**;
4. **Firebase Hosting**;
5. **Cloud Functions**.

## 2. Chaves do aplicativo Web

Abra **Configurações do projeto > Geral > Seus aplicativos > Aplicativo Web** e copie estes valores do objeto `firebaseConfig`:

| Chave do Firebase | Uso local | Secret no GitHub |
|---|---|---|
| `apiKey` | `apiKey` em `firebase-config.js` | `FIREBASE_API_KEY` |
| `authDomain` | `authDomain` | Gerado com `FIREBASE_PROJECT_ID` |
| `projectId` | `projectId` | `FIREBASE_PROJECT_ID` |
| `storageBucket` | `storageBucket` | Gerado com `FIREBASE_PROJECT_ID` |
| `messagingSenderId` | `messagingSenderId` | `FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `appId` | `FIREBASE_APP_ID` |

Copie `firebase-config.example.js` para `firebase-config.js`. Esse arquivo real não deve ser enviado ao GitHub.

## 3. Secrets obrigatórios do GitHub

Em **GitHub > Settings > Secrets and variables > Actions > New repository secret**, crie exatamente:

### `FIREBASE_PROJECT_ID`

O identificador do projeto, sem URL. Exemplo: `monitor-semed`.

### `FIREBASE_API_KEY`

O valor de `apiKey` do aplicativo Web.

### `FIREBASE_APP_ID`

O valor de `appId` do aplicativo Web. Exemplo de formato: `1:123456789:web:abcdef123456`.

### `FIREBASE_MESSAGING_SENDER_ID`

O valor numérico de `messagingSenderId`.

### `FIREBASE_SERVICE_ACCOUNT`

O conteúdo integral do arquivo JSON baixado da conta de serviço. Deve começar com `{` e conter, entre outras, as chaves:

```json
{
  "type": "service_account",
  "project_id": "SEU_PROJECT_ID",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...@SEU_PROJECT_ID.iam.gserviceaccount.com",
  "client_id": "...",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

Informe o JSON completo no Secret. Não informe `Downloads`, caminho de arquivo, aspas externas adicionais ou JSON convertido manualmente.

## 4. Administrador inicial

1. Em **Authentication > Users**, crie o primeiro usuário.
2. Copie o UID.
3. No Firestore, crie o documento `users/{UID}` com:

```json
{
  "fullName": "Administrador SEMED",
  "email": "administrador@dominio.gov.br",
  "role": "administrador",
  "active": true
}
```

Depois do primeiro acesso, o administrador poderá criar e editar os demais usuários na própria aplicação.

## 5. Publicação

O workflow `.github/workflows/firebase-hosting.yml` valida as cinco chaves, gera `firebase-config.js` somente durante o deploy, autentica com a conta de serviço e publica Hosting, Functions, regras, índices e Storage.
