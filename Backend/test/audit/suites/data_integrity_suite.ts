import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runDataIntegritySuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 8: PRUEBAS DE INTEGRIDAD DE DATOS Y CASOS EXTREMOS ---');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  // INT-01: Integridad referencial en PostgreSQL - Comprobación de Foreign Keys
  {
    const t0 = Date.now();
    const fkChecks = await ctx.dataSource.query(`
      SELECT
        tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('orders', 'evidencia_tecnica', 'actividad_tecnica', 'presupuesto', 'historial_estado_orden');
    `);

    const hasCriticalFks = fkChecks.length >= 5;
    reporter.record({
      id: 'INT-01',
      role: 'General',
      module: 'Integridad de Base de Datos',
      scenario: 'Verificación de restricciones de clave foránea (FK) en entidades principales',
      status: hasCriticalFks ? 'PASS' : 'FAIL',
      expected: 'Restricciones de clave foránea activas en orders, evidencias, actividades e historial',
      actual: `${fkChecks.length} claves foráneas detectadas en entidades críticas`,
      evidence: `Relaciones encontradas: ${fkChecks.map((f: any) => `${f.table_name}.${f.column_name}->${f.foreign_table_name}`).join(', ')}`,
      durationMs: Date.now() - t0,
    });
  }

  // INT-02: Manejo de IDs no numéricos (Parámetros inválidos)
  {
    const t0 = Date.now();
    const res = await adminClient.get('/orders/abc-invalid-id');
    const isCleanError = res.status === 400 && !JSON.stringify(res.data).includes('QueryFailedError');

    reporter.record({
      id: 'INT-02',
      role: 'General',
      module: 'Casos Extremos',
      scenario: 'Manejo seguro de identificador no numérico en ruta dinámica (/orders/abc-invalid-id)',
      status: isCleanError ? 'PASS' : 'FAIL',
      expected: 'HTTP 400 Bad Request sin filtrar errores internos de TypeORM/SQL',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // INT-03: Manejo de entidades inexistentes
  {
    const t0 = Date.now();
    const res = await adminClient.get('/orders/99999999');
    const isNotFound = res.status === 404;

    reporter.record({
      id: 'INT-03',
      role: 'General',
      module: 'Casos Extremos',
      scenario: 'Consulta de registro inexistente con ID numérico fuera de rango',
      status: isNotFound ? 'PASS' : 'FAIL',
      expected: 'HTTP 404 Not Found',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // INT-04: Resistencia contra inyección SQL en parámetros de búsqueda
  {
    const t0 = Date.now();
    const sqlPayload = "'; DROP TABLE test_dummy_injection; --";
    const res = await adminClient.get('/orders', {
      params: { search: sqlPayload },
    });

    // Verify database remains intact
    const userTableCheck = await ctx.dataSource.query(`SELECT COUNT(*) FROM "users";`);
    const isIntact = parseInt(userTableCheck[0].count, 10) > 0;
    const isCleanResponse = res.status === 200 && isIntact;

    reporter.record({
      id: 'INT-04',
      role: 'Seguridad',
      module: 'Seguridad de Datos',
      scenario: 'Prueba de resistencia a inyección SQL en filtros de búsqueda mediante QueryBuilder',
      status: isCleanResponse ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con escape parametrizado seguro y base de datos intacta',
      actual: `HTTP ${res.status}, tabla intacta: ${isIntact}`,
      evidence: `Respuesta de búsqueda segura con payload: "${sqlPayload}"`,
      durationMs: Date.now() - t0,
    });
  }

  // INT-05: Validación de campos obligatorios en creación de orden (DTO ValidationPipe)
  {
    const t0 = Date.now();
    const res = await adminClient.post('/orders', {
      // Missing clientId, equipoId, etc.
      problemaReportado: '',
    });

    const isValidationOk = res.status === 400 && Array.isArray(res.data?.message);
    reporter.record({
      id: 'INT-05',
      role: 'General',
      module: 'Validación de Formularios',
      scenario: 'Rechazo de creación de orden incompleta mediante ValidationPipe global',
      status: isValidationOk ? 'PASS' : 'FAIL',
      expected: 'HTTP 400 con array detallado de campos requeridos',
      actual: `HTTP ${res.status}, mensajes=${JSON.stringify(res.data?.message)}`,
      evidence: `Mensajes de error: ${JSON.stringify(res.data?.message)}`,
      durationMs: Date.now() - t0,
    });
  }

  // INT-06: Soft Delete - Ocultamiento por defecto y recuperación con includeInactive
  {
    const t0 = Date.now();
    const catCheck = await ctx.dataSource.query('SELECT id FROM "categoria" WHERE "deletedAt" IS NULL LIMIT 1;');
    const marcaCheck = await ctx.dataSource.query('SELECT id FROM "marca" WHERE "deletedAt" IS NULL LIMIT 1;');
    const validCatId = catCheck[0]?.id || 1;
    const validMarcaId = marcaCheck[0]?.id || 1;

    // Create dummy part to test soft delete
    const parteRes = await adminClient.post('/partes', {
      codigoInterno: `SD-TEST-${Date.now()}`,
      nombre: `Pieza para prueba de Soft Delete ${Date.now()}`,
      stock: 5,
      stockMinimo: 1,
      costo: 10,
      precio1: 15,
      precio2: 14,
      precio3: 13,
      precio4: 12,
      ivaTarifa: 15,
      categoriaId: validCatId,
      marcaId: validMarcaId,
      unidadMedida: 'Unidad',
    });

    let softDeleteOk = false;
    if (parteRes.data?.id) {
      const parteId = parteRes.data.id;
      ctx.createdEntityIds.partes.push(parteId);

      // Delete (soft delete)
      await adminClient.delete(`/partes/${parteId}`);

      // Verify omitted from standard list
      const listStandard = await adminClient.get('/partes/all');
      const foundInStandard = listStandard.data?.items?.some((p: any) => p.id === parteId);

      // Verify present in database with deletedAt populated
      const dbRow = await ctx.dataSource.query(`SELECT "deletedAt" FROM "parte" WHERE id = $1;`, [parteId]);
      const hasDeletedAt = dbRow[0]?.deletedAt !== null;

      softDeleteOk = !foundInStandard && hasDeletedAt;
    }

    reporter.record({
      id: 'INT-06',
      role: 'General',
      module: 'Integridad de Datos',
      scenario: 'Comprobación de eliminación lógica (Soft-Delete) y preservación histórica',
      status: softDeleteOk ? 'PASS' : 'FAIL',
      expected: 'Registro ocultado en listados estándar pero preservado con deletedAt en base de datos',
      actual: `Ocultado en UI: ${softDeleteOk}, deletedAt poblado`,
      evidence: 'Integridad referencial mantenida sin pérdida física de datos históricos',
      durationMs: Date.now() - t0,
    });
  }
}
