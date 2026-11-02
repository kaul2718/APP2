const { Client } = require('pg');
const client = new Client({ host: 'localhost', user: 'postgres', password: '1234', database: 'hdc', port: 5432 });

async function check() {
  await client.connect();

  console.log('=== 1. ROLES DEL SISTEMA ===');
  const roles = await client.query('SELECT id, nombre, slug FROM roles');
  console.log(roles.rows);

  console.log('\n=== 2. DISTRIBUCIÓN DE USUARIOS POR ROL ===');
  const userCounts = await client.query(`
    SELECT r.slug, r.nombre, COUNT(u.id) as count
    FROM users u
    JOIN user_roles ur ON u.id = ur."userId"
    JOIN roles r ON ur."roleId" = r.id
    WHERE u."deletedAt" IS NULL
    GROUP BY r.slug, r.nombre
  `);
  console.log(userCounts.rows);

  console.log('\n=== 3. MUESTRA DE CLIENTES Y SUS CONTRASEÑAS ===');
  const sampleClients = await client.query(`
    SELECT u.id, u.cedula, u.nombre, u.apellido, u.correo, u.telefono, (u.password IS NOT NULL) as has_password
    FROM users u
    JOIN user_roles ur ON u.id = ur."userId"
    JOIN roles r ON ur."roleId" = r.id
    WHERE r.slug = 'client' AND u."deletedAt" IS NULL
    LIMIT 10
  `);
  console.log(sampleClients.rows);

  console.log('\n=== 4. ESTRUCTURA DE LA TABLA USERS (COLUMNAS, NULLABILITY, CONSTRAINTS) ===');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log(cols.rows);

  console.log('\n=== 5. ÍNDICES Y CONSTRAINTS EN USERS ===');
  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'users'::regclass
  `);
  console.log(constraints.rows);

  console.log('\n=== 6. RELACIÓN CON ORDERS ===');
  const ordersSchema = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'orders' AND (column_name LIKE '%client%' OR column_name LIKE '%user%' OR column_name = 'clientId')
  `);
  console.log(ordersSchema.rows);

  console.log('\n=== 7. PRESUPUESTOS Y APROBACIONES ===');
  const presupuestosCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'presupuesto'
    ORDER BY ordinal_position
  `);
  console.log(presupuestosCols.rows);

  console.log('\n=== 8. FIRMAS ELECTRÓNICAS Y DOCUMENTOS ===');
  const docsCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'documentos_orden'
    ORDER BY ordinal_position
  `);
  console.log(docsCols.rows);

  await client.end();
}

check().catch(console.error);
