# Monitoramento e Controle SEMED

Aplicação institucional para gestão de objetos, atividades, andamentos, custos, prazos, relatórios, importações e auditoria da SEMED.

## Stack

- front-end estático em HTML, CSS e JavaScript;
- Firebase Authentication com e-mail e senha;
- Cloud Firestore com controle RBAC nas Security Rules;
- Cloud Storage privado para documentos;
- Firebase Hosting com publicação pelo GitHub Actions.

## 1. Configurar o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Registre um aplicativo Web e copie a configuração exibida.
3. Em **Authentication > Sign-in method**, ative **E-mail/senha**.
4. Em **Firestore Database**, crie o banco em modo de produção.
5. Em **Storage**, ative o bucket padrão.
6. Crie o usuário inicial em Authentication.
7. No Firestore, crie manualmente o documento `users/{UID_DO_USUARIO}`:

```json
{
  "fullName": "Administrador SEMED",
  "email": "admin@semed.local",
  "role": "administrador",
  "active": true
}
```

Os perfis aceitos são `administrador`, `gabinete`, `assessoria`, `diretoria`, `departamento`, `secao` e `servidor`.

## 2. Executar localmente

1. Copie `firebase-config.example.js` para `firebase-config.js`.
2. Preencha os dados do aplicativo Web Firebase.
3. Sirva a pasta por HTTP e abra a aplicação.

Sem `firebase-config.js`, a aplicação permanece em modo demonstrativo local.

## 3. GitHub Actions

Em **Settings > Secrets and variables > Actions**, crie:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT` — JSON completo de uma conta de serviço autorizada a publicar;
- `FIREBASE_API_KEY`
- `FIREBASE_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`

O workflow `.github/workflows/firebase-hosting.yml` publica a aplicação, as regras e os índices quando houver push na branch `main`.

## 4. Publicação inicial

```powershell
git add .
git commit -m "Configura Firebase no PACTO SEMED"
git push origin main
```

## Segurança

- todas as coleções exigem usuário autenticado e ativo;
- permissões de gravação dependem do perfil cadastrado em `users/{uid}`;
- custos, eventos e auditoria são imutáveis;
- objetos não podem ser excluídos fisicamente pelo cliente;
- anexos são limitados a 20 MB e tipos autorizados;
- `firebase-config.js` e credenciais locais não são versionados;
- a conta de serviço existe somente como GitHub Secret.

## Arquivos de infraestrutura

- `firebase.json`: Hosting, Firestore e Storage;
- `firestore.rules`: autorização RBAC e validações;
- `firestore.indexes.json`: índices compostos;
- `storage.rules`: acesso e validação de anexos;
- `firebase-adapter.js`: integração modular com o SDK Web;
- `.github/workflows/firebase-hosting.yml`: publicação automatizada.
