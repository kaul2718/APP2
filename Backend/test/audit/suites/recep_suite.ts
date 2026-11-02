import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runRecepSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 3: PRUEBAS DEL ROL RECEPCIONISTA ---');
  const recepClient = await ctx.getAuthenticatedClient('recep');

  // REC-01: Registro de nuevo cliente
  let newClientId: number | null = null;
  let clientCedula: string = '';
  {
    const t0 = Date.now();
    clientCedula = ctx.generateValidCedula('177');
    const res = await recepClient.post('/users', {
      cedula: clientCedula,
      nombre: 'Cliente Carlos',
      apellido: 'Montalvo Test',
      correo: `carlos.cliente.${Date.now()}@hdc.test`,
      telefono: '0981122334',
      direccion: 'Av. Amazonas y Colón',
      ciudad: 'Quito',
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      newClientId = res.data.id;
      ctx.createdEntityIds.users.push(newClientId);
    }

    reporter.record({
      id: 'REC-01',
      role: 'Recepcionista',
      module: 'Registro de Clientes',
      scenario: 'Registro de un cliente nuevo con validación de cédula ecuatoriana',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de cliente creado',
      actual: `HTTP ${res.status}, ID=${res.data?.id}`,
      evidence: `Cliente ID: ${res.data?.id}, Cédula: ${clientCedula}`,
      durationMs: Date.now() - t0,
    });
  }

  // REC-02: Manejo de datos duplicados (cédula ya existente)
  {
    const t0 = Date.now();
    const res = await recepClient.post('/users', {
      cedula: clientCedula, // Duplicate cedula
      nombre: 'Cliente Duplicado',
      apellido: 'Error',
      correo: `duplicate.${Date.now()}@hdc.test`,
      telefono: '0981122339',
      direccion: 'Calle Falsa',
      ciudad: 'Quito',
    });

    const isRejected = res.status === 400;
    reporter.record({
      id: 'REC-02',
      role: 'Recepcionista',
      module: 'Registro de Clientes',
      scenario: 'Rechazo de registro con cédula ya existente',
      status: isRejected ? 'PASS' : 'FAIL',
      expected: 'HTTP 400 Bad Request',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // REC-03: Búsqueda de clientes existentes
  {
    const t0 = Date.now();
    const res = await recepClient.get(`/users/all?search=${clientCedula}`);
    const isSuccess = res.status === 200 && res.data?.items?.some((u: any) => u.cedula === clientCedula);

    reporter.record({
      id: 'REC-03',
      role: 'Recepcionista',
      module: 'Gestión de Clientes',
      scenario: 'Búsqueda de clientes por número de cédula',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: `HTTP 200 conteniendo al cliente con cédula ${clientCedula}`,
      actual: `HTTP ${res.status}, encontrados: ${res.data?.items?.length}`,
      evidence: `Total encontrados: ${res.data?.totalItems}`,
      durationMs: Date.now() - t0,
    });
  }

  // REC-04: Registro de equipo tecnológico asociado al cliente
  let newEquipoId: number | null = null;
  if (newClientId) {
    const t0 = Date.now();
    const serial = `SN-HP-${Date.now()}`;
    const res = await recepClient.post('/equipos', {
      numeroSerie: serial,
      tipoEquipoId: 1, // Laptop / Computador
      marcaId: 1, // HP
      modeloId: 1, // Modelo existente
      estado: true,
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      newEquipoId = res.data.id;
      ctx.createdEntityIds.equipos.push(newEquipoId);
    }

    reporter.record({
      id: 'REC-04',
      role: 'Recepcionista',
      module: 'Registro de Equipos',
      scenario: 'Ingreso de equipo tecnológico asociado al cliente',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de equipo generado',
      actual: `HTTP ${res.status}, equipoId=${res.data?.id}`,
      evidence: `Equipo ID: ${res.data?.id}, Serie: ${res.data?.numeroSerie}`,
      durationMs: Date.now() - t0,
    });
  }

  // REC-05: Creación de orden de servicio (Recepción de equipo)
  let newOrderId: number | null = null;
  let workOrderNumber: string = '';
  if (newClientId && newEquipoId) {
    const t0 = Date.now();
    const res = await recepClient.post('/orders', {
      clientId: newClientId,
      equipoId: newEquipoId,
      recepcionistaId: ctx.testUsers.recep!.id,
      technicianId: ctx.testUsers.tech!.id,
      problemaReportado: 'Laptop no enciende tras tormenta eléctrica. Posible daño en fuente o placa madre.',
      accesorios: ['Cargador original HP', 'Estuche protector'],
      estadoOrdenId: 12, // Estado: 'Recepción'
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      newOrderId = res.data.id;
      workOrderNumber = res.data.workOrderNumber;
      ctx.createdEntityIds.orders.push(newOrderId);
    }

    reporter.record({
      id: 'REC-05',
      role: 'Recepcionista',
      module: 'Creación de Órdenes',
      scenario: 'Creación completa de orden de servicio inicial con cliente y equipo',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con workOrderNumber generado y estado inicial asignado',
      actual: `HTTP ${res.status}, orderId=${res.data?.id}, workOrderNumber=${res.data?.workOrderNumber}`,
      evidence: `Orden creada #${res.data?.workOrderNumber}, ID: ${res.data?.id}, Estado: ${res.data?.estadoOrden?.nombre || res.data?.estadoOrdenId}`,
      durationMs: Date.now() - t0,
    });
  }

  // REC-06: Restricción de seguridad - Recepcionista NO puede eliminar usuarios
  {
    const t0 = Date.now();
    const res = await recepClient.delete(`/users/${ctx.testUsers.admin!.id}`);

    const isForbidden = res.status === 403;
    reporter.record({
      id: 'REC-06',
      role: 'Recepcionista',
      module: 'Seguridad y Autorización',
      scenario: 'Intento de eliminación de usuario por rol recepcionista (Debe ser rechazado con 403)',
      status: isForbidden ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // REC-07: Restricción de seguridad - Recepcionista creando usuario no puede asignarse rol admin
  {
    const t0 = Date.now();
    const testCedula = ctx.generateValidCedula('178');
    const res = await recepClient.post('/users', {
      cedula: testCedula,
      nombre: 'Hacker Intent',
      correo: `escalation.${Date.now()}@hdc.test`,
      telefono: '0991122334',
      direccion: 'Test',
      ciudad: 'Quito',
      roleIds: [1], // Intento de rol Administrador
    });

    // Even if user is created, backend must ensure it does not get role admin
    let isSecured = false;
    if (res.status === 200 || res.status === 201) {
      const createdId = res.data.id;
      ctx.createdEntityIds.users.push(createdId);
      // Check in DB what role was assigned
      const roles = await ctx.dataSource.query(
        `SELECT r.slug FROM "user_roles" ur JOIN "roles" r ON r.id = ur."roleId" WHERE ur."userId" = $1;`,
        [createdId]
      );
      const hasAdmin = roles.some((r: any) => r.slug === 'admin');
      isSecured = !hasAdmin; // Pass if user is NOT admin
    } else if (res.status === 403 || res.status === 400) {
      isSecured = true;
    }

    reporter.record({
      id: 'REC-07',
      role: 'Recepcionista',
      module: 'Seguridad y Autorización',
      scenario: 'Prevención de escalamiento de privilegios al registrar usuarios desde rol recepcionista',
      status: isSecured ? 'PASS' : 'FAIL',
      expected: 'Usuario no adquiere rol admin (debe ser degradado a client o rechazado)',
      actual: `HTTP ${res.status}, roles asignados=${isSecured ? 'Protegido' : 'Escalado'}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }
}
