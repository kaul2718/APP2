-- =========================================================================
-- Migración Reproducible: Concurrencia Optimista e Idempotencia Persistente
-- Hospital del Computador - PostgreSQL
-- =========================================================================

DO $$ 
BEGIN
    -- 1. Control de Concurrencia Optimista (columna version)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'version'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "version" integer NOT NULL DEFAULT 1;
        RAISE NOTICE 'Columna orders.version agregada exitosamente.';
    ELSE
        RAISE NOTICE 'Columna orders.version ya existe.';
    END IF;

    -- 2. Llave de Idempotencia Persistente (columna clientRequestId)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'clientRequestId'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "clientRequestId" varchar(100);
        RAISE NOTICE 'Columna orders.clientRequestId agregada exitosamente.';
    ELSE
        RAISE NOTICE 'Columna orders.clientRequestId ya existe.';
    END IF;

    -- 3. Índice Único Condicional (garantiza unicidad estricta para IDs no nulos en transacciones concurrentes)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'orders' AND indexname = 'idx_orders_client_request_id'
    ) THEN
        CREATE UNIQUE INDEX "idx_orders_client_request_id" 
        ON "orders" ("clientRequestId") 
        WHERE "clientRequestId" IS NOT NULL;
        RAISE NOTICE 'Índice único idx_orders_client_request_id creado exitosamente.';
    ELSE
        RAISE NOTICE 'Índice único idx_orders_client_request_id ya existe.';
    END IF;
END $$;
