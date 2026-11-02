const { Client } = require('pg');
const client = new Client({ host: 'localhost', user: 'postgres', password: '1234', database: 'hdc', port: 5432 });

async function check() {
  await client.connect();
  const res = await client.query('SELECT COUNT(*) as total_presupuestos FROM presupuesto WHERE "deletedAt" IS NULL');
  console.log('Total presupuestos en base de datos:', res.rows[0]);
  const srvInPres = await client.query(`
    SELECT COUNT(d.id) as total_servicios_cotizados
    FROM detalle_repuestos d
    JOIN parte p ON d."parteId" = p.id
    WHERE p."unidadMedida" = 'Servicio'
  `);
  console.log('Servicios cotizados históricamente:', srvInPres.rows[0]);
  await client.end();
}

check().catch(console.error);
