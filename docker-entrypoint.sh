#!/bin/sh
set -e

echo "[entrypoint] Aguardando MySQL..."
tries=0
until node -e "
  const url = new URL(process.env.DATABASE_URL);
  const net = require('net');
  const s = net.connect({ host: url.hostname, port: Number(url.port || 3306) });
  s.on('connect', () => process.exit(0));
  s.on('error', () => process.exit(1));
" 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "[entrypoint] MySQL não respondeu em 60s. Abortando."
    exit 1
  fi
  sleep 1
done
echo "[entrypoint] MySQL disponível."

# Schema sync: só executa automaticamente em banco NOVO (sem tabela users).
# NUNCA rode db:push às cegas sobre um banco populado — faça manualmente com:
#   docker compose exec app npx drizzle-kit push
if node -e "
  const mysql = require('mysql2/promise');
  (async () => {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await conn.query(\"SHOW TABLES LIKE 'users'\");
    await conn.end();
    process.exit(rows.length === 0 ? 0 : 1);
  })().catch(() => process.exit(0));
"; then
  echo "[entrypoint] Banco novo detectado — sincronizando schema (drizzle-kit push)..."
  node node_modules/drizzle-kit/bin.cjs push --force
else
  echo "[entrypoint] Banco já possui tabelas — pulando schema sync automático."
fi

echo "[entrypoint] Rodando seed (idempotente)..."
node node_modules/tsx/dist/cli.mjs db/seed.ts

echo "[entrypoint] Iniciando servidor..."
exec node dist/boot.js
