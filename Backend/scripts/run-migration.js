const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'hdc',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log(`✓ Conectado a PostgreSQL [${process.env.DB_DATABASE || 'hdc'}]`);

    // 1. Crear tabla de control de versiones de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_migrations_history" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "checksum_sha256" VARCHAR(64) NOT NULL,
        "execution_time_ms" INTEGER NOT NULL,
        "executed_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Obtener lista de migraciones ya ejecutadas
    const executedRes = await client.query('SELECT name, checksum_sha256 FROM "_migrations_history"');
    const executedMap = new Map(executedRes.rows.map((r) => [r.name, r.checksum_sha256]));

    // 3. Buscar archivos .sql directamente en Backend/sql (omitiendo subdirectorios como legacy_patches)
    const sqlDir = path.join(__dirname, '../sql');
    const files = fs
      .readdirSync(sqlDir)
      .filter((item) => {
        const fullPath = path.join(sqlDir, item);
        return fs.statSync(fullPath).isFile() && item.endsWith('.sql');
      })
      .sort();

    console.log(`Archivos de migración oficiales encontrados: ${files.length}`);

    let executedCount = 0;
    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

      if (executedMap.has(file)) {
        console.log(`  ⏭ [OMITIDA] ${file} ya fue aplicada previamente.`);
        continue;
      }

      console.log(`  ⏳ [EJECUTANDO] ${file}...`);
      const startTime = Date.now();

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        const duration = Date.now() - startTime;
        await client.query(
          'INSERT INTO "_migrations_history" ("name", "checksum_sha256", "execution_time_ms") VALUES ($1, $2, $3)',
          [file, checksum, duration],
        );
        await client.query('COMMIT');
        console.log(`  ✅ [ÉXITO] ${file} aplicada en ${duration}ms (Checksum: ${checksum.substring(0, 12)}...)`);
        executedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`  ❌ [ERROR] Falló la migración ${file}:`, migrationErr.message);
        throw migrationErr;
      }
    }

    // 4. Verificación de integridad básica de tablas principales
    const tablesCheck = await client.query(`
      SELECT count(*)::int as total 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log(`\n✓ Migraciones completadas (${executedCount} nuevas ejecutadas). Tablas activas en esquema público: ${tablesCheck.rows[0].total}`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error fatal durante la ejecución de migraciones:', err.message);
    process.exit(1);
  }
}

runMigrations();
