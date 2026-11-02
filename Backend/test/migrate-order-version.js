const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_DATABASE || 'hdc',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL.');

    await client.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
    `);
    console.log('Columna version agregada/verificada en tabla orders.');

    const res = await client.query(`
      SELECT id, "workOrderNumber", version FROM "orders" ORDER BY id DESC LIMIT 5;
    `);
    console.log('Muestra de órdenes:');
    console.table(res.rows);

    await client.end();
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}

migrate();
