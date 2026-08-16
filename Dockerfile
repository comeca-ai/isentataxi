# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Deps de produção + ferramentas de boot (drizzle-kit p/ schema sync, tsx p/ seed)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --no-save tsx drizzle-kit

# App compilado + arquivos necessários para schema sync e seed no boot
COPY --from=build /app/dist ./dist
COPY db ./db
COPY drizzle.config.ts tsconfig.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
