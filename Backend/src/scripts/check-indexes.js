const { Client } = require('pg');
require('dotenv').config({ path: 'c:/APP2/Backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hdc',
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    ORDER BY ordinal_position;
  `);
  console.log('COLUMNS OF ORDERS:');
  res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
