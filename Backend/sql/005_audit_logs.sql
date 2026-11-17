-- ============================================================================
-- MIGRACIÓN 005: MÓDULO DE AUDITORÍA INTERNA INMUTABLE (APPEND-ONLY)
-- HOSPITAL DEL COMPUTADOR
-- ============================================================================
-- Verificado contra el esquema real (001_initial_schema.sql y entidades TypeORM):
--   - "users"."id": INTEGER (SERIAL)
--   - "roles"."id": INTEGER (SERIAL), "slug": VARCHAR(255)
--   - "permissions"."id": INTEGER (SERIAL), "slug": VARCHAR(255)
--   - "role_permissions"("roleId", "permissionId")
--
-- Idempotente, no destructiva y segura para PostgreSQL en producción.
-- ============================================================================

BEGIN;

-- 1. Tabla principal de auditoría interna (append-only)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" BIGSERIAL PRIMARY KEY,
    "actor_user_id" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "actor_role" VARCHAR(30) NULL,
    "actor_type" VARCHAR(20) NOT NULL DEFAULT 'system',
    "action" VARCHAR(80) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(60) NULL,
    "entity_id" VARCHAR(64) NULL,
    "description" VARCHAR(500) NOT NULL,
    "old_values" JSONB NULL,
    "new_values" JSONB NULL,
    "changed_fields" TEXT[] NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "ip_address" VARCHAR(64) NULL,
    "user_agent" VARCHAR(255) NULL,
    "request_id" VARCHAR(64) NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "chk_audit_logs_actor_type"
        CHECK ("actor_type" IN ('employee', 'client', 'system', 'anonymous')),
    CONSTRAINT "chk_audit_logs_status"
        CHECK ("status" IN ('SUCCESS', 'FAILURE'))
);

-- 2. Índices para consultas administrativas, filtros y trazabilidad por entidad
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at"
    ON "audit_logs" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_module_created"
    ON "audit_logs" ("module", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_created"
    ON "audit_logs" ("actor_user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_created"
    ON "audit_logs" ("entity_type", "entity_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_status"
    ON "audit_logs" ("action", "status", "created_at" DESC);

-- 3. Inmutabilidad estricta en PostgreSQL (impide UPDATE y DELETE incluso al rol de la app)
CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'La tabla audit_logs es inmutable (append-only): la operación % no está permitida.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_audit_logs_append_only" ON "audit_logs";

CREATE TRIGGER "trg_audit_logs_append_only"
    BEFORE UPDATE OR DELETE ON "audit_logs"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_logs_mutation();

-- 4. Permisos administrativos de auditoría (siguiendo convención recurso.accion)
INSERT INTO "permissions" ("nombre", "slug", "descripcion", "createdAt", "updatedAt")
VALUES
    ('Ver Auditoría del Sistema', 'audit.view', 'Permite consultar el listado y filtros de auditoría interna', NOW(), NOW()),
    ('Ver Detalle de Auditoría', 'audit.detail', 'Permite consultar diferencias detalladas de registros de auditoría', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Asignar inicialmente únicamente al rol Administrador (admin)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT r."id", p."id", NOW(), NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."slug" = 'admin'
  AND p."slug" IN ('audit.view', 'audit.detail')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;

