import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspectDb() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_DATABASE || 'hdc',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    await dataSource.initialize();
    console.log(`Connected to database: ${process.env.DB_DATABASE} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    // 1. Tables count
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`\n--- TABLES FOUND (${tables.length}) ---`);
    for (const t of tables) {
      const [{ count }] = await dataSource.query(`SELECT COUNT(*) FROM "${t.table_name}";`);
      console.log(`  - ${t.table_name}: ${count} rows`);
    }

    // 2. Roles
    const roles = await dataSource.query(`SELECT id, nombre, slug FROM "roles" ORDER BY id;`);
    console.log('\n--- ROLES IN DB ---');
    console.table(roles);

    // 3. Estado Orden
    const estados = await dataSource.query(`SELECT id, nombre, estado FROM "estado_orden" ORDER BY id;`);
    console.log('\n--- ESTADOS DE ORDEN IN DB ---');
    console.table(estados);

    // 4. Sample Users with Roles
    const users = await dataSource.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.cedula,
             string_agg(r.slug, ', ') as user_roles
      FROM "users" u
      LEFT JOIN "user_roles" ur ON ur."userId" = u.id
      LEFT JOIN "roles" r ON r.id = ur."roleId"
      GROUP BY u.id, u.nombre, u.apellido, u.correo, u.cedula
      ORDER BY u.id
      LIMIT 25;
    `);
    // 5. Sample Orders with Client, Tech, Estado
    const orders = await dataSource.query(`
      SELECT o.id, o."workOrderNumber", o."problemaReportado", o."clientId", o."technicianId",
             eo.nombre as estado_nombre
      FROM "orders" o
      LEFT JOIN "estado_orden" eo ON eo.id = o."estadoOrdenId"
      ORDER BY o.id DESC
      LIMIT 10;
    `);
    console.log('\n--- SAMPLE ORDERS IN DB ---');
    console.table(orders);

    await dataSource.destroy();
  } catch (err: any) {
    console.error('Error connecting to DB:', err.message);
  }
}

inspectDb();
