const { Client } = require('pg');
const crypto = require('crypto');

async function migrate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'hdc',
  });

  await client.connect();
  console.log('Conectado a PostgreSQL (hdc)...');

  try {
    await client.query('BEGIN');

    // 1. Permitir correo NULL en tabla users (conservando unicidad para valores no nulos)
    console.log('1. Alterando columna correo en tabla users...');
    await client.query(`
      ALTER TABLE users ALTER COLUMN correo DROP NOT NULL;
    `);

    // 2. Extender tabla orders con campos de credencial privada segura y autorizantes
    console.log('2. Agregando columnas de seguridad y token de acceso a orders...');
    await client.query(`
      ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS "tokenAccesoHash" VARCHAR(64) NULL,
        ADD COLUMN IF NOT EXISTS "tokenAccesoExpiracion" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "tokenAccesoRevocado" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "tokenAccesoIntentosFallidos" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tokenAccesoBloqueadoHasta" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "tokenAccesoUltimoUso" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "entregadoPorNombre" VARCHAR(150) NULL,
        ADD COLUMN IF NOT EXISTS "entregadoPorCedula" VARCHAR(20) NULL,
        ADD COLUMN IF NOT EXISTS "entregadoPorParentesco" VARCHAR(50) NULL;
    `);

    // 3. Extender tabla presupuesto con control de versiones
    console.log('3. Agregando columna version a presupuesto...');
    await client.query(`
      ALTER TABLE presupuesto 
        ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
    `);

    // 4. Extender enum de documentos_orden
    console.log('4. Agregando tipos de documentos de presupuesto a documentos_orden_tipodocumento_enum...');
    // En PostgreSQL: ALTER TYPE ... ADD VALUE no puede ejecutarse dentro de un bloque BEGIN transaccional regular en versiones antiguas,
    // pero si falla dentro de transacción se puede hacer por fuera.
    // Verificamos primero si ya existen los valores:
    const enumCheck = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'documentos_orden_tipodocumento_enum'
    `);
    const existingLabels = enumCheck.rows.map(r => r.enumlabel);

    await client.query('COMMIT');

    if (!existingLabels.includes('AUTORIZACION_PRESUPUESTO')) {
      await client.query(`ALTER TYPE documentos_orden_tipodocumento_enum ADD VALUE 'AUTORIZACION_PRESUPUESTO';`);
      console.log('  -> Agregado AUTORIZACION_PRESUPUESTO al enum.');
    }
    if (!existingLabels.includes('RECHAZO_PRESUPUESTO')) {
      await client.query(`ALTER TYPE documentos_orden_tipodocumento_enum ADD VALUE 'RECHAZO_PRESUPUESTO';`);
      console.log('  -> Agregado RECHAZO_PRESUPUESTO al enum.');
    }

    await client.query('BEGIN');

    // 5. Crear tabla autorizaciones_presupuesto
    console.log('5. Creando tabla autorizaciones_presupuesto...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS autorizaciones_presupuesto (
        id SERIAL PRIMARY KEY,
        "presupuestoId" INTEGER NOT NULL REFERENCES presupuesto(id) ON DELETE CASCADE,
        "ordenId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        "versionPresupuesto" INTEGER NOT NULL DEFAULT 1,
        decision VARCHAR(20) NOT NULL,
        modalidad VARCHAR(50) NOT NULL,
        "montoAprobado" NUMERIC(12, 2) NOT NULL DEFAULT 0,
        "alcanceResumen" JSONB NULL,
        "autorizanteNombre" VARCHAR(150) NOT NULL,
        "autorizanteIdentificacion" VARCHAR(20) NOT NULL,
        "autorizanteParentesco" VARCHAR(50) NOT NULL DEFAULT 'TITULAR',
        "documentoOrdenId" INTEGER NULL REFERENCES documentos_orden(id) ON DELETE SET NULL,
        "registradoPorId" INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
        "ipOrigen" VARCHAR(60) NULL,
        "userAgent" TEXT NULL,
        "hashIntegridad" VARCHAR(64) NOT NULL,
        "fechaAutorizacion" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_aut_presupuesto_orden ON autorizaciones_presupuesto ("ordenId");
      CREATE INDEX IF NOT EXISTS idx_aut_presupuesto_presupuesto ON autorizaciones_presupuesto ("presupuestoId");
    `);

    // 6. Backfill de token criptográfico para órdenes existentes sin token
    console.log('6. Generando credenciales seguras (128 bits) para órdenes históricas...');
    const ordersSinToken = await client.query(`
      SELECT id, "workOrderNumber" FROM orders WHERE "tokenAccesoHash" IS NULL
    `);

    for (const o of ordersSinToken.rows) {
      // 16 bytes = 128 bits de entropía
      const rawSecret = crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha256').update(rawSecret).digest('hex');
      const expiracion = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 días

      await client.query(`
        UPDATE orders 
        SET "tokenAccesoHash" = $1, "tokenAccesoExpiracion" = $2
        WHERE id = $3
      `, [hash, expiracion, o.id]);
    }
    console.log(`  -> Actualizadas ${ordersSinToken.rows.length} órdenes históricas con token hasheado.`);

    await client.query('COMMIT');
    console.log('✅ Migración de base de datos completada exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la migración:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
