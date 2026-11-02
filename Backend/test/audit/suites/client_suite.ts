import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runClientSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 5: PRUEBAS DEL CLIENTE Y PORTAL PÚBLICO ---');
  const clientAuth = await ctx.getAuthenticatedClient('client');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  // Create an order for our test client
  let clientOrderId: number;
  let clientWorkOrderNumber: string;

  // Ensure valid equipment exists for client
  const eqCheck = await ctx.dataSource.query('SELECT id FROM "equipo" WHERE "deletedAt" IS NULL LIMIT 1;');
  let validEquipoId = eqCheck[0]?.id;
  if (!validEquipoId) {
    const eqRes = await adminClient.post('/equipos', {
      numeroSerie: `CLIENT-TEST-EQ-${Date.now()}`,
      tipoEquipoId: 1,
      marcaId: 1,
      modeloId: 1,
      estadoFisico: 'Buen estado',
      passwordEquipo: 'sin-clave',
    });
    validEquipoId = eqRes.data.id;
    ctx.createdEntityIds.equipos.push(validEquipoId);
  }

  const orderRes = await adminClient.post('/orders', {
    clientId: ctx.testUsers.client!.id,
    equipoId: validEquipoId,
    recepcionistaId: ctx.testUsers.recep!.id,
    technicianId: ctx.testUsers.tech!.id,
    problemaReportado: 'Teclado no responde tras derrame de líquido',
    accesorios: ['Cargador original'],
    estadoOrdenId: 12, // Recepción
  });

  if (!orderRes.data?.id) {
    throw new Error(`Failed to provision client test order: ${JSON.stringify(orderRes.data)}`);
  }
  clientOrderId = orderRes.data.id;
  clientWorkOrderNumber = orderRes.data.workOrderNumber;
  ctx.createdEntityIds.orders.push(clientOrderId);

  // CLI-01: Consulta pública válida (Cédula + N° de Orden)
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.get('/orders/public/consulta', {
      params: {
        cedula: ctx.testUsers.client!.cedula,
        workorder: clientWorkOrderNumber,
      },
    });

    const isSuccess = res.status === 200 && Boolean(res.data?.workOrderNumber);
    const hasSensitiveData = Boolean(res.data?.client?.password || res.data?.equipo?.passwordEquipo);

    reporter.record({
      id: 'CLI-01',
      role: 'Cliente',
      module: 'Portal Público de Consulta',
      scenario: 'Consulta válida de orden en portal público sin autenticación (Cédula + OT)',
      status: isSuccess && !hasSensitiveData ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con datos de orden y sin contraseñas expuestas',
      actual: `HTTP ${res.status}, workOrderNumber='${res.data?.workOrderNumber}', passLeaked=${hasSensitiveData}`,
      evidence: `Datos visibles: Cliente='${res.data?.cliente?.nombre || res.data?.client?.nombre}', Estado='${res.data?.estadoOrden?.nombre}'`,
      durationMs: Date.now() - t0,
    });
  }

  // CLI-02: Consulta pública con orden inexistente
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.get('/orders/public/consulta', {
      params: {
        cedula: ctx.testUsers.client!.cedula,
        workorder: 'NON_EXISTENT_99999',
      },
    });

    const isNotFound = res.status === 404;
    reporter.record({
      id: 'CLI-02',
      role: 'Cliente',
      module: 'Portal Público de Consulta',
      scenario: 'Búsqueda de orden inexistente en portal público',
      status: isNotFound ? 'PASS' : 'FAIL',
      expected: 'HTTP 404 Not Found',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // CLI-03: Consulta pública con cédula no coincidente (Intento IDOR)
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.get('/orders/public/consulta', {
      params: {
        cedula: '1712345678', // Different cedula
        workorder: clientWorkOrderNumber,
      },
    });

    const isBlocked = res.status === 404 || res.status === 400 || res.status === 403;
    reporter.record({
      id: 'CLI-03',
      role: 'Cliente',
      module: 'Seguridad y Privacidad',
      scenario: 'Protección contra enumeración: Cédula incorrecta para orden legítima',
      status: isBlocked ? 'PASS' : 'FAIL',
      expected: 'HTTP 404/400/403 (No exponer datos de orden si la cédula no coincide)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // CLI-04: Cliente autenticado consulta sus propias órdenes
  {
    const t0 = Date.now();
    const res = await clientAuth.get('/orders/my-orders');
    const isSuccess = res.status === 200 && (Array.isArray(res.data?.items) || Array.isArray(res.data));

    reporter.record({
      id: 'CLI-04',
      role: 'Cliente',
      module: 'Panel del Cliente',
      scenario: 'Cliente autenticado consulta el listado de sus órdenes de servicio',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con listado paginado de órdenes del cliente',
      actual: `HTTP ${res.status}, total=${res.data?.totalItems || res.data?.length}`,
      evidence: `Órdenes devueltas: ${JSON.stringify(res.data?.items?.map((o: any) => o.id))}`,
      durationMs: Date.now() - t0,
    });
  }

  // CLI-05: Seguridad IDOR - Cliente intentando consultar evidencias de orden ajena
  {
    const t0 = Date.now();
    // Order 22 belongs to client 82, not our test client
    const foreignOrderId = 22;
    const res = await clientAuth.get(`/evidencias-tecnicas?ordenId=${foreignOrderId}&page=1&limit=10`);

    const isForbidden = res.status === 403;
    reporter.record({
      id: 'CLI-05',
      role: 'Cliente',
      module: 'Seguridad y Privacidad (IDOR)',
      scenario: 'Cliente autenticado intentando consultar evidencias técnicas de una orden ajena',
      status: isForbidden ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Aislamiento de evidencias por cliente)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // CLI-06: Restricción - Cliente NO puede modificar órdenes ni diagnósticos
  {
    const t0 = Date.now();
    const res = await clientAuth.patch(`/orders/${clientOrderId}`, {
      diagnostico: 'HACKED BY CLIENT',
    });

    const isForbidden = res.status === 403;
    reporter.record({
      id: 'CLI-06',
      role: 'Cliente',
      module: 'Seguridad y Autorización',
      scenario: 'Intento de modificación de orden o diagnóstico por rol cliente (Debe ser 403)',
      status: isForbidden ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }
}
