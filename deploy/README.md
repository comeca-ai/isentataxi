# Deploy

- A imagem é construída pelo CI (`.github/workflows/ci.yml`) a cada push em `selfhost` e publicada em `ghcr.io/comeca-ai/isentataxi` com as tags `sha-<commit curto>` e `selfhost`. O servidor não faz build.
- Cada ambiente (`deploy/prod`, `deploy/demo`) tem seu `docker-compose.yml`. O `.env` fica **somente no servidor**, ao lado do compose, com `chmod 600`. Nunca versione segredos. Variáveis esperadas: `MYSQL_PASSWORD` e as demais do app (veja `.env.example`).
- Se o pacote GHCR for privado, faça `docker login ghcr.io` no servidor com um token de leitura (`read:packages`).

## Deploy

```bash
cd deploy/prod   # ou deploy/demo
IMAGE_TAG=sha-xxxx docker compose pull && IMAGE_TAG=sha-xxxx docker compose up -d
```

Sem `IMAGE_TAG`, usa a tag `selfhost` (a mais recente). Prefira fixar a tag `sha-...` em produção.

## Rollback

Repita o deploy com a tag anterior: `IMAGE_TAG=sha-anterior docker compose up -d`.
