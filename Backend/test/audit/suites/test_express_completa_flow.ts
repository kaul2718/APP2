import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';
import { OrderType } from '../../../src/common/enums/order-type.enum';
import { PDFDocument } from 'pdf-lib';

export async function runExpressCompletaFlowTest(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n======================================================');
  console.log('   SUITE: FLUJO DE ÓRDENES EXPRESS, COMPLETAS Y CONVERSIÓN');
  console.log('======================================================\n');

  const recepClient = await ctx.getAuthenticatedClient('recep');
  const techClient = await ctx.getAuthenticatedClient('tech');
  const adminClient = await ctx.getAuthenticatedClient('admin');

  let testClientId: number;
  let testEquipoId: number;
  let testEquipoId2: number;
  let testEquipoId3: number;
  let expressOrderId: number;
  let expressWorkOrderNumber: string;
  let completaOrderId: number;
  let completaWorkOrderNumber: string;

  // Paso 0: Crear Cliente y Equipos de prueba
  {
    const clientCedula = ctx.generateValidCedula('178');
    const clientRes = await recepClient.post('/users', {
      cedula: clientCedula,
      nombre: 'Carlos Express',
      apellido: 'Cliente Test',
      correo: `carlos.express.${Date.now()}@hdc.test`,
      telefono: '0981234567',
      direccion: 'Av. Amazonas y 10 de Agosto',
      ciudad: 'Quito',
    });
    testClientId = clientRes.data.id;
    ctx.createdEntityIds.users.push(testClientId);

    const equipoRes = await recepClient.post('/equipos', {
      numeroSerie: `SN-FLOW-1-${Date.now()}`,
      tipoEquipoId: 1, // Laptop
      marcaId: 1,
      modeloId: 1,
    });
    testEquipoId = equipoRes.data.id;
    ctx.createdEntityIds.equipos.push(testEquipoId);

    const equipoRes2 = await recepClient.post('/equipos', {
      numeroSerie: `SN-FLOW-2-${Date.now()}`,
      tipoEquipoId: 1, // Laptop
      marcaId: 1,
      modeloId: 1,
    });
    testEquipoId2 = equipoRes2.data.id;
    ctx.createdEntityIds.equipos.push(testEquipoId2);

    const equipoRes3 = await recepClient.post('/equipos', {
      numeroSerie: `SN-FLOW-3-${Date.now()}`,
      tipoEquipoId: 1, // Laptop
      marcaId: 1,
      modeloId: 1,
    });
    testEquipoId3 = equipoRes3.data.id;
    ctx.createdEntityIds.equipos.push(testEquipoId3);
  }

  // PRUEBA 1: Creación de Orden Express con Estados Seguros
  console.log('--- PRUEBA 1: Creación de Orden Express ---');
  {
    const t0 = Date.now();
    const expressChecklistPayload = {
      version: 2,
      tipoOrden: OrderType.EXPRESS,
      inspeccionRecepcion: {
        fecha: new Date().toISOString(),
        estadoEncendido: 'no_probado', // ESTADO SEGURO
        observacionGeneral: 'Cliente solicita instalación de antivirus y optimización de sistema',
        fisica: [
          { item: 'Estado Físico General', estado: 'no_revisado', observaciones: 'Entregado en funda' },
        ],
        funcional: [
          { item: 'Encendido / Arranque', estado: 'no_probado' },
        ],
      },
    };

    const res = await recepClient.post('/orders', {
      clientId: testClientId,
      equipoId: testEquipoId,
      problemaReportado: 'Instalación de paquetería de software y antivirus',
      accesorios: ['Cargador original', 'Funda de neopreno'],
      tipoOrden: OrderType.EXPRESS,
      checklistData: expressChecklistPayload,
    });

    const isSuccess =
      (res.status === 200 || res.status === 201) &&
      res.data?.tipoOrden === OrderType.EXPRESS &&
      res.data?.checklistData?.version === 2 &&
      res.data?.checklistData?.inspeccionRecepcion?.estadoEncendido === 'no_probado';

    expressOrderId = res.data.id;
    expressWorkOrderNumber = res.data.workOrderNumber;
    ctx.createdEntityIds.orders.push(expressOrderId);

    reporter.record({
      id: 'EXP-01',
      role: 'Recepcionista',
      module: 'Órdenes Express',
      scenario: 'Creación de Orden Express con estados iniciales seguros (no_probado, no_revisado)',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201, tipoOrden=EXPRESS, checklistData v2 con estadoEncendido=no_probado',
      actual: `HTTP ${res.status}, tipoOrden=${res.data?.tipoOrden}, version=${res.data?.checklistData?.version}, encendido=${res.data?.checklistData?.inspeccionRecepcion?.estadoEncendido}`,
      evidence: `Orden Express #${expressWorkOrderNumber} ID ${expressOrderId}`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 2: Creación de Orden Completa con Inspección Inicial Estructurada
  console.log('--- PRUEBA 2: Creación de Orden Completa ---');
  {
    const t0 = Date.now();
    const completaChecklistPayload = {
      version: 2,
      tipoOrden: OrderType.COMPLETA,
      inspeccionRecepcion: {
        fecha: new Date().toISOString(),
        estadoEncendido: 'falla', // Equipo no enciende
        observacionGeneral: 'Equipo no enciende tras intento de encendido en mostrador',
        fisica: [
          { item: 'Carcasa exterior y tapas', estado: 'danado', observaciones: 'Fisura en esquina izquierda' },
          { item: 'Pantalla / Cristal', estado: 'bueno', observaciones: '' },
          { item: 'Bisagras y apertura', estado: 'desgaste', observaciones: 'Bisagra izquierda floja' },
          { item: 'Puertos USB y DC', estado: 'bueno', observaciones: '' },
        ],
        funcional: [
          { item: 'Encendido / POST', estado: 'falla', observaciones: 'Sin respuesta al pulsar botón power' },
          { item: 'Imagen en pantalla', estado: 'no_probado', observaciones: 'No probado (Equipo no enciende)' },
          { item: 'Teclado y Touchpad', estado: 'no_probado', observaciones: 'No probado (Equipo no enciende)' },
          { item: 'Batería y Carga', estado: 'no_probado', observaciones: 'No probado (Equipo no enciende)' },
        ],
      },
    };

    const res = await recepClient.post('/orders', {
      clientId: testClientId,
      equipoId: testEquipoId2,
      problemaReportado: 'No enciende, posible cortocircuito en placa',
      accesorios: ['Cargador Asus 19V'],
      tipoOrden: OrderType.COMPLETA,
      checklistData: completaChecklistPayload,
    });

    const isSuccess =
      (res.status === 200 || res.status === 201) &&
      res.data?.tipoOrden === OrderType.COMPLETA &&
      res.data?.checklistData?.version === 2 &&
      res.data?.checklistData?.inspeccionRecepcion?.fisica?.length === 4 &&
      res.data?.checklistData?.inspeccionRecepcion?.funcional?.length === 4;

    completaOrderId = res.data.id;
    completaWorkOrderNumber = res.data.workOrderNumber;
    ctx.createdEntityIds.orders.push(completaOrderId);

    reporter.record({
      id: 'CMP-01',
      role: 'Recepcionista',
      module: 'Órdenes Completas',
      scenario: 'Creación de Orden Completa con inspección física y funcional separada',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 201, tipoOrden=COMPLETA, checklistData v2 con 4 puntos físicos y 4 funcionales',
      actual: `HTTP ${res.status}, tipoOrden=${res.data?.tipoOrden}, fisicaCount=${res.data?.checklistData?.inspeccionRecepcion?.fisica?.length}, funcionalCount=${res.data?.checklistData?.inspeccionRecepcion?.funcional?.length}`,
      evidence: `Orden Completa #${completaWorkOrderNumber} ID ${completaOrderId}`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 3: Conversión de Express a Completa con Inspección Complementaria y Trazabilidad
  console.log('--- PRUEBA 3: Conversión de Express a Completa ---');
  {
    const t0 = Date.now();
    const motivo = 'Durante el mantenimiento de software se detectó sobrecalentamiento crítico de GPU y bisagra partida';
    
    const conversionRes = await techClient.patch(`/orders/${expressOrderId}/convertir-completa`, {
      motivoEscalamiento: motivo,
      autorizacionCliente: {
        autorizado: true,
        medio: 'Llamada telefónica',
        fechaAutorizacion: new Date().toISOString(),
        detalles: 'Cliente autoriza diagnóstico electrónico y presupuesto hasta $50',
      },
      inspeccionComplementaria: {
        estadoEncendido: 'falla',
        fisica: [
          { item: 'Bisagra izquierda', estado: 'roto', observaciones: 'Estructura plástica interna quebrada' },
          { item: 'Disipador térmico', estado: 'danado', observaciones: 'Conducto de calor obstruido' },
        ],
        funcional: [
          { item: 'Ventilador GPU', estado: 'falla', observaciones: 'Ventilador bloqueado por suciedad' },
        ],
        observacionesTecnicas: 'Requiere reconstrucción de bisagra y mantenimiento térmico profundo',
      },
    });

    // Validar en base de datos la trazabilidad en HistorialEstadoOrden
    const dbHistorial = await ctx.dataSource.query(
      `SELECT * FROM historial_estado_orden WHERE "ordenId" = $1 ORDER BY "fechaCambio" DESC LIMIT 1`,
      [expressOrderId]
    );

    const hasHistorial = dbHistorial.length > 0 && dbHistorial[0].observaciones.includes('Escalamiento Express ➔ Completa');

    const isSuccess =
      conversionRes.status === 200 &&
      conversionRes.data?.tipoOrden === OrderType.COMPLETA &&
      conversionRes.data?.checklistData?.inspeccionRecepcion !== undefined && // Recepción original preservada
      conversionRes.data?.checklistData?.inspeccionComplementaria?.motivoEscalamiento === motivo &&
      conversionRes.data?.checklistData?.inspeccionComplementaria?.autorizacionCliente?.autorizado === true &&
      hasHistorial;

    reporter.record({
      id: 'CNV-01',
      role: 'Técnico',
      module: 'Conversión Express ➔ Completa',
      scenario: 'Escalamiento de Orden Express a Completa conservando inspección de recepción original y registrando inspección complementaria con autorización de cliente e historial',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200, tipoOrden actualizado a COMPLETA, inspeccionRecepcion intacta, inspeccionComplementaria guardada, HistorialEstadoOrden registrado',
      actual: `HTTP ${conversionRes.status}, tipoOrden=${conversionRes.data?.tipoOrden}, motivo='${conversionRes.data?.checklistData?.inspeccionComplementaria?.motivoEscalamiento?.substring(0, 30)}...', tieneHistorial=${hasHistorial}`,
      evidence: `Orden #${expressWorkOrderNumber} convertida exitosamente. Historial: "${dbHistorial[0]?.observaciones?.substring(0, 50)}..."`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 4: Compatibilidad Histórica V1
  console.log('--- PRUEBA 4: Compatibilidad y Fidelidad con V1 Legado ---');
  {
    const t0 = Date.now();
    // Simular o consultar una orden con checklistData V1 legado
    const legacyPayload = {
      fechaPeritaje: '2025-08-10T12:00:00.000Z',
      results: [
        { item: 'Enciende', funcional: 'operativo', estetica: 'bueno', observaciones: 'Normal' },
        { item: 'Pantalla', funcional: 'no_operativo', estetica: 'dañada', observaciones: 'Fisurada' },
      ],
    };

    const legacyOrderRes = await adminClient.post('/orders', {
      clientId: testClientId,
      equipoId: testEquipoId3,
      problemaReportado: 'Orden histórica de prueba V1',
      accesorios: [],
      tipoOrden: OrderType.COMPLETA,
      checklistData: legacyPayload,
    });

    const isSuccess =
      (legacyOrderRes.status === 200 || legacyOrderRes.status === 201) &&
      Array.isArray(legacyOrderRes.data?.checklistData?.results) &&
      legacyOrderRes.data?.checklistData?.results?.length === 2 &&
      legacyOrderRes.data?.checklistData?.results[1]?.funcional === 'no_operativo';

    if (legacyOrderRes.data?.id) ctx.createdEntityIds.orders.push(legacyOrderRes.data.id);

    reporter.record({
      id: 'LEG-01',
      role: 'Administrador',
      module: 'Compatibilidad Histórica',
      scenario: 'Preservación íntegra de registros de peritaje en formato legado V1 sin alterar ni sobreescribir',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200/201 con checklistData.results preservado fielmente con sus 4 atributos originales',
      actual: `HTTP ${legacyOrderRes.status}, resultsCount=${legacyOrderRes.data?.checklistData?.results?.length}, statusItem2=${legacyOrderRes.data?.checklistData?.results[1]?.funcional}`,
      evidence: `Orden histórica #${legacyOrderRes.data?.workOrderNumber} ID ${legacyOrderRes.data?.id}`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 5: Generación de Acta PDF Multi-Página de Ingreso
  console.log('--- PRUEBA 5: Generación de Acta PDF Multi-Página ---');
  {
    const t0 = Date.now();

    // Consultar o generar acta de ingreso para la orden convertida (expressOrderId)
    // Usamos el endpoint de preview de PDF de recepción
    const pdfRes = await recepClient.get(`/orders/${expressOrderId}/documentos/preview/RECEPCION`, {
      responseType: 'arraybuffer',
    });

    let numPages = 0;
    let isValidPdf = false;

    if (pdfRes.status === 200 || pdfRes.status === 201) {
      const buffer = Buffer.from(pdfRes.data);
      isValidPdf = buffer.toString('utf-8', 0, 5) === '%PDF-';
      const pdfDoc = await PDFDocument.load(buffer);
      numPages = pdfDoc.getPageCount();
    }

    const isSuccess = (pdfRes.status === 200 || pdfRes.status === 201) && isValidPdf && numPages >= 2;

    reporter.record({
      id: 'PDF-01',
      role: 'Recepcionista',
      module: 'Actas PDF',
      scenario: 'Generación de Acta de Recepción con Anexo Técnico en página adicional para órdenes con inspección complementaria',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200/201 con buffer PDF válido y al menos 2 páginas (Pág 1: Acta + Pág 2: Anexo Técnico)',
      actual: `HTTP ${pdfRes.status}, esPdfValido=${isValidPdf}, totalPaginas=${numPages}`,
      evidence: `Acta PDF de Orden #${expressWorkOrderNumber} generada con ${numPages} páginas completas`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 6: Enriquecimiento de Equipos con Orden Activa (EQ-01)
  console.log('--- PRUEBA 6: Enriquecimiento de Equipos con Orden Activa ---');
  {
    const t0 = Date.now();
    const eqRes = await recepClient.get(`/equipos/${testEquipoId}`);
    const eqData = eqRes.data;

    const hasActiveOrder =
      eqRes.status === 200 &&
      eqData?.ordenActiva &&
      eqData.ordenActiva.id === expressOrderId &&
      eqData.ordenActiva.workOrderNumber === expressWorkOrderNumber;

    reporter.record({
      id: 'EQ-01',
      role: 'Recepcionista',
      module: 'Disponibilidad de Equipos',
      scenario: 'Consulta de equipo en taller retorna objeto ordenActiva enriquecido con ID, número de orden y estado',
      status: hasActiveOrder ? 'PASS' : 'FAIL',
      expected: `ordenActiva presente con id=${expressOrderId} y workOrderNumber='${expressWorkOrderNumber}'`,
      actual: `HTTP ${eqRes.status}, ordenActiva=${JSON.stringify(eqData?.ordenActiva || null)}`,
      evidence: `Equipo ID ${testEquipoId} con número de serie ${eqData?.numeroSerie}`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 7: Bloqueo de Reingreso con HTTP 409 Conflict (EQ-02)
  console.log('--- PRUEBA 7: Bloqueo de Reingreso de Equipo en Taller ---');
  {
    const t0 = Date.now();
    const conflictRes = await recepClient.post('/orders', {
      clientId: testClientId,
      equipoId: testEquipoId,
      problemaReportado: 'Intento de segundo ingreso simultáneo para el mismo equipo en taller',
      tipoOrden: OrderType.EXPRESS,
    });

    const conflictStatus = conflictRes.status;
    const conflictMessage = conflictRes.data?.message || '';

    const isConflictBlocked =
      conflictStatus === 409 &&
      conflictMessage.includes(expressWorkOrderNumber) &&
      conflictMessage.toLowerCase().includes('ya se encuentra en taller');

    reporter.record({
      id: 'EQ-02',
      role: 'Recepcionista',
      module: 'Disponibilidad de Equipos',
      scenario: 'Intento de crear una orden con equipo ya en taller es rechazado con HTTP 409 Conflict y mensaje descriptivo',
      status: isConflictBlocked ? 'PASS' : 'FAIL',
      expected: `HTTP 409 Conflict con mensaje mencionando la orden #${expressWorkOrderNumber}`,
      actual: `HTTP ${conflictStatus}, mensaje='${conflictMessage}'`,
      evidence: `Bloqueo exitoso para equipo ID ${testEquipoId} ocupado por ODS #${expressWorkOrderNumber}`,
      durationMs: Date.now() - t0,
    });
  }

  // PRUEBA 8: Liberación de Equipo tras Entrega/Archivado (EQ-03)
  console.log('--- PRUEBA 8: Liberación de Equipo al Archivar Orden ---');
  {
    const t0 = Date.now();

    // 1. Archivar la orden activa previa (ID 9: Archivados)
    const archiveRes = await recepClient.patch(`/orders/${expressOrderId}/estado/9`);

    // 2. Intentar nuevo ingreso para el equipo liberado
    const newOrderRes = await recepClient.post('/orders', {
      clientId: testClientId,
      equipoId: testEquipoId,
      problemaReportado: 'Reingreso legal tras entrega y archivo satisfactorio de la orden anterior',
      tipoOrden: OrderType.EXPRESS,
    });

    const isSuccess =
      (archiveRes.status === 200 || archiveRes.status === 201) &&
      (newOrderRes.status === 200 || newOrderRes.status === 201) &&
      Boolean(newOrderRes.data?.id);

    if (newOrderRes.data?.id) {
      ctx.createdEntityIds.orders.push(newOrderRes.data.id);
    }

    reporter.record({
      id: 'EQ-03',
      role: 'Recepcionista',
      module: 'Disponibilidad de Equipos',
      scenario: 'Equipo previamente archivado se libera del bloqueo y permite crear un nuevo ingreso de servicio',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200/201 al crear la nueva orden tras pasar la previa a Archivados',
      actual: `Archivo HTTP ${archiveRes.status}, Nuevo Ingreso HTTP ${newOrderRes.status}, Nueva OT #${newOrderRes.data?.workOrderNumber}`,
      evidence: `Orden anterior #${expressWorkOrderNumber} archivada -> Nueva orden #${newOrderRes.data?.workOrderNumber} creada`,
      durationMs: Date.now() - t0,
    });
  }

  console.log('\n✓ SUITE DE VERIFICACIÓN EXPRESS / COMPLETA FINALIZADA CON ÉXITO\n');
}
