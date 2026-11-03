-- =========================================================================
-- Hospital del Computador - Migración Incremental de Producción (PostgreSQL)
-- Archivo: 002_schema_alignment.sql
-- Propósito: Alineación de esquema TypeORM para EvidenciaTecnica y ActivacionCuenta
-- Idempotente, no destructiva y segura para ejecución en caliente.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. TABLA: evidencia_tecnica
-- Problema resuelto: Error 500 en GET /api/v1/evidencias-tecnicas
-- "column evidencia.deletedAt does not exist" provocado por @DeleteDateColumn
-- -------------------------------------------------------------------------

-- 1.1 Agregar columna deletedAt para borrado lógico (soft-delete)
ALTER TABLE "evidencia_tecnica" 
    ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

-- 1.2 Índices para acelerar filtrado de registros activos y consultas por orden
CREATE INDEX IF NOT EXISTS "idx_evidencia_tecnica_deleted_at" 
    ON "evidencia_tecnica" ("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_evidencia_tecnica_orden_id" 
    ON "evidencia_tecnica" ("ordenId");

-- -------------------------------------------------------------------------
-- 2. TABLA: activaciones_cuenta
-- Problema resuelto: Soporte de auditoría para flujo de activación y restablecimiento
-- de contraseñas (usuario generador, IP de generación e IP de consumo)
-- -------------------------------------------------------------------------

-- 2.1 Agregar columnas de auditoría y trazabilidad
ALTER TABLE "activaciones_cuenta" 
    ADD COLUMN IF NOT EXISTS "generado_por_id" INTEGER NULL;

ALTER TABLE "activaciones_cuenta" 
    ADD COLUMN IF NOT EXISTS "ip_generacion" VARCHAR(64) NULL;

ALTER TABLE "activaciones_cuenta" 
    ADD COLUMN IF NOT EXISTS "ip_consumo" VARCHAR(64) NULL;

-- 2.2 Relación foránea idempotente: generado_por_id -> users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_activaciones_cuenta_generado_por'
    ) THEN
        ALTER TABLE "activaciones_cuenta"
            ADD CONSTRAINT "fk_activaciones_cuenta_generado_por"
            FOREIGN KEY ("generado_por_id") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL;
    END IF;
END $$;

-- 2.3 Índice de rendimiento para auditoría de activaciones por usuario emisor
CREATE INDEX IF NOT EXISTS "idx_activaciones_generado_por_id" 
    ON "activaciones_cuenta" ("generado_por_id");

COMMIT;

