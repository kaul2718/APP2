-- ============================================================================
-- MIGRACIÓN 003: REFACTORIZACIÓN INTEGRAL DE FLUJO DE ÓRDENES A 5 ESTADOS
-- HOSPITAL DEL COMPUTADOR
-- ============================================================================
-- Reemplaza el esquema anterior de 8 estados por los 5 estados principales:
-- 1. Recepción
-- 2. Diagnóstico
-- 3. En Servicio (reemplaza a Reparación; Repuestos pasa a condición secundaria)
-- 4. Listo para Entrega (reemplaza a Control y Entrega pendiente)
-- 5. Entregado (estado final de entrega y cierre; reemplaza a Archivados)
-- ============================================================================

BEGIN;

-- 1. Asegurar la existencia de la columna de condición secundaria esperaRepuesto en orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "esperaRepuesto" BOOLEAN NOT NULL DEFAULT false;

-- 2. Asegurar la existencia de los 5 estados principales en la tabla estado_orden
INSERT INTO "estado_orden" ("nombre", "descripcion", "estado", "createdAt", "updatedAt")
VALUES
    ('Recepción', 'Equipo recibido en recepción y registrado en el sistema', true, NOW(), NOW()),
    ('Diagnóstico', 'Equipo en evaluación técnica, pruebas y presupuesto', true, NOW(), NOW()),
    ('En Servicio', 'Equipo en proceso de reparación, mantenimiento o instalación técnica', true, NOW(), NOW()),
    ('Listo para Entrega', 'Trabajo técnico finalizado y verificado, equipo listo para ser retirado', true, NOW(), NOW()),
    ('Entregado', 'Equipo entregado físicamente al cliente y servicio finalizado', true, NOW(), NOW())
ON CONFLICT ("nombre") DO UPDATE
SET "descripcion" = EXCLUDED."descripcion",
    "estado" = true,
    "deletedAt" = NULL,
    "updatedAt" = NOW();

-- 3. Obtener variables temporales con los IDs canónicos de los 5 estados definitivos
DO $$
DECLARE
    v_id_recepcion INTEGER;
    v_id_diagnostico INTEGER;
    v_id_en_servicio INTEGER;
    v_id_listo INTEGER;
    v_id_entregado INTEGER;
BEGIN
    SELECT "id" INTO v_id_recepcion FROM "estado_orden" WHERE "nombre" = 'Recepción' LIMIT 1;
    SELECT "id" INTO v_id_diagnostico FROM "estado_orden" WHERE "nombre" = 'Diagnóstico' LIMIT 1;
    SELECT "id" INTO v_id_en_servicio FROM "estado_orden" WHERE "nombre" = 'En Servicio' LIMIT 1;
    SELECT "id" INTO v_id_listo FROM "estado_orden" WHERE "nombre" = 'Listo para Entrega' LIMIT 1;
    SELECT "id" INTO v_id_entregado FROM "estado_orden" WHERE "nombre" = 'Entregado' LIMIT 1;

    -- A. Órdenes en estado 'Repuestos': migran a 'En Servicio' con esperaRepuesto = true
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_en_servicio,
        "esperaRepuesto" = true,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%repuesto%'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_en_servicio,
        "observaciones" = COALESCE("observaciones" || ' | ', '') || '[Migración: Anterior estado Repuestos reclasificado a En Servicio con espera de repuesto]'
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%repuesto%'
    );

    -- B. Órdenes en estado 'Aprobación': migran a 'Diagnóstico' (esperando presupuesto)
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_diagnostico,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%aprobaci%'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_diagnostico,
        "observaciones" = COALESCE("observaciones" || ' | ', '') || '[Migración: Anterior estado Aprobación reclasificado a Diagnóstico con proceso de presupuesto]'
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%aprobaci%'
    );

    -- C. Órdenes en estado 'Reparación': migran a 'En Servicio'
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_en_servicio,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%reparaci%'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_en_servicio
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%reparaci%'
    );

    -- D. Órdenes en estado 'Control': migran a 'Listo para Entrega'
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_listo,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%control%'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_listo
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%control%'
    );

    -- E. Órdenes en anterior estado 'Entrega': migran a 'Listo para Entrega' (a la espera de retiro)
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_listo,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE 'entrega'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_listo
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE 'entrega'
    );

    -- F. Órdenes en anterior estado 'Archivados': migran a 'Entregado' (historial de trabajos finalizados)
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_entregado,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%archiv%'
    );

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_entregado
    WHERE "estadoOrdenId" IN (
        SELECT "id" FROM "estado_orden" WHERE "nombre" ILIKE '%archiv%'
    );

    -- G. Salvaguarda de integridad referencial: Reclasificar cualquier otro registro no canónico residual
    UPDATE "orders"
    SET "estadoOrdenId" = v_id_diagnostico,
        "updatedAt" = NOW()
    WHERE "estadoOrdenId" IS NOT NULL
      AND "estadoOrdenId" NOT IN (v_id_recepcion, v_id_diagnostico, v_id_en_servicio, v_id_listo, v_id_entregado);

    UPDATE "historial_estado_orden"
    SET "estadoOrdenId" = v_id_diagnostico
    WHERE "estadoOrdenId" NOT IN (v_id_recepcion, v_id_diagnostico, v_id_en_servicio, v_id_listo, v_id_entregado);

    -- 4. Eliminar definitivamente todos los estados que no correspondan a los 5 canónicos
    DELETE FROM "estado_orden"
    WHERE "id" NOT IN (v_id_recepcion, v_id_diagnostico, v_id_en_servicio, v_id_listo, v_id_entregado);

    RAISE NOTICE '✓ Migración a 5 estados completada exitosamente sin registros huérfanos.';
END $$;

COMMIT;
