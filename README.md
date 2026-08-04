# Monitoramento e Controle SEMED

Aplicação institucional para gestão de objetos, atividades, andamentos, custos, prazos, relatórios, importações e auditoria da SEMED.

## Execução

O sistema é um front-end estático em HTML, CSS e JavaScript. Abra a pasta por meio de um servidor HTTP local e acesse pelo navegador.

Os dados e a sessão são mantidos localmente no navegador, sem integração com serviços externos.

### Acesso administrativo inicial

- E-mail: `admin@semed.local`
- Senha: `Admin@123`

O administrador pode cadastrar usuários locais e atribuir os perfis `administrador`, `gabinete`, `assessoria`, `diretoria`, `departamento`, `secao` e `servidor`.

## Arquivos principais

- `index.html`: entrada da aplicação;
- `app.js`: telas, estado e operações locais;
- `workflow-enhancements.js`: funcionalidades complementares;
- `styles.css` e arquivos CSS complementares: apresentação visual;
- `assets/modelo-importacao-objetos-semed.xlsx`: modelo oficial para importação.
