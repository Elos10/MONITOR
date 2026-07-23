# Configuração Firebase — PACTO SEMED

## Identificação do projeto

- Project ID: `pacto-semed`
- Alias local: `default`
- Região das Functions: `southamerica-east1`
- Runtime das Functions: Node.js 22
- Auth domain: `pacto-semed.firebaseapp.com`
- Storage bucket: `pacto-semed.firebasestorage.app`
- Hosting: `https://pacto-semed.web.app`

## Produtos que devem estar ativados

1. Authentication com o provedor **E-mail/senha**.
2. Cloud Firestore em modo nativo.
3. Cloud Storage for Firebase.
4. Firebase Hosting.
5. Cloud Functions for Firebase, 2ª geração.
6. Plano Blaze, necessário para publicar Functions.

## Aplicativo Web

No Console Firebase, abra **Configurações do projeto > Geral > Seus aplicativos** e crie ou selecione o aplicativo Web. Copie do objeto `firebaseConfig`:

- `apiKey` → Secret `FIREBASE_API_KEY`
- `appId` → Secret `FIREBASE_APP_ID`
- `messagingSenderId` → Secret `FIREBASE_MESSAGING_SENDER_ID`

O projeto usa os valores fixos:

```text
FIREBASE_PROJECT_ID=pacto-semed
authDomain=pacto-semed.firebaseapp.com
storageBucket=pacto-semed.firebasestorage.app
```

## Secrets do GitHub Actions

Em **GitHub > Settings > Secrets and variables > Actions**, configure:

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT
FIREBASE_API_KEY
FIREBASE_APP_ID
FIREBASE_MESSAGING_SENDER_ID
```

Valores:

- `FIREBASE_PROJECT_ID`: `pacto-semed`
- `FIREBASE_SERVICE_ACCOUNT`: conteúdo completo do JSON da conta de serviço ou o JSON convertido em Base64. Nunca informe um caminho do Windows.
- Os outros três valores vêm do objeto de configuração do aplicativo Web.

## Conta de serviço

Conta atualmente utilizada:

```text
firebase-adminsdk-fbsvc@pacto-semed.iam.gserviceaccount.com
```

O arquivo JSON não deve ser colocado no repositório, no `firebase.json` ou na pasta pública. O workflow transforma o Secret em um arquivo temporário durante o deploy.

Para publicar todos os recursos do projeto, a identidade de deploy precisa de permissões compatíveis com:

- Firebase Hosting Admin
- Firebase Rules Admin
- Cloud Functions Developer ou Admin
- Service Account User na conta de execução das Functions
- Artifact Registry Writer
- Cloud Build Editor
- API Keys Viewer
- Service Usage Consumer

Não atribua papéis de *service agent* diretamente à conta de deploy.

## Primeiro administrador

1. Em **Authentication > Usuários**, crie o primeiro usuário.
2. Copie o UID.
3. Em **Firestore Database**, crie a coleção `users`.
4. Crie um documento cujo ID seja exatamente o UID.
5. Adicione:

```json
{
  "fullName": "Administrador SEMED",
  "email": "EMAIL_DO_ADMINISTRADOR",
  "role": "administrador",
  "active": true
}
```

Depois desse primeiro acesso, o módulo **Perfis de acesso** pode criar e editar os demais usuários por meio da Function `manageUser`.

## Estrutura do Firestore

Coleções utilizadas:

```text
users
objects
events
activities
costs
pendingItems
notificationReads
documents
imports
audit
```

As regras oficiais do projeto estão em `firestore.rules`. Alterações feitas somente no Console podem ser sobrescritas pelo próximo deploy.

## Storage

Os arquivos são armazenados no caminho:

```text
documents/{objectId}/{fileName}
```

As regras aceitam PDF, JPEG, PNG e XLSX de até 20 MB para usuários ativos com perfil autorizado.

## Publicação

O workflow `.github/workflows/firebase-hosting.yml` publica:

```text
hosting
functions
firestore:rules
firestore:indexes
storage
```

Também pode ser executado localmente, com uma credencial válida em `GOOGLE_APPLICATION_CREDENTIALS`:

```bash
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes,storage --project pacto-semed
```

## Segurança obrigatória

- Nunca envie o JSON da conta de serviço ao GitHub.
- Mantenha as regras do Firestore e Storage versionadas.
- Ative uma política de senha no Authentication.
- Ative proteção contra enumeração de e-mails.
- Restrinja a API key Web às APIs do Firebase e, se possível, aos domínios autorizados.
- Cadastre os domínios do Hosting em **Authentication > Configurações > Domínios autorizados**.
- Configure alertas de orçamento no Google Cloud.
