-- ============================================================================
-- MIGRACIÓN 004: SIMPLIFICACIÓN DEL FLUJO DE APROBACIÓN DE PRESUPUESTOS
-- HOSPITAL DEL COMPUTADOR
-- ============================================================================
-- Propósito:
-- 1. Ampliar el catálogo de modalidades de autorización de presupuestos
--    (autorizaciones_presupuesto_modalidad_enum) con:
--    - CONFIRMACION_TELEFONICA
--    - CONFIRMACION_MENSAJE_CORREO
--    - AUTORIZACION_INTERNA
-- 2. Agregar columna "observaciones" (TEXT NULL) en "autorizaciones_presupuesto"
--    para conservar constancia y trazabilidad de aprobaciones/rechazos.
-- 3. Asegurar permisos de aprobación/gestión de presupuestos para roles
--    administrativos y operativos autorizados (admin, recep, tech).
-- Idempotente, no destructiva y segura para PostgreSQL.
-- ============================================================================

-- 1. Ampliar ENUM autorizaciones_presupuesto_modalidad_enum de forma idempotente
ALTER TYPE autorizaciones_presupuesto_modalidad_enum ADD VALUE IF NOT EXISTS 'CONFIRMACION_TELEFONICA';
ALTER TYPE autorizaciones_presupuesto_modalidad_enum ADD VALUE IF NOT EXISTS 'CONFIRMACION_MENSAJE_CORREO';
ALTER TYPE autorizaciones_presupuesto_modalidad_enum ADD VALUE IF NOT EXISTS 'AUTORIZACION_INTERNA';

BEGIN;

-- 2. Agregar columna de observaciones / constancia a autorizaciones_presupuesto
ALTER TABLE "autorizaciones_presupuesto"
    ADD COLUMN IF NOT EXISTS "observaciones" TEXT NULL;

-- 3. Asegurar permisos presupuestos.approve, presupuestos.update, presupuestos.create y orders.update
--    para roles Administrador (admin), Recepcionista (recep) y Técnico (tech)
INSERT INTO "permissions" ("nombre", "slug", "descripcion", "createdAt", "updatedAt")
VALUES
    ('Ver Presupuestos', 'presupuestos.view', 'Permite consultar presupuestos de órdenes', NOW(), NOW()),
    ('Crear Presupuestos', 'presupuestos.create', 'Permite crear presupuestos en órdenes', NOW(), NOW()),
    ('Editar Presupuestos', 'presupuestos.update', 'Permite editar presupuestos en órdenes', NOW(), NOW()),
    ('Aprobar Presupuestos', 'presupuestos.approve', 'Permite aprobar o rechazar presupuestos', NOW(), NOW()),
    ('Editar Órdenes', 'orders.update', 'Permite actualizar órdenes de servicio', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT r."id", p."id", NOW(), NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."slug" IN ('admin', 'recep', 'tech')
  AND p."slug" IN ('presupuestos.view', 'presupuestos.create', 'presupuestos.update', 'presupuestos.approve', 'orders.update')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;

