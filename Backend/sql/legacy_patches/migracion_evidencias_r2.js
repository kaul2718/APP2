const { Client } = require('c:/APP2/Backend/node_modules/pg');

async function migrate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'hdc',
    user: 'postgres',
    password: '1234',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    await client.query(`
      ALTER TABLE evidencia_tecnica 
        ADD COLUMN IF NOT EXISTS "storageKey" VARCHAR(500),
        ADD COLUMN IF NOT EXISTS "nombreOriginal" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "mimeType" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "tamanoBytes" BIGINT,
        ADD COLUMN IF NOT EXISTS "storageProvider" VARCHAR(30) DEFAULT 'r2';
    `);

    await client.query(`
      ALTER TABLE evidencia_tecnica ALTER COLUMN "archivoUrl" DROP NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_evidencia_storage_key" ON evidencia_tecnica ("storageKey");
    `);

    console.log('Migration successfully applied to evidencia_tecnica.');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'evidencia_tecnica' 
      ORDER BY ordinal_position;
    `);
    console.log('Updated columns:');
    console.log(JSON.stringify(res.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error applying migration:', err.message);
    process.exit(1);
  }
}

migrate();
