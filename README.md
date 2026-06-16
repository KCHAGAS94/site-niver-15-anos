# site-niver-15-anos

## RSVP com PostgreSQL

Para persistir as confirmações no seu PC e depois no VPS, configure estas variáveis de ambiente em um arquivo `.env.local` na raiz do projeto:

```bash
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
# opcional, quando o servidor exigir SSL
POSTGRES_SSL=true
```

Se quiser, copie o exemplo de [`.env.local.example`](.env.local.example) para `.env.local` e troque `sua_senha` pela senha real do seu usuário do PostgreSQL.

Se o PostgreSQL estiver instalado no seu PC Windows, o fluxo mais simples é:

1. Abrir o pgAdmin.
2. Descobrir o usuário do banco em `Login/Group Roles` ou pelo `Query Tool` com `SELECT current_user;`.
3. Criar um banco, por exemplo `site_niver_15_anos`.
4. Colocar a string no `.env.local` apontando para `localhost`.

Exemplo local:

```bash
DATABASE_URL=postgresql://postgres:minhaSenha@localhost:5432/site_niver_15_anos
POSTGRES_SSL=false
```

Se o `pnpm` não estiver instalado no seu PC, use `npm` no lugar dele:

```bash
npm install
npm run build
npm run rsvp:import
npm run dev
```

Depois da primeira configuração do banco, rode a importação do JSON legado, se existir algum registro antigo:

```bash
pnpm run rsvp:import
```

O site não grava mais em arquivo local para RSVP. As confirmações passam a viver no PostgreSQL, então reinício, deploy novo ou troca de container não apagam os dados.

## Comandos No VPS

Depois de enviar as alterações para o repositório, rode no VPS:

```bash
git pull
pnpm install
pnpm build
pnpm start
```

Se você usa PM2 no VPS, a sequência costuma ser:

```bash
git pull
pnpm install
pnpm build
pm2 restart <nome-ou-id-do-processo>
```

Antes de subir, confira se o VPS tem a variável `DATABASE_URL` configurada no ambiente do app. Sem isso, a rota de RSVP não consegue salvar no PostgreSQL.