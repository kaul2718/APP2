import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';
import axios from 'axios';
import * as FormData from 'form-data';

export async function runTechSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 4: PRUEBAS DEL ROL TÉCNICO ---');
  const techClient = await ctx.getAuthenticatedClient('tech');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  // Prepare a test order assigned to the tech
  let testOrderId: number;
  let testWorkOrderNumber: string;

  // Find or create an order assigned to the technician
  const existingAssigned = await ctx.dataSource.query(
    `SELECT id, "workOrderNumber" FROM "orders" WHERE "technicianId" = $1 AND "deletedAt" IS NULL LIMIT 1;`,
    [ctx.testUsers.tech!.id]
  );

  if (existingAssigned.length > 0) {
    testOrderId = existingAssigned[0].id;
    testWorkOrderNumber = existingAssigned[0].workOrderNumber;
  } else {
    // Ensure valid equipment exists
    const eqCheck = await ctx.dataSource.query('SELECT id FROM "equipo" WHERE "deletedAt" IS NULL LIMIT 1;');
    let validEquipoId = eqCheck[0]?.id;
    if (!validEquipoId) {
      const eqRes = await adminClient.post('/equipos', {
        numeroSerie: `TECH-TEST-EQ-${Date.now()}`,
        tipoEquipoId: 1,
        marcaId: 1,
        modeloId: 1,
        estadoFisico: 'Buen estado',
        passwordEquipo: 'sin-clave',
      });
      validEquipoId = eqRes.data.id;
      ctx.createdEntityIds.equipos.push(validEquipoId);
    }

    // Create an order via admin and assign to tech
    const orderRes = await adminClient.post('/orders', {
      clientId: ctx.testUsers.client!.id,
      equipoId: validEquipoId,
      recepcionistaId: ctx.testUsers.recep!.id,
      technicianId: ctx.testUsers.tech!.id,
      problemaReportado: 'Equipo presenta sobrecalentamiento y apagado súbito',
      accesorios: ['Cargador 230W', 'Cable de poder'],
      estadoOrdenId: 12, // Recepción
    });
    if (!orderRes.data?.id) {
      throw new Error(`Failed to provision tech test order: ${JSON.stringify(orderRes.data)}`);
    }
    testOrderId = orderRes.data.id;
    testWorkOrderNumber = orderRes.data.workOrderNumber;
    ctx.createdEntityIds.orders.push(testOrderId);
  }

  // TEC-01: Visualización de órdenes asignadas
  {
    const t0 = Date.now();
    const res = await techClient.get('/orders/tecnico/mis-ordenes');
    const isSuccess = res.status === 200 && Array.isArray(res.data);
    const containsAssigned = res.data?.some((o: any) => o.id === testOrderId);

    reporter.record({
      id: 'TEC-01',
      role: 'Técnico',
      module: 'Acceso a Órdenes',
      scenario: 'Consulta de órdenes de servicio asignadas al técnico autenticado',
      status: isSuccess && containsAssigned ? 'PASS' : 'FAIL',
      expected: `HTTP 200 conteniendo la orden asignada #${testWorkOrderNumber}`,
      actual: `HTTP ${res.status}, total devueltas=${res.data?.length}`,
      evidence: `Órdenes asignadas ID: ${res.data?.map((o: any) => o.id).join(', ')}`,
      durationMs: Date.now() - t0,
    });
  }

  // TEC-02: Diagnóstico técnico - Registro de peritaje y checklist pericial
  {
    const t0 = Date.now();
    const checklistPayload = {
      inspeccionVisual: 'Polvo acumulado en conductos de disipación',
      pruebaEncendido: 'Sobrecalentamiento instantáneo a 95°C',
      diagnosticoPericial: 'Fallo en pasta térmica y acumulación de polvo en ventilador disipador. Placa madre operativa.',
    };
    const res = await techClient.patch(`/orders/${testOrderId}`, {
      checklistData: checklistPayload,
    });

    const isSuccess = res.status === 200 && Boolean(res.data?.checklistData?.diagnosticoPericial);
    reporter.record({
      id: 'TEC-02',
      role: 'Técnico',
      module: 'Diagnóstico Técnico',
      scenario: 'Registro de diagnóstico y checklist pericial en orden de trabajo',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con checklistData persistido en la orden',
      actual: `HTTP ${res.status}, diagnostico='${res.data?.checklistData?.diagnosticoPericial?.substring(0, 30)}...'`,
      evidence: `Checklist pericial persistido en orden ID ${testOrderId}`,
      durationMs: Date.now() - t0,
    });
  }

  // TEC-03: Actividades técnicas - Registro de actividad técnica
  let createdActividadId: number | null = null;
  {
    const t0 = Date.now();
    const res = await techClient.post('/actividades-tecnicas', {
      ordenId: testOrderId,
      tipoActividadId: 1, // Diagnóstico / Mantenimiento
      diagnostico: 'Fallo térmico por degradación de interfaz térmica',
      trabajoRealizado: 'Desmontaje de chasis, limpieza ultrasónica de disipador y reaplicación de pasta térmica Artic MX-4',
    });

    const isSuccess = (res.status === 200 || res.status === 201) && Boolean(res.data?.id);
    if (isSuccess) {
      createdActividadId = res.data.id;
      ctx.createdEntityIds.actividades.push(createdActividadId);
    }

    reporter.record({
      id: 'TEC-03',
      role: 'Técnico',
      module: 'Actividades Técnicas',
      scenario: 'Registro de actividad técnica ejecutada vinculada a la orden',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201 con ID de actividad generado',
      actual: `HTTP ${res.status}, actividadId=${res.data?.id}`,
      evidence: `Actividad registrada ID: ${res.data?.id}, Orden: ${testOrderId}`,
      durationMs: Date.now() - t0,
    });
  }

  // TEC-04: Evidencias técnicas - Subida de fotografía a Cloudflare R2 con WebP
  let createdFotoId: number | null = null;
  {
    const t0 = Date.now();
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const form = new FormData();
    form.append('ordenId', String(testOrderId));
    form.append('subidoPorId', String(ctx.testUsers.tech!.id));
    form.append('descripcion', 'Fotografía de disipador térmico antes del mantenimiento');
    form.append('archivo', validPngBuffer, {
      filename: 'evidencia_disipador.png',
      contentType: 'image/png',
    });

    const res = await techClient.post('/evidencias-tecnicas', form, {
      headers: form.getHeaders(),
    });

    const isSuccess = (res.status === 200 || res.status === 201) && res.data?.success && Boolean(res.data?.data?.id);
    if (isSuccess) {
      createdFotoId = res.data.data.id;
      ctx.createdEntityIds.evidencias.push(createdFotoId);

      // Verify in DB that storageProvider is 'r2' and archivoUrl is null
      const dbRow = await ctx.dataSource.query(
        `SELECT "storageKey", "storageProvider", "archivoUrl", "mimeType" FROM "evidencia_tecnica" WHERE id = $1;`,
        [createdFotoId]
      );
      const isR2Stored = dbRow[0]?.storageProvider === 'r2' && dbRow[0]?.archivoUrl === null;

      reporter.record({
        id: 'TEC-04',
        role: 'Técnico',
        module: 'Evidencias Multimedia R2',
        scenario: 'Subida de fotografía optimizada a Cloudflare R2 y persistencia de metadatos',
        status: isSuccess && isR2Stored ? 'PASS' : 'FAIL',
        expected: "HTTP 201, storageProvider='r2', archivoUrl=NULL, storageKey con prefijo ordenes/",
        actual: `HTTP ${res.status}, storageProvider='${dbRow[0]?.storageProvider}', storageKey='${dbRow[0]?.storageKey}'`,
        evidence: `Evidencia ID: ${createdFotoId}, Clave R2: ${dbRow[0]?.storageKey}, SignedURL: ${res.data?.data?.archivoUrl?.substring(0, 40)}...`,
        durationMs: Date.now() - t0,
      });
    } else {
      reporter.record({
        id: 'TEC-04',
        role: 'Técnico',
        module: 'Evidencias Multimedia R2',
        scenario: 'Subida de fotografía optimizada a Cloudflare R2',
        status: 'FAIL',
        expected: 'HTTP 201',
        actual: `HTTP ${res.status}`,
        evidence: JSON.stringify(res.data),
        durationMs: Date.now() - t0,
      });
    }
  }

  // TEC-05: Evidencias técnicas - Subida directa de video mediante URL prefirmada a Cloudflare R2
  let createdVideoId: number | null = null;
  {
    const t0 = Date.now();
    // 1. Solicitar URL prefirmada
    const presignedRes = await techClient.post('/evidencias-tecnicas/presigned-upload', {
      ordenId: testOrderId,
      fileName: 'evidencia_test_video.mp4',
      mimeType: 'video/mp4',
      fileSize: 1024 * 1024 * 12, // 12MB
    });

    let videoUploadOk = false;
    let confirmOk = false;

    if (presignedRes.status === 200 || presignedRes.status === 201) {
      const { uploadUrl, storageKey } = presignedRes.data.data;

      // 2. Subida PUT directa con payload de prueba
      const dummyVideoPayload = Buffer.from('TEST_DIRECT_PUT_VIDEO_BINARY_DATA_FOR_R2');
      const putRes = await axios.put(uploadUrl, dummyVideoPayload, {
        headers: { 'Content-Type': 'video/mp4' },
        validateStatus: () => true,
      });

      if (putRes.status === 200) {
        videoUploadOk = true;

        // 3. Confirmar subida
        const confirmRes = await techClient.post('/evidencias-tecnicas/confirm-upload', {
          ordenId: testOrderId,
          storageKey,
          nombreOriginal: 'evidencia_test_video.mp4',
          mimeType: 'video/mp4',
          tamanoBytes: dummyVideoPayload.length,
          descripcion: 'Video de prueba de encendido directo en R2',
        });

        if ((confirmRes.status === 200 || confirmRes.status === 201) && confirmRes.data?.success) {
          confirmOk = true;
          createdVideoId = confirmRes.data.data.id;
          ctx.createdEntityIds.evidencias.push(createdVideoId);
        }
      }
    }

    reporter.record({
      id: 'TEC-05',
      role: 'Técnico',
      module: 'Evidencias Multimedia R2',
      scenario: 'Flujo completo de subida directa de video mediante URL prefirmada a Cloudflare R2',
      status: videoUploadOk && confirmOk ? 'PASS' : 'FAIL',
      expected: 'Presigned URL generada (200) -> Direct PUT en R2 (200) -> Confirmación en PostgreSQL (200)',
      actual: `Presigned=${presignedRes.status}, DirectPUT=${videoUploadOk ? '200 OK' : 'FAILED'}, Confirm=${confirmOk ? '200 OK' : 'FAILED'}`,
      evidence: `Video Evidencia ID: ${createdVideoId}, Provider: R2`,
      durationMs: Date.now() - t0,
    });
  }

  // TEC-06: Transición de estado de la orden (Diagnóstico -> Reparación)
  {
    const t0 = Date.now();
    const res = await techClient.patch(`/orders/${testOrderId}/estado/2`); // Estado 2 = 'Reparación'

    const isSuccess = res.status === 200 && res.data?.estadoOrden?.id === 2;
    reporter.record({
      id: 'TEC-06',
      role: 'Técnico',
      module: 'Gestión de Estados',
      scenario: 'Actualización del estado de la orden por el técnico a "Reparación"',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con estadoOrden.id=2 (Reparación)',
      actual: `HTTP ${res.status}, estadoId=${res.data?.estadoOrden?.id}`,
      evidence: `Nuevo estado: ${res.data?.estadoOrden?.nombre}`,
      durationMs: Date.now() - t0,
    });
  }

  // TEC-07: Restricción de seguridad - Técnico NO puede eliminar usuarios ni alterar roles
  {
    const t0 = Date.now();
    const res = await techClient.delete(`/users/${ctx.testUsers.admin!.id}`);

    reporter.record({
      id: 'TEC-07',
      role: 'Técnico',
      module: 'Seguridad y Autorización',
      scenario: 'Intento de eliminación de usuarios por rol técnico (Debe ser rechazado con 403)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }
}
