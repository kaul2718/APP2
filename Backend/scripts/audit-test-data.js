const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditTestData() {
  console.log('========================================================================');
  console.log('    AUDITORÍA Y CATALOGACIÓN DE DATOS DE PRUEBA EN BASE DE DESARROLLO');
  console.log('========================================================================\n');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_DATABASE || 'hdc',
  });

  await client.connect();

  try {
    // 1. Equipos de prueba
    const testEquipos = await client.query(`
      SELECT id, "numeroSerie", "marcaId", "tipoEquipoId", "createdAt"
      FROM equipo
      WHERE "numeroSerie" LIKE 'TEST-SN-%'
      ORDER BY id DESC;
    `);
    console.log(`1. Equipos creados para pruebas de auditoría: ${testEquipos.rows.length}`);
    testEquipos.rows.forEach(e => {
      console.log(`   - ID #${e.id}: SN="${e.numeroSerie}", Creado: ${e.createdAt}`);
    });

    // 2. Órdenes de prueba (por clientRequestId o por vinculación a equipos de prueba)
    const testOrders = await client.query(`
      SELECT o.id, o."workOrderNumber", o."clientRequestId", o.version, o."problemaReportado", o."equipoId", o."createdAt"
      FROM orders o
      WHERE o."clientRequestId" LIKE 'test_req_%' 
         OR o."clientRequestId" LIKE 'sim_req_%'
         OR o."equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
      ORDER BY o.id DESC;
    `);
    console.log(`\n2. Órdenes creadas para pruebas de auditoría: ${testOrders.rows.length}`);
    testOrders.rows.forEach(o => {
      console.log(`   - ID #${o.id} (ODS #${o.workOrderNumber}): clientRequestId="${o.clientRequestId}", Version=${o.version}, Problema="${o.problemaReportado.substring(0, 40)}..."`);
    });

    // 3. Documentos de actas vinculados a órdenes de prueba
    const orderIds = testOrders.rows.map(o => o.id);
    let testDocs = { rows: [] };
    if (orderIds.length > 0) {
      testDocs = await client.query(`
        SELECT d.id, d."ordenId", d."tipoDocumento", d."estadoFirma", d."storageKeyPdf", d."pdfSha256"
        FROM documentos_orden d
        WHERE d."ordenId" = ANY($1)
        ORDER BY d.id DESC;
      `, [orderIds]);
    }
    console.log(`\n3. Documentos y actas generadas para pruebas: ${testDocs.rows.length}`);
    testDocs.rows.forEach(d => {
      console.log(`   - Doc #${d.id} (Orden #${d.ordenId}): Tipo=${d.tipoDocumento}, EstadoFirma=${d.estadoFirma}, PDF=${d.storageKeyPdf}`);
    });

    // 4. Usuarios creados para la auditoría
    const testUsers = await client.query(`
      SELECT id, nombre, apellido, correo, "createdAt"
      FROM users
      WHERE correo LIKE 'audit.%@hospital.test'
         OR correo LIKE '%@hospital.test'
      ORDER BY id DESC;
    `);
    console.log(`\n4. Usuarios de auditoría y pruebas: ${testUsers.rows.length}`);
    testUsers.rows.forEach(u => {
      console.log(`   - User #${u.id}: "${u.nombre} ${u.apellido || ''}" (${u.correo}), Creado: ${u.createdAt}`);
    });

    console.log('\n========================================================================');
    console.log('              RESUMEN DE REVISIÓN DE DATOS DE PRUEBA');
    console.log('========================================================================');
    console.log(`Total Equipos identificados exclusivamente de prueba: ${testEquipos.rows.length}`);
    console.log(`Total Órdenes identificadas exclusivamente de prueba: ${testOrders.rows.length}`);
    console.log(`Total Documentos vinculados a pruebas de auditoría  : ${testDocs.rows.length}`);
    console.log(`Total Cuentas de usuario exclusivas de auditoría    : ${testUsers.rows.length}`);
    console.log('Acción ejecutada: Ningún dato fue eliminado (Catálogo preventivo seguro).');
    console.log('========================================================================\n');

  } finally {
    await client.end();
  }
}

auditTestData().catch(err => {
  console.error('Error auditando datos de prueba:', err);
  process.exit(1);
});
