# Configuração Firebase — projeto semed-gestao

## Configuração pública do aplicativo Web

O workflow já contém os valores fornecidos pelo Firebase para `semed-gestao`: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` e `measurementId`.

Esses valores identificam o aplicativo Web, mas não autenticam uma implantação administrativa.

## Secrets obrigatórios no GitHub

Abra **GitHub > repositório > Settings > Secrets and variables > Actions > Repository secrets > New repository secret** e crie:

```text
FIREBASE_SERVICE_ACCOUNT_SEMED_GESTAO
```

Para obter o valor, abra **Firebase Console > semed-gestao > Configurações do projeto > Contas de serviço > Gerar nova chave privada**. Abra o JSON baixado, copie todo o conteúdo desde `{` até `}` e cole como valor do Secret.

Não informe o caminho do arquivo em Downloads. O campo `project_id` do JSON precisa ser exatamente `semed-gestao`.

Crie também:

```text
FIREBASE_INITIAL_ADMIN_PASSWORD
```

Informe nesse Secret a senha institucional definida para o primeiro administrador. Ela não deve ser escrita em arquivos do repositório. O workflow vincula essa senha ao usuário `detic@uberabadigital.com.br` e garante no Firestore o perfil `administrador` ativo.

## Serviços necessários

Ative no Firebase Console:

1. Authentication com provedor E-mail/senha;
2. Cloud Firestore;
3. Cloud Storage;
4. Firebase Hosting;
5. Cloud Functions.

## Executar o workflow

Abra **Actions > Publicar projeto SEMED Gestao no Firebase > Run workflow**, selecione `main` e confirme. O workflow valida o JSON, confirma que a chave privada está ativa, gera `firebase-config.js` e executa a implantação.

Se o workflow informar que o Secret está ausente, confirme que ele foi criado como **Repository secret** com o nome exato `FIREBASE_SERVICE_ACCOUNT_SEMED_GESTAO`.
