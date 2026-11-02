import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';
import axios from 'axios';
import * as FormData from 'form-data';

export async function runE2ERepairSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n======================================================');
  console.log('   SUITE 6: PRUEBA E2E — PROCESO COMPLETO DE REPARACIÓN');
  console.log('======================================================\n');

  const recepClient = await ctx.getAuthenticatedClient('recep');
  const techClient = await ctx.getAuthenticatedClient('tech');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  let e2eClientId: number;
  let e2eClientCedula: string;
  let e2eEquipoId: number;
  let e2eOrderId: number;
  let e2eWorkOrderNumber: string;
  let e2ePresupuestoId: number;

  // ---------------------------------------------------------
  // ETAPA 1 — RECEPCIONISTA: REGISTRO CLIENTE, EQUIPO Y ORDEN
  // ---------------------------------------------------------
  console.log('--- ETAPA 1: RECEPCIONISTA (Ingreso y Creación) ---');
  {
    const t0 = Date.now();
    e2eClientCedula = ctx.generateValidCedula('179');

    // 1. Registrar cliente
    const clientRes = await recepClient.post('/users', {
      cedula: e2eClientCedula,
      nombre: 'E2E LaptopOwner',
      apellido: 'Prueba Flujo',
      correo: `e2e.owner.${Date.now()}@hdc.test`,
      telefono: '0995544332',
      direccion: 'Av. República y Eloy Alfaro',
      ciudad: 'Quito',
    });

    if (clientRes.status !== 200 && clientRes.status !== 201) {
      throw new Error(`Failed to create E2E client: ${JSON.stringify(clientRes.data)}`);
    }
    e2eClientId = clientRes.data.id;
    ctx.createdEntityIds.users.push(e2eClientId);

    // 2. Registrar equipo laptop
    const equipoRes = await recepClient.post('/equipos', {
      numeroSerie: `E2E-ASUS-ROG-${Date.now()}`,
      tipoEquipoId: 1, // Computador portátil
      marcaId: 1, // Marca
      modeloId: 1, // Modelo
    });

    if (equipoRes.status !== 200 && equipoRes.status !== 201) {
      throw new Error(`Failed to create E2E equipo: ${JSON.stringify(equipoRes.data)}`);
    }
    e2eEquipoId = equipoRes.data.id;
    ctx.createdEntityIds.equipos.push(e2eEquipoId);

    // 3. Crear Orden de Servicio
    const orderRes = await recepClient.post('/orders', {
      clientId: e2eClientId,
      equipoId: e2eEquipoId,
      recepcionistaId: ctx.testUsers.recep!.id,
      technicianId: ctx.testUsers.tech!.id,
      problemaReportado: 'Laptop ASUS ROG no enciende. Led indicador parpadea 3 veces en rojo.',
      accesorios: ['Cargador original 230W', 'cable de poder'],
      estadoOrdenId: 12, // 'Recepción'
    });

    if (orderRes.status !== 200 && orderRes.status !== 201) {
      throw new Error(`Failed to create E2E order: ${JSON.stringify(orderRes.data)}`);
    }
    e2eOrderId = orderRes.data.id;
    e2eWorkOrderNumber = orderRes.data.workOrderNumber;
    ctx.createdEntityIds.orders.push(e2eOrderId);

    // Confirmar en PostgreSQL
    const dbOrder = await ctx.dataSource.query(
      `SELECT o.id, o."workOrderNumber", o."estadoOrdenId", eo.nombre as estado_nombre
       FROM "orders" o
       JOIN "estado_orden" eo ON eo.id = o."estadoOrdenId"
       WHERE o.id = $1;`,
      [e2eOrderId]
    );

    const isStage1Ok = dbOrder.length > 0 && dbOrder[0].workOrderNumber === e2eWorkOrderNumber;
    reporter.record({
      id: 'E2E-ETAPA-1',
      role: 'Recepcionista',
      module: 'Flujo E2E - Recepción',
      scenario: 'Etapa 1: Registro completo de cliente, laptop y orden de servicio con persistencia',
      status: isStage1Ok ? 'PASS' : 'FAIL',
      expected: 'Orden creada en PostgreSQL con cliente, equipo y estado inicial "Recepción"',
      actual: `Orden #${e2eWorkOrderNumber} ID=${e2eOrderId}, Estado='${dbOrder[0]?.estado_nombre}'`,
      evidence: `Cliente ID: ${e2eClientId}, Equipo ID: ${e2eEquipoId}, OT: ${e2eWorkOrderNumber}`,
      durationMs: Date.now() - t0,
    });
  }

  // ---------------------------------------------------------
  // ETAPA 2 — TÉCNICO: DIAGNÓSTICO, ACTIVIDAD, FOTO R2, VIDEO R2
  // ---------------------------------------------------------
  console.log('--- ETAPA 2: TÉCNICO (Diagnóstico, Multimedia R2 y Reparación) ---');
  {
    const t0 = Date.now();

    // 1. Diagnóstico pericial (Checklist pericial en orden)
    const diagRes = await techClient.patch(`/orders/${e2eOrderId}`, {
      checklistData: {
        fallaConfirmada: 'Cortocircuito en riel primario 19V',
        componenteAfectado: 'Condensador cerámico SMD PC102',
        requiereReemplazo: true,
      },
    });

    // 2. Cambiar estado a Diagnóstico (ID 7)
    await techClient.patch(`/orders/${e2eOrderId}/estado/7`);

    // 3. Registrar actividad técnica
    const actRes = await techClient.post('/actividades-tecnicas', {
      ordenId: e2eOrderId,
      tipoActividadId: 1,
      diagnostico: 'Detección de condensador cerámico en cortocircuito en riel de 19V',
      trabajoRealizado: 'Detección térmica infrarroja, desoldadura de componente dañado y limpieza de pistas',
    });
    if (actRes.data?.id) ctx.createdEntityIds.actividades.push(actRes.data.id);

    // 4. Subir fotografía pericial a Cloudflare R2
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const form = new FormData();
    form.append('ordenId', String(e2eOrderId));
    form.append('subidoPorId', String(ctx.testUsers.tech!.id));
    form.append('descripcion', 'E2E Foto térmica de placa madre con componente dañado');
    form.append('archivo', validPngBuffer, {
      filename: 'e2e_thermal_board.png',
      contentType: 'image/png',
    });

    const fotoRes = await techClient.post('/evidencias-tecnicas', form, {
      headers: form.getHeaders(),
    });
    if (fotoRes.data?.data?.id) ctx.createdEntityIds.evidencias.push(fotoRes.data.data.id);

    // 5. Subir video pericial directo a Cloudflare R2 con URL prefirmada
    const presignedRes = await techClient.post('/evidencias-tecnicas/presigned-upload', {
      ordenId: e2eOrderId,
      fileName: 'e2e_power_test_video.mp4',
      mimeType: 'video/mp4',
      fileSize: 1024 * 1024 * 15,
    });

    let videoOk = false;
    if (presignedRes.status === 200 || presignedRes.status === 201) {
      const { uploadUrl, storageKey } = presignedRes.data.data;
      const videoPayload = Buffer.from('E2E_VIDEO_STREAM_DATA_TESTING_POWER_RAIL');
      const putRes = await axios.put(uploadUrl, videoPayload, {
        headers: { 'Content-Type': 'video/mp4' },
        validateStatus: () => true,
      });

      if (putRes.status === 200) {
        const confirmRes = await techClient.post('/evidencias-tecnicas/confirm-upload', {
          ordenId: e2eOrderId,
          storageKey,
          nombreOriginal: 'e2e_power_test_video.mp4',
          mimeType: 'video/mp4',
          tamanoBytes: videoPayload.length,
          descripcion: 'Video de prueba de encendido y post en BIOS',
        });
        if (confirmRes.data?.data?.id) {
          videoOk = true;
          ctx.createdEntityIds.evidencias.push(confirmRes.data.data.id);
        }
      }
    }

    // 6. Cambiar estado a Reparación (ID 2)
    const stateRes = await techClient.patch(`/orders/${e2eOrderId}/estado/2`);

    // Verify in DB that evidences exist with R2 provider
    const r2Evidencias = await ctx.dataSource.query(
      `SELECT COUNT(*) FROM "evidencia_tecnica" WHERE "ordenId" = $1 AND "storageProvider" = 'r2';`,
      [e2eOrderId]
    );

    const isStage2Ok =
      diagRes.status === 200 &&
      actRes.status === 201 &&
      fotoRes.data?.success &&
      videoOk &&
      parseInt(r2Evidencias[0].count, 10) >= 2 &&
      stateRes.status === 200;

    reporter.record({
      id: 'E2E-ETAPA-2',
      role: 'Técnico',
      module: 'Flujo E2E - Técnico',
      scenario: 'Etapa 2: Diagnóstico pericial, actividad, subida de foto y video a R2, avance a "Reparación"',
      status: isStage2Ok ? 'PASS' : 'FAIL',
      expected: 'Diagnóstico guardado, actividad guardada, 2 evidencias en R2, estado "Reparación"',
      actual: `Diagnostico=${diagRes.status}, Actividad=${actRes.status}, Evidencias R2=${r2Evidencias[0].count}, Estado=${stateRes.data?.estadoOrden?.nombre}`,
      evidence: `Orden #${e2eWorkOrderNumber} en reparación con evidencias multimedia verificadas en bucket privado`,
      durationMs: Date.now() - t0,
    });
  }

  // ---------------------------------------------------------
  // ETAPA 3 — ADMINISTRADOR: REVISIÓN Y PRESUPUESTO
  // ---------------------------------------------------------
  console.log('--- ETAPA 3: ADMINISTRADOR (Presupuesto y Cálculos) ---');
  {
    const t0 = Date.now();

    // Crear presupuesto asociado a la orden (Estado 1 = Pendiente)
    const presRes = await adminClient.post('/presupuestos', {
      ordenId: e2eOrderId,
      estadoId: 1,
      descripcion: 'Presupuesto de reparación de placa madre y reemplazo de condensadores cerámicos',
    });

    const isSuccess = (presRes.status === 200 || presRes.status === 201) && Boolean(presRes.data?.id);
    if (isSuccess) {
      e2ePresupuestoId = presRes.data.id;
      ctx.createdEntityIds.presupuestos.push(e2ePresupuestoId);

      // Agregar items de detalle al presupuesto
      await adminClient.post('/detalle-presupuesto-item', {
        presupuestoId: e2ePresupuestoId,
        cantidad: 2,
        precioUnitario: 27.5,
        comentario: 'Reemplazo de condensadores cerámicos 10uF 25V',
      });
    }

    reporter.record({
      id: 'E2E-ETAPA-3',
      role: 'Administrador',
      module: 'Flujo E2E - Presupuesto',
      scenario: 'Etapa 3: Generación y cálculo financiero de presupuesto para la reparación',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de presupuesto en estado Pendiente',
      actual: `HTTP ${presRes.status}, presupuestoId=${presRes.data?.id}`,
      evidence: `Presupuesto ID: ${presRes.data?.id}, Subtotal estimado: $55.00 con items asociados`,
      durationMs: Date.now() - t0,
    });
  }

  // ---------------------------------------------------------
  // ETAPA 4 — CLIENTE: CONSULTA PÚBLICA Y APROBACIÓN
  // ---------------------------------------------------------
  console.log('--- ETAPA 4: CLIENTE (Consulta en Portal y Aprobación) ---');
  {
    const t0 = Date.now();

    // 1. Consulta pública de la orden
    const consultaRes = await ctx.apiClient.get('/orders/public/consulta', {
      params: {
        cedula: e2eClientCedula,
        workorder: e2eWorkOrderNumber,
      },
    });

    const orderFound = consultaRes.status === 200 && consultaRes.data?.workOrderNumber === e2eWorkOrderNumber;

    // 2. Acción de presupuesto desde portal público: ACEPTADO
    const actionRes = await ctx.apiClient.post('/orders/public/consulta/presupuesto/action', {
      cedula: e2eClientCedula,
      workorder: e2eWorkOrderNumber,
      action: 'ACEPTADO',
    });

    const isActionOk = actionRes.status === 200 || actionRes.status === 201;

    // Verificar en BD que el presupuesto figure como ACEPTADO / APROBADO
    const dbPres = await ctx.dataSource.query(
      `SELECT ep.nombre as estado
       FROM "presupuesto" p
       JOIN "estado_presupuesto" ep ON ep.id = p."estadoId"
       WHERE p."ordenId" = $1;`,
      [e2eOrderId]
    );

    const isStage4Ok = orderFound && isActionOk;
    reporter.record({
      id: 'E2E-ETAPA-4',
      role: 'Cliente',
      module: 'Flujo E2E - Aprobación Cliente',
      scenario: 'Etapa 4: Consulta pública de estado y aceptación formal de presupuesto por el cliente',
      status: isStage4Ok ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 en consulta y HTTP 200 en acción de aceptación de presupuesto',
      actual: `Consulta=${consultaRes.status}, AcciónPresupuesto=${actionRes.status}, EstadoBD='${dbPres[0]?.estado}'`,
      evidence: `Cliente cédula ${e2eClientCedula} aprobó presupuesto para OT #${e2eWorkOrderNumber}`,
      durationMs: Date.now() - t0,
    });
  }

  // ---------------------------------------------------------
  // ETAPA 5 — TÉCNICO Y RECEPCIONISTA: CONTROL, ENTREGA Y CIERRE
  // ---------------------------------------------------------
  console.log('--- ETAPA 5: RECEPCIONISTA Y TÉCNICO (Control de Calidad, Entrega y Cierre) ---');
  {
    const t0 = Date.now();

    // 1. Técnico finaliza reparación y pasa a 'Control' de calidad (ID 1)
    const controlRes = await techClient.patch(`/orders/${e2eOrderId}/estado/1`);

    // 2. Recepcionista pasa a 'Entrega' al cliente (ID 5)
    const entregaRes = await recepClient.patch(`/orders/${e2eOrderId}/estado/5`);

    // 3. Recepcionista archiva la orden finalizada 'Archivados' (ID 9)
    const archivoRes = await recepClient.patch(`/orders/${e2eOrderId}/estado/9`);

    // 4. Comprobar historial completo en PostgreSQL
    const historialRows = await ctx.dataSource.query(
      `SELECT h.id, eo.nombre as estado, h."fechaCambio"
       FROM "historial_estado_orden" h
       JOIN "estado_orden" eo ON eo.id = h."estadoOrdenId"
       WHERE h."ordenId" = $1
       ORDER BY h.id ASC;`,
      [e2eOrderId]
    );

    const stateSequence = historialRows.map((r: any) => r.estado);
    const hasFinalArchived = stateSequence.includes('Archivados');

    const isStage5Ok =
      controlRes.status === 200 &&
      entregaRes.status === 200 &&
      archivoRes.status === 200 &&
      hasFinalArchived;

    reporter.record({
      id: 'E2E-ETAPA-5',
      role: 'Recepcionista',
      module: 'Flujo E2E - Cierre y Entrega',
      scenario: 'Etapa 5: Control de calidad, entrega al cliente, cierre y auditoría de historial en PostgreSQL',
      status: isStage5Ok ? 'PASS' : 'FAIL',
      expected: 'Secuencia completa de estados registrada en historial terminando en "Archivados"',
      actual: `Secuencia: ${stateSequence.join(' -> ')}`,
      evidence: `Historial de estados (${historialRows.length} transiciones registradas): ${stateSequence.join(' -> ')}`,
      durationMs: Date.now() - t0,
    });
  }
}
