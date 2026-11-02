# =========================================================================
# Backend Dockerfile - NestJS Production (Multi-stage)
# Hospital del Computador
# =========================================================================

# --- 1. Base Stage ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- 2. Dependencies Stage ---
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# --- 3. Builder Stage ---
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json tsconfig*.json nest-cli.json ./
COPY src ./src
COPY assets ./assets
RUN npm run build

# --- 4. Production Dependencies Stage ---
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- 5. Runner Stage ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Crear carpetas persistentes requeridas y asignar permisos al usuario 'node'
RUN mkdir -p /app/assets /app/certs /app/uploads /app/sql /app/scripts \
    && chown -R node:node /app

# Copiar artefactos necesarios
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/assets ./assets
COPY --chown=node:node package*.json ./
COPY --chown=node:node sql ./sql
COPY --chown=node:node scripts ./scripts

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

CMD ["node", "dist/main"]

