-- Migración manual para retirar la tabla legacy `repuesto`
-- Fecha: 2026-04-10
-- Objetivo:
--   1) asegurar que `detalle_repuestos.parteId` esté completo
--   2) eliminar `repuestoId` de `detalle_repuestos`
--   3) eliminar la tabla `repuesto`
--   4) dejar `Parte` + `Inventario` como modelo operativo principal

BEGIN;

UPDATE public.detalle_repuestos d
SET "parteId" = r."parteId"
FROM public.repuesto r
WHERE d."repuestoId" = r.id
  AND d."parteId" IS NULL;

ALTER TABLE public.detalle_repuestos
  DROP COLUMN IF EXISTS "repuestoId" CASCADE;

DROP TABLE IF EXISTS public.repuesto CASCADE;

COMMIT;

-- Verificación sugerida:
-- SELECT
--   to_regclass('public.repuesto') AS repuesto_table,
--   EXISTS (
--     SELECT 1
--     FROM information_schema.columns
--     WHERE table_schema = 'public'
--       AND table_name = 'detalle_repuestos'
--       AND column_name = 'repuestoId'
--   ) AS detalle_tiene_repuestoid;
