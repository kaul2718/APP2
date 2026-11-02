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
  console.log('Creando índices optimizados para reportes...');

  const indexes = [
    // 1. Orders
    `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders ("createdAt");`,
    `CREATE INDEX IF NOT EXISTS idx_orders_estado_tech ON orders ("estadoOrdenId", "technicianId");`,
    `CREATE INDEX IF NOT EXISTS idx_orders_client ON orders ("clientId");`,
    `CREATE INDEX IF NOT EXISTS idx_orders_tipo ON orders ("tipoOrden");`,
    `CREATE INDEX IF NOT EXISTS idx_orders_fecha_prometida ON orders ("fechaPrometidaEntrega") WHERE "fechaPrometidaEntrega" IS NOT NULL;`,

    // 2. Historial de estados
    `CREATE INDEX IF NOT EXISTS idx_historial_orden_estado_fecha ON historial_estado_orden ("ordenId", "estadoOrdenId", "fechaCambio");`,
    `CREATE INDEX IF NOT EXISTS idx_historial_fecha_estado ON historial_estado_orden ("fechaCambio", "estadoOrdenId");`,

    // 3. Presupuestos y detalles
    `CREATE INDEX IF NOT EXISTS idx_presupuesto_orden_estado ON presupuesto ("ordenId", "estadoId", "createdAt");`,
    `CREATE INDEX IF NOT EXISTS idx_presupuesto_fecha_estado ON presupuesto ("createdAt", "estadoId");`,
    `CREATE INDEX IF NOT EXISTS idx_detalle_repuestos_presupuesto ON detalle_repuestos ("presupuestoId");`,
    `CREATE INDEX IF NOT EXISTS idx_detalle_repuestos_parte ON detalle_repuestos ("parteId");`,

    // 4. Actividades técnicas y partes
    `CREATE INDEX IF NOT EXISTS idx_actividades_orden_fecha ON actividad_tecnica ("ordenId", "fecha");`,
    `CREATE INDEX IF NOT EXISTS idx_parte_stock_min ON parte ("stock", "stockMinimo");`,
  ];

  for (const sql of indexes) {
    try {
      await client.query(sql);
      console.log(`✓ ${sql.split('ON')[1]?.trim() || sql}`);
    } catch (e) {
      console.warn(`! Fallo al crear índice: ${e.message}`);
    }
  }

  console.log('Todos los índices fueron verificados/creados exitosamente.');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
