-- ============================================================================
-- Migración 007: Soporte multirrol consolidado y capacidad operativa técnica
-- Compatible con PostgreSQL 16 (idempotente, aditiva y no destructiva)
-- ============================================================================

-- 1. Agregar columna habilitadoTecnico en users sin alterar registros históricos
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "habilitadoTecnico" BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Habilitar como técnicos a los usuarios con rol activo 'tech'
UPDATE "users" u
SET "habilitadoTecnico" = TRUE
WHERE u."habilitadoTecnico" = FALSE
  AND EXISTS (
    SELECT 1
    FROM "user_roles" ur
    INNER JOIN "roles" r ON r."id" = ur."roleId"
    WHERE ur."userId" = u."id"
      AND r."slug" = 'tech'
      AND r."activo" = TRUE
      AND r."deletedAt" IS NULL
  );

-- 3. Verificar integridad referencial de user_roles antes de crear índice único
DO $$
DECLARE
  v_fk_refs INTEGER;
  v_dup_pairs INTEGER;
  v_deleted_rows INTEGER;
BEGIN
  -- Comprobar que ninguna tabla externa referencie a user_roles.id
  SELECT COUNT(*)
  INTO v_fk_refs
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'user_roles';

  IF v_fk_refs > 0 THEN
    RAISE EXCEPTION 'Abortando deduplicación: existen % claves foráneas apuntando a user_roles.', v_fk_refs;
  END IF;

  -- Contar pares duplicados (userId, roleId)
  SELECT COUNT(*)
  INTO v_dup_pairs
  FROM (
    SELECT "userId", "roleId"
    FROM "user_roles"
    GROUP BY "userId", "roleId"
    HAVING COUNT(*) > 1
  ) dup;

  IF v_dup_pairs > 0 THEN
    DELETE FROM "user_roles" a
    USING "user_roles" b
    WHERE a."id" > b."id"
      AND a."userId" = b."userId"
      AND a."roleId" = b."roleId";

    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    RAISE NOTICE 'Se depuraron % filas redundantes en user_roles (% pares duplicados sin FKs externas).', v_deleted_rows, v_dup_pairs;
  ELSE
    RAISE NOTICE 'No se encontraron duplicados en user_roles.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND (
        indexdef ILIKE '%("userId", "roleId")%'
        OR indexdef ILIKE '%(userId, roleId)%'
      )
  ) THEN
    CREATE UNIQUE INDEX "UQ_user_roles_userId_roleId"
      ON "user_roles" ("userId", "roleId");
  END IF;
END $$;
