# IsentaTáxi 2.0 — Deploy self-host (Docker)

App completo (React + Hono/tRPC + MySQL) em um único container, com banco MySQL
via Docker Compose. Funciona em qualquer VPS com Docker instalado.

## Quickstart (3 comandos)

```bash
cp .env.example .env      # 1. crie o arquivo de configuração
$EDITOR .env              # 2. edite: senha do banco, JWT_SECRET, ADMIN_*
docker compose up -d --build   # 3. suba tudo
```

Pronto: app em `http://SEU_IP:3000`. O primeiro boot cria as tabelas, roda o
seed do catálogo de veículos e cria o usuário admin (se configurado).

## Variáveis de ambiente (.env)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | Conexão MySQL. No compose: `mysql://isentataxi:SENHA@mysql:3306/isentataxi` |
| `MYSQL_PASSWORD` | sim | Senha do banco — **a mesma** presente em `DATABASE_URL` |
| `JWT_SECRET` | sim | Segredo longo p/ sessões. Gere com `openssl rand -base64 48` |
| `PORT` | não | Porta interna do app (padrão `3000`) |
| `ADMIN_EMAIL` | recomendado | E-mail do 1º admin (criado no boot se não existir) |
| `ADMIN_PASSWORD` | recomendado | Senha do 1º admin (mín. 8 caracteres) |

## Acessando o /admin

1. Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` antes do primeiro boot.
2. Suba o compose, abra `http://SEU_IP:3000/login` e entre com essas credenciais.
3. Acesse `/admin`. Depois, se quiser, remova as vars `ADMIN_*` do `.env`.

## HTTPS com Caddy (domínio próprio)

1. Aponte o DNS (registro A) do domínio para o IP do VPS.
2. Crie `Caddyfile`: `seudominio.com.br { reverse_proxy app:3000 }`
3. Descomente o serviço `caddy` e o volume `caddy-data` no `docker-compose.yml`.
4. `docker compose up -d` — o certificado é emitido e renovado sozinho.

## Backups

```bash
docker compose exec mysql sh -c 'mysqldump -uisentataxi -p"$MYSQL_PASSWORD" isentataxi' > backup-$(date +%F).sql
```

Restaurar: `docker compose exec -T mysql sh -c 'mysql -uisentataxi -p"$MYSQL_PASSWORD" isentataxi' < backup.sql`

## Atualizando o app

```bash
git pull
docker compose up -d --build
```

O schema **não** é alterado automaticamente em banco existente. Se uma
atualização mudar o schema, aplique manualmente:

```bash
docker compose exec app npx drizzle-kit push
```

## Troubleshooting

- **Ver logs**: `docker compose logs -f app` (ou `mysql`).
- **Login não funciona / "Invalid authentication"**: confira se `JWT_SECRET`
  está definido e não mudou entre boots (mudar invalida sessões antigas).
- **Banco não sobe**: `docker compose logs mysql`; senha contém caracteres
  especiais? Evite `@`, `:` e `/` na senha (conflitam com a URL de conexão).
- **Resetar o banco do zero** (APAGA TUDO):
  ```bash
  docker compose down -v && docker compose up -d --build
  ```
- **Schema sync manual**: o entrypoint só roda `drizzle-kit push` em banco
  vazio. Em banco populado, rode você mesmo:
  `docker compose exec app npx drizzle-kit push`.
