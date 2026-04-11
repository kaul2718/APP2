-- Migración manual para retirar el modelo legacy de especificaciones técnicas
-- Fecha: 2026-04-10
-- Objetivo:
--   1) eliminar `especificacion_parte`
--   2) eliminar `tipo_especificacion`
--   3) dejar el catálogo maestro `Parte` como flujo principal sin estos módulos opcionales

BEGIN;

DROP TABLE IF EXISTS public.especificacion_parte CASCADE;
DROP TABLE IF EXISTS public.tipo_especificacion CASCADE;

COMMIT;

-- Verificación manual sugerida:
-- SELECT
--   to_regclass('public.especificacion_parte') AS especificacion_parte,
--   to_regclass('public.tipo_especificacion') AS tipo_especificacion;
