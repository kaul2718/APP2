-- Migración manual para consolidar `Parte` como catálogo maestro
-- Fecha: 2026-04-10
-- Objetivo:
--   1) agregar `codigoInterno` y `precioReferencia` en `parte`
--   2) backfillear los datos desde `repuesto`
--   3) dejar listo el retiro gradual de la tabla legacy `repuesto`

BEGIN;

ALTER TABLE public.parte
  ADD COLUMN IF NOT EXISTS "codigoInterno" varchar(80),
  ADD COLUMN IF NOT EXISTS "precioReferencia" numeric(10,2) NOT NULL DEFAULT 0;

-- Copiar código y precio desde la tabla legacy si existe relación
-- Nota: `precioReferencia` se agregó con DEFAULT 0, por eso se usa NULLIF(..., 0)
-- para permitir el backfill real desde `repuesto.precioVenta`.
UPDATE public.parte p
SET
  "codigoInterno" = COALESCE(NULLIF(p."codigoInterno", ''), r.codigo, 'ITEM-' || p.id::text),
  "precioReferencia" = COALESCE(NULLIF(p."precioReferencia", 0), r."precioVenta", 0)
FROM public.repuesto r
WHERE r."parteId" = p.id;

-- Garantizar valores mínimos aun cuando no exista fila legacy en `repuesto`
UPDATE public.parte
SET
  "codigoInterno" = COALESCE(NULLIF("codigoInterno", ''), 'ITEM-' || id::text),
  "precioReferencia" = COALESCE("precioReferencia", 0);

-- Índice único parcial para mantener la unicidad del código maestro
CREATE UNIQUE INDEX IF NOT EXISTS idx_parte_codigo_interno_unique
  ON public.parte ("codigoInterno")
  WHERE "codigoInterno" IS NOT NULL;

COMMIT;
