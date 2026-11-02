import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runAdminSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 2: PRUEBAS DEL ROL ADMINISTRADOR ---');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  // ADM-01: Dashboard KPIs vs PostgreSQL
  {
    const t0 = Date.now();
    const res = await adminClient.get('/dashboard/admin?range=30d');
    const dbTotalOrders = await ctx.dataSource.query(
      `SELECT COUNT(*) FROM "orders" WHERE "deletedAt" IS NULL AND "createdAt" >= NOW() - INTERVAL '30 days';`
    );
    const expectedTotal = parseInt(dbTotalOrders[0].count, 10);

    const kpiTotalObj = res.data?.kpis?.find((k: any) => k.key === 'total-orders');
    const kpiTotal = kpiTotalObj?.value;

    const matches = res.status === 200 && kpiTotal === expectedTotal;
    reporter.record({
      id: 'ADM-01',
      role: 'Administrador',
      module: 'Dashboard',
      scenario: 'Consistencia de indicadores KPI de Dashboard contra base de datos PostgreSQL (Filtro 30d)',
      status: matches ? 'PASS' : 'FAIL',
      expected: `HTTP 200 con total-orders=${expectedTotal}`,
      actual: `HTTP ${res.status}, total-orders=${kpiTotal}`,
      evidence: `KPIs retornados: ${JSON.stringify(res.data?.kpis)}`,
      durationMs: Date.now() - t0,
    });
  }

  // ADM-02: Gestión de usuarios - Registro con rol técnico
  let createdUserId: number | null = null;
  {
    const t0 = Date.now();
    const testCedula = ctx.generateValidCedula('176');
    const res = await adminClient.post('/users', {
      cedula: testCedula,
      nombre: 'Usuario AdminTest',
      apellido: 'Técnico Creado',
      correo: `test.tech.${Date.now()}@hdc.test`,
      telefono: '0987654321',
      direccion: 'Sector Norte',
      ciudad: 'Quito',
      password: 'StrongPassword123!',
      roleIds: [2], // 2 = Tech
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      createdUserId = res.data.id;
      ctx.createdEntityIds.users.push(createdUserId);
    }

    reporter.record({
      id: 'ADM-02',
      role: 'Administrador',
      module: 'Gestión de Usuarios',
      scenario: 'Creación de un nuevo usuario con asignación de rol técnico',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de usuario generado',
      actual: `HTTP ${res.status}, ID=${res.data?.id}`,
      evidence: `Creado usuario ID ${res.data?.id}, cédula: ${testCedula}`,
      durationMs: Date.now() - t0,
    });
  }

  // ADM-03: Gestión de usuarios - Edición de datos
  if (createdUserId) {
    const t0 = Date.now();
    const res = await adminClient.patch(`/users/${createdUserId}`, {
      nombre: 'Usuario AdminTest Modificado',
      telefono: '0999999999',
    });

    const isSuccess = res.status === 200 && res.data?.nombre === 'Usuario AdminTest Modificado';
    reporter.record({
      id: 'ADM-03',
      role: 'Administrador',
      module: 'Gestión de Usuarios',
      scenario: 'Edición de información de usuario existente',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con nombre actualizado',
      actual: `HTTP ${res.status}, nombre=${res.data?.nombre}`,
      evidence: `Nombre en respuesta: ${res.data?.nombre}`,
      durationMs: Date.now() - t0,
    });
  }

  // ADM-04: Gestión de usuarios - Alternar estado (activo / inactivo)
  if (createdUserId) {
    const t0 = Date.now();
    const res = await adminClient.patch(`/users/${createdUserId}/toggle-status`);
    const isSuccess = res.status === 200 && typeof res.data?.estado === 'boolean';

    reporter.record({
      id: 'ADM-04',
      role: 'Administrador',
      module: 'Gestión de Usuarios',
      scenario: 'Cambio de estado activo/inactivo de un usuario',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con propiedad estado alternada',
      actual: `HTTP ${res.status}, nuevo estado=${res.data?.estado}`,
      evidence: `Estado resultante: ${res.data?.estado}`,
      durationMs: Date.now() - t0,
    });
  }

  // ADM-05: Inventario y Repuestos - Creación de parte con datos válidos
  let createdParteId: number | null = null;
  {
    const t0 = Date.now();
    const catCheck = await ctx.dataSource.query('SELECT id FROM "categoria" WHERE "deletedAt" IS NULL LIMIT 1;');
    const marcaCheck = await ctx.dataSource.query('SELECT id FROM "marca" WHERE "deletedAt" IS NULL LIMIT 1;');
    const validCatId = catCheck[0]?.id || 1;
    const validMarcaId = marcaCheck[0]?.id || 1;

    const res = await adminClient.post('/partes', {
      nombre: `Módulo RAM DDR4 16GB Kingston Test ${Date.now()}`,
      descripcion: 'Memoria RAM para pruebas de auditoría',
      codigoInterno: `REP-TEST-${Date.now()}`,
      categoriaId: validCatId,
      marcaId: validMarcaId,
      costo: 35.5,
      precio1: 55.0,
      precio2: 50.0,
      precio3: 48.0,
      precio4: 45.0,
      ivaTarifa: 15,
      stock: 10,
      stockMinimo: 2,
      unidadMedida: 'Unidad',
      ubicacion: 'Estante A1',
      estado: true,
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      createdParteId = res.data.id;
      ctx.createdEntityIds.partes.push(createdParteId);
    }

    reporter.record({
      id: 'ADM-05',
      role: 'Administrador',
      module: 'Inventario y Almacén',
      scenario: 'Registro de nuevo repuesto en inventario con precios y stock',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de parte generado',
      actual: `HTTP ${res.status}, parteId=${res.data?.id}`,
      evidence: `Parte ID: ${res.data?.id}, Nombre: ${res.data?.nombre}`,
      durationMs: Date.now() - t0,
    });
  }

  // ADM-06: Inventario y Repuestos - Rechazo de stock o precios negativos
  {
    const t0 = Date.now();
    const res = await adminClient.post('/partes', {
      nombre: 'Parte Inválida',
      categoriaId: 1,
      costo: -10, // Inválido
      precio1: 20,
      precio2: 20,
      precio3: 20,
      precio4: 20,
      ivaTarifa: 15,
      stock: -5, // Inválido
      stockMinimo: 1,
    });

    const rejected = res.status === 400;
    reporter.record({
      id: 'ADM-06',
      role: 'Administrador',
      module: 'Inventario y Almacén',
      scenario: 'Validación de cantidades y precios negativos en inventario',
      status: rejected ? 'PASS' : 'FAIL',
      expected: 'HTTP 400 Bad Request',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // ADM-07: Roles y Permisos - Consulta de matriz RBAC
  {
    const t0 = Date.now();
    const resRoles = await adminClient.get('/roles');
    const resPerms = await adminClient.get('/permissions');

    const isSuccess =
      resRoles.status === 200 &&
      resPerms.status === 200 &&
      Array.isArray(resRoles.data) &&
      Array.isArray(resPerms.data);

    reporter.record({
      id: 'ADM-07',
      role: 'Administrador',
      module: 'Roles y Permisos',
      scenario: 'Consulta administrativa de catálogo de roles y permisos del sistema',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 en /roles y /permissions',
      actual: `HTTP ${resRoles.status} (roles count: ${resRoles.data?.length}), HTTP ${resPerms.status} (perms count: ${resPerms.data?.length})`,
      evidence: `Roles registrados: ${resRoles.data?.map((r: any) => r.slug).join(', ')}`,
      durationMs: Date.now() - t0,
    });
  }
}
