# Nova configuração Firebase — Monitoramento e Controle SEMED

Esta configuração é exclusiva para um novo projeto Firebase. Nenhuma credencial anterior é usada pelo workflow.

## 1. Criar e preparar o novo projeto

No Firebase Console:

1. Crie o novo projeto e anote o **ID do projeto**.
2. Em **Configurações do projeto > Geral**, registre um novo aplicativo Web.
3. Ative **Authentication > E-mail/senha**.
4. Crie o **Cloud Firestore** em modo nativo.
5. Ative **Cloud Storage**, **Hosting** e **Cloud Functions**.
6. Se o Console solicitar, vincule uma conta de faturamento para usar Cloud Functions.

## 2. Criar uma nova conta de serviço

Em **Configurações do projeto > Contas de serviço > Gerar nova chave privada**, gere e baixe um JSON pertencente ao novo projeto.

Não reutilize o JSON do projeto anterior. O conteúdo deve possuir `type`, `project_id`, `private_key_id`, `private_key` e `client_email`. Guarde o arquivo fora do repositório.

## 3. Remover os Secrets antigos

No GitHub, acesse **Settings > Secrets and variables > Actions** e exclua, se existirem:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`

## 4. Criar os sete novos Secrets

Crie exatamente estes **Repository secrets**:

| Secret novo | Valor exato |
|---|---|
| `FIREBASE_NEW_PROJECT_ID` | `projectId` do novo aplicativo Web |
| `FIREBASE_NEW_SERVICE_ACCOUNT` | conteúdo integral do novo JSON da conta de serviço |
| `FIREBASE_NEW_API_KEY` | `apiKey` do novo aplicativo Web |
| `FIREBASE_NEW_AUTH_DOMAIN` | `authDomain` do novo aplicativo Web |
| `FIREBASE_NEW_STORAGE_BUCKET` | `storageBucket` do novo aplicativo Web |
| `FIREBASE_NEW_APP_ID` | `appId` do novo aplicativo Web |
| `FIREBASE_NEW_MESSAGING_SENDER_ID` | `messagingSenderId` do novo aplicativo Web |

Em `FIREBASE_NEW_SERVICE_ACCOUNT`, cole o JSON completo, começando em `{` e terminando em `}`. Não informe o caminho de Downloads e não acrescente aspas ao redor do JSON.

O `project_id` dentro do JSON deve ser idêntico ao valor de `FIREBASE_NEW_PROJECT_ID`. A chave privada também precisa estar ativa no novo projeto; o workflow faz essa validação antes de implantar.

## 5. Permissões da conta de serviço

Conceda à conta usada no deploy as permissões necessárias para Firebase Hosting, Firestore, Storage e Functions. Para a primeira implantação, a forma mais simples é usar a conta de serviço gerada pelo próprio Firebase para o projeto. Caso a organização aplique privilégios mínimos, o administrador do Google Cloud deve conceder os papéis equivalentes aos produtos implantados.

## 6. Administrador inicial

1. Em **Authentication > Users**, crie o primeiro usuário e copie seu UID.
2. No Firestore, crie `users/{UID}` com:

```json
{
  "fullName": "ADMINISTRADOR SEMED",
  "email": "administrador@dominio.gov.br",
  "role": "administrador",
  "active": true
}
```

## 7. Publicar

Envie as alterações para a branch `main` ou execute manualmente **Actions > Publicar novo projeto Firebase > Run workflow**.

O workflow valida os sete Secrets, confirma criptograficamente a nova chave, gera `firebase-config.js` apenas no runner e publica Hosting, Functions, regras e índices do Firestore e regras do Storage.

Para testes locais, copie `firebase-config.example.js` para `firebase-config.js` e preencha os seis valores do aplicativo Web. `firebase-config.js`, `.firebaserc` e arquivos de conta de serviço estão ignorados pelo Git.
