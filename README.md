# site-niver-15-anos

## RSVP com PostgreSQL

Para persistir as confirmações em produção, configure estas variáveis de ambiente no VPS:

```bash
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
# opcional, quando o servidor exigir SSL
POSTGRES_SSL=true
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