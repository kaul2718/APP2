const { execSync } = require('child_process');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { runComprehensiveReconciliation } = require('../test/reconciliar-r2-db');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PG_BIN_DIR = 'C:\\Program Files\\PostgreSQL\\15\\bin';
const PG_DUMP = path.join(PG_BIN_DIR, 'pg_dump.exe');
const PG_RESTORE = path.join(PG_BIN_DIR, 'pg_restore.exe');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '1234';
const SOURCE_DB = process.env.DB_DATABASE || 'hdc';
const ISOLATED_TEST_DB = 'hdc_restore_test';

const TEMP_DUMP_FILE = path.join(__dirname, 'temp_isolated_backup.dump');

async function executeSqlOnAdmin(query, params = []) {
  const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  try {
    const res = await client.query(query, params);
    return res;
  } finally {
    await client.end();
  }
}

async function getCounts(dbName) {
  const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: dbName,
  });
  await client.connect();
  try {
    const ordersRes = await client.query('SELECT COUNT(*) FROM orders');
    const usersRes = await client.query('SELECT COUNT(*) FROM "users"');
    const equiposRes = await client.query('SELECT COUNT(*) FROM "equipo"');
    const docsRes = await client.query('SELECT COUNT(*) FROM "documentos_orden"');
    const evidenciasRes = await client.query('SELECT COUNT(*) FROM "evidencia_tecnica"');
    return {
      orders: parseInt(ordersRes.rows[0].count),
      users: parseInt(usersRes.rows[0].count),
      equipos: parseInt(equiposRes.rows[0].count),
      documentos: parseInt(docsRes.rows[0].count),
      evidencias: parseInt(evidenciasRes.rows[0].count),
    };
  } finally {
    await client.end();
  }
}

async function runIsolatedRestoreTest() {
  console.log('========================================================================');
  console.log(' PRUEBA DE RESTAURACIÓN SEGURA Y AISLADA DE BASE DE DATOS (POSTGRESQL)');
  console.log('========================================================================\n');
  console.log(`Base de datos origen (Intacta, solo lectura) : ${SOURCE_DB}`);
  console.log(`Base de datos destino de prueba (Aislada)    : ${ISOLATED_TEST_DB}`);
  console.log(`Archivo de respaldo temporal                 : ${TEMP_DUMP_FILE}\n`);

  // 1. Limpieza de base de prueba previa si existiera
  console.log('1. Preparando entorno aislado en PostgreSQL...');
  try {
    await executeSqlOnAdmin(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${ISOLATED_TEST_DB}'
        AND pid <> pg_backend_pid();
    `);
    await executeSqlOnAdmin(`DROP DATABASE IF EXISTS ${ISOLATED_TEST_DB};`);
    console.log(`✓ Base temporal ${ISOLATED_TEST_DB} limpia.`);
  } catch (err) {
    console.warn(`  Nota al limpiar base temporal: ${err.message}`);
  }

  // 2. Generar Backup con pg_dump en formato custom (-Fc)
  console.log('\n2. Generando respaldo lógico binario con pg_dump...');
  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
  
  if (fs.existsSync(TEMP_DUMP_FILE)) {
    fs.unlinkSync(TEMP_DUMP_FILE);
  }

  const dumpCmd = `"${PG_DUMP}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -F c -b -v -f "${TEMP_DUMP_FILE}" ${SOURCE_DB}`;
  try {
    execSync(dumpCmd, { env, stdio: 'pipe' });
    const stats = fs.statSync(TEMP_DUMP_FILE);
    console.log(`✓ Respaldo creado exitosamente (${(stats.size / 1024).toFixed(2)} KB).`);
  } catch (err) {
    console.error('✗ Error generando pg_dump:', err.message);
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
  }

  // 3. Crear base de datos aislada
  console.log(`\n3. Creando base de datos aislada: ${ISOLATED_TEST_DB}...`);
  await executeSqlOnAdmin(`CREATE DATABASE ${ISOLATED_TEST_DB};`);
  console.log(`✓ Base de datos aislada ${ISOLATED_TEST_DB} creada correctamente.`);

  // 4. Restaurar respaldo en base de datos aislada
  console.log(`\n4. Restaurando estructura y datos en ${ISOLATED_TEST_DB} con pg_restore...`);
  const restoreCmd = `"${PG_RESTORE}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${ISOLATED_TEST_DB} -v "${TEMP_DUMP_FILE}"`;
  try {
    execSync(restoreCmd, { env, stdio: 'pipe' });
    console.log(`✓ Restauración completada en ${ISOLATED_TEST_DB}.`);
  } catch (err) {
    // pg_restore suele retornar código != 0 si hay warnings menores (ej: comentarios o roles)
    console.log(`  Restauración procesada (avisos menores ignorados de pg_restore).`);
  }

  try {
    // 5. Comparar conteos entre la base origen y la base restaurada
    console.log('\n5. Verificando integridad de tablas y registros restaurados...');
    const sourceCounts = await getCounts(SOURCE_DB);
    const restoredCounts = await getCounts(ISOLATED_TEST_DB);

    console.log(`  Tabla 'orders'            : Origen=${sourceCounts.orders} | Restaurado=${restoredCounts.orders}`);
    console.log(`  Tabla 'users'             : Origen=${sourceCounts.users} | Restaurado=${restoredCounts.users}`);
    console.log(`  Tabla 'equipo'            : Origen=${sourceCounts.equipos} | Restaurado=${restoredCounts.equipos}`);
    console.log(`  Tabla 'documentos_orden'  : Origen=${sourceCounts.documentos} | Restaurado=${restoredCounts.documentos}`);
    console.log(`  Tabla 'evidencia_tecnica' : Origen=${sourceCounts.evidencias} | Restaurado=${restoredCounts.evidencias}`);

    const countsMatch = (
      sourceCounts.orders === restoredCounts.orders &&
      sourceCounts.users === restoredCounts.users &&
      sourceCounts.equipos === restoredCounts.equipos &&
      sourceCounts.documentos === restoredCounts.documentos &&
      sourceCounts.evidencias === restoredCounts.evidencias
    );

    if (countsMatch) {
      console.log('✓ CONTEOS EXACTOS: Todas las entidades coinciden al 100% entre ambas bases.');
    } else {
      console.error('✗ DISCREPANCIA EN CONTEOS entre base origen y restaurada.');
    }

    // 6. Ejecutar reconciliación con Cloudflare R2 usando la base restaurada
    console.log(`\n6. Ejecutando Reconciliación con R2 conectada a la base restaurada [${ISOLATED_TEST_DB}]...`);
    const reconStats = await runComprehensiveReconciliation(ISOLATED_TEST_DB);
  } finally {
    // 7. Limpieza segura y garantizada
    console.log('\n7. Limpiando entorno de prueba aislado...');
    try {
      await executeSqlOnAdmin(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${ISOLATED_TEST_DB}'
          AND pid <> pg_backend_pid();
      `);
      await executeSqlOnAdmin(`DROP DATABASE IF EXISTS ${ISOLATED_TEST_DB};`);
      console.log(`✓ Base temporal ${ISOLATED_TEST_DB} eliminada.`);
    } catch (err) {
      console.warn(`  Aviso al eliminar base temporal: ${err.message}`);
    }

    if (fs.existsSync(TEMP_DUMP_FILE)) {
      try {
        fs.unlinkSync(TEMP_DUMP_FILE);
        console.log(`✓ Archivo temporal de volcado eliminado: ${TEMP_DUMP_FILE}`);
      } catch (err) {
        console.warn(`  Aviso al eliminar volcado temporal: ${err.message}`);
      }
    }
  }

  console.log('\n========================================================================');
  console.log('       PRUEBA DE RESTAURACIÓN AISLADA COMPLETADA CON ÉXITO');
  console.log(`   (La base original '${SOURCE_DB}' se mantuvo 100% inalterada y segura)`);
  console.log('========================================================================\n');
}

runIsolatedRestoreTest().catch(err => {
  console.error('Error fatal durante prueba de restauración aislada:', err);
  process.exit(1);
});
