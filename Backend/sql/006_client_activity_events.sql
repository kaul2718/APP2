-- ============================================================================
-- MIGRACIÓN 006: ANALÍTICA DE COMPORTAMIENTO DE CLIENTES
-- HOSPITAL DEL COMPUTADOR
-- ============================================================================
-- Migración independiente de 005_audit_logs.sql.
-- Idempotente, no destructiva y compatible con PostgreSQL 15 / 16.
-- ============================================================================

BEGIN;

-- 1. Tabla de eventos de comportamiento de clientes (sin IP, sin PII, sin tokens)
CREATE TABLE IF NOT EXISTS "client_activity_events" (
    "id" BIGSERIAL PRIMARY KEY,
    "event_name" VARCHAR(80) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "page_path" VARCHAR(200) NOT NULL,
    "actor_mode" VARCHAR(20) NOT NULL DEFAULT 'anonymous',
    "source" VARCHAR(20) NOT NULL DEFAULT 'frontend',
    "client_user_id" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "session_id" VARCHAR(64) NULL,
    "entity_type" VARCHAR(50) NULL,
    "entity_id" VARCHAR(64) NULL,
    "metadata" JSONB NULL,
    "frontend_version" VARCHAR(32) NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "chk_client_activity_actor_mode"
        CHECK ("actor_mode" IN ('authenticated', 'anonymous')),
    CONSTRAINT "chk_client_activity_source"
        CHECK ("source" IN ('frontend', 'backend'))
);

-- 2. Índices para agregaciones eficientes por período, evento, módulo y cliente/sesión
CREATE INDEX IF NOT EXISTS "idx_client_activity_created_at"
    ON "client_activity_events" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_client_activity_event_created"
    ON "client_activity_events" ("event_name", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_client_activity_module_created"
    ON "client_activity_events" ("module", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_client_activity_user_created"
    ON "client_activity_events" ("client_user_id", "created_at" DESC)
    WHERE "client_user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_client_activity_session_created"
    ON "client_activity_events" ("session_id", "created_at" DESC)
    WHERE "session_id" IS NOT NULL;

-- 3. Permiso administrativo para consultar analítica de clientes (Fase 4)
INSERT INTO "permissions" ("nombre", "slug", "descripcion", "createdAt", "updatedAt")
VALUES
    ('Ver Analítica de Clientes', 'analytics.clients.view', 'Permite consultar métricas agregadas de uso del portal de clientes', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT r."id", p."id", NOW(), NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."slug" = 'admin'
  AND p."slug" = 'analytics.clients.view'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;

