-- Migración manual para desacoplar `detalle_repuestos` del legado `repuestoId`
-- Fecha: 2026-04-10
-- Objetivo:
--   1) agregar `parteId` directo a `detalle_repuestos`
--   2) backfillear el valor desde la relación legacy con `repuesto`
--   3) dejar el consumo de presupuesto alineado al catálogo maestro `Parte`

BEGIN;

ALTER TABLE public.detalle_repuestos
  ADD COLUMN IF NOT EXISTS "parteId" integer;

UPDATE public.detalle_repuestos d
SET "parteId" = r."parteId"
FROM public.repuesto r
WHERE d."repuestoId" = r.id
  AND (d."parteId" IS NULL OR d."parteId" <> r."parteId");

CREATE INDEX IF NOT EXISTS idx_detalle_repuestos_parte_id
  ON public.detalle_repuestos ("parteId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_detalle_repuestos_parte'
  ) THEN
    ALTER TABLE public.detalle_repuestos
      ADD CONSTRAINT fk_detalle_repuestos_parte
      FOREIGN KEY ("parteId")
      REFERENCES public.parte(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
