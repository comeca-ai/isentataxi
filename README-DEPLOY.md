# IsentaTáxi 2.0 — Deploy (selfhost)

Stack: React+Vite (SPA) + Hono/tRPC + MySQL 8 + Caddy (HTTPS automático).

## Deploy em VPS limpa (runbook)

```bash
# 1) Docker + git
curl -fsSL https://get.docker.com | sh
apt-get install -y git

# 2) Código (branch de produção)
git clone -b selfhost https://github.com/comeca-ai/isentataxi.git /opt/isentataxi
cd /opt/isentataxi

# 3) Segredos — copie .env.example para .env e preencha (chmod 600)
cp .env.example .env && chmod 600 .env

# 4) Build do artefato FORA do Docker (npm quebra dentro de containers
#    em alguns hosts — "Exit handler never called!"):
#    em qualquer máquina/CI com Node 20:
npm ci --include=dev && npm run build && npm prune --omit=dev \
  && npm install --no-save tsx drizzle-kit

# 5) Imagem runtime + stack
docker build -f Dockerfile.prebuilt -t isentataxi-app .
docker compose up -d        # app :3000, mysql interno, caddy :80/:443

# 6) HTTPS: aponte o DNS de isentataxi.com.br para o IP da VPS.
#    O Caddy emite Let's Encrypt automaticamente.
```

## Migração de banco (VPS antiga → nova)

```bash
# na antiga
docker exec isentataxi-mysql-1 mysqldump -uisentataxi -p"$MYSQL_PASSWORD" \
  --single-transaction --routines --triggers isentataxi | gzip > db.sql.gz
# na nova
zcat db.sql.gz | docker exec -i isentataxi-mysql-1 mysql \
  -uisentataxi -p"$MYSQL_PASSWORD" isentataxi
```

## Pós-mudanças de código

```bash
cd /opt/isentataxi
git pull origin selfhost            # ou git fetch + git reset --hard origin/selfhost
# (rebuild do artefato fora do Docker se mudou src/api/db)
docker build -f Dockerfile.prebuilt -t isentataxi-app .
docker compose up -d
```

## Senhas e segredos
- `.env` NUNCA é commitado (gitignored). `.env.example` tem só placeholders.
- `ADMIN_EMAIL`/`ADMIN_PASSWORD` criam o 1º admin no boot se o banco estiver vazio;
  após uma migração (dump), o admin do dump prevalece.
