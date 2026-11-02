# =========================================================================
# Frontend Dockerfile - Next.js Standalone Production (Multi-stage)
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
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Argumentos de compilación públicos requeridos por Next.js en build-time
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# --- 4. Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar activos públicos y artefactos compilados en standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000 || exit 1

CMD ["node", "server.js"]

