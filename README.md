# Monitoramento e Controle SEMED

Aplicação institucional integrada a um novo projeto Firebase: Authentication, Cloud Firestore, Cloud Storage, Cloud Functions e Firebase Hosting.

## Configuração do novo projeto

O aplicativo está vinculado ao projeto `semed-gestao`. O deploy exige somente o GitHub Actions Repository Secret `FIREBASE_SERVICE_ACCOUNT_SEMED_GESTAO`, contendo o JSON integral de uma nova conta de serviço desse mesmo projeto — nunca um caminho local.

O primeiro administrador usa o e-mail institucional `detic@uberabadigital.com.br`. A senha não é armazenada no repositório: configure-a no Repository Secret `FIREBASE_INITIAL_ADMIN_PASSWORD`. O workflow cria ou sincroniza esse acesso e confirma no Firestore o perfil `administrador` ativo. Depois do primeiro acesso, os demais usuários devem ser criados pelo administrador no módulo **Perfis de acesso**.

O procedimento completo está em [CONFIGURACAO_FIREBASE.md](CONFIGURACAO_FIREBASE.md).

## Configuração local

O arquivo `firebase-config.js` já contém a configuração pública do aplicativo Web `semed-gestao`. A credencial privada da conta de serviço permanece exclusivamente no GitHub Actions Secret `FIREBASE_SERVICE_ACCOUNT_SEMED_GESTAO`.

## Implantação

O workflow `.github/workflows/firebase-hosting.yml` é executado em push para `main` ou manualmente. Antes de publicar, ele valida se todos os dados e a chave privada pertencem ao novo projeto.
