require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const crypto = require('crypto');

// Canvas sample 1x1 png base64 for signature testing
const SAMPLE_SIGNATURE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🚀 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS DE AUTORIZACIÓN HDC');
  console.log('===============================================================');

  let app;
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FALLÓ [Prueba ${totalTests}]: ${message}`);
      throw new Error(message);
    } else {
      passedTests++;
      console.log(`✅ PASÓ [Prueba ${totalTests}]: ${message}`);
    }
  }

  try {
    console.log('⏳ Inicializando contexto de aplicación NestJS...');
    app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
    console.log('✅ Contexto NestJS inicializado con éxito.');

    const { DataSource } = require('typeorm');
    const { UsersService } = require('../dist/users/users.service');
    const { OrderService } = require('../dist/orders/orders.service');
    const { OrderController } = require('../dist/orders/orders.controller');
    const { PresupuestoService } = require('../dist/presupuesto/presupuesto.service');
    const { DetallePresupuestoItemService } = require('../dist/detalle-presupuesto-item/detalle-presupuesto-item.service');

    const { getDataSourceToken } = require('@nestjs/typeorm');

    const dataSource = app.get(getDataSourceToken());
    const usersService = app.get(UsersService);
    const ordersService = app.get(OrderService);
    const ordersController = app.get(OrderController);
    const presupuestoService = app.get(PresupuestoService);
    const detalleItemService = app.get(DetallePresupuestoItemService);

    const estadoPresupuestoRepo = dataSource.getRepository('EstadoPresupuesto');
    const autorizacionRepo = dataSource.getRepository('AutorizacionPresupuesto');
    const orderRepo = dataSource.getRepository('Order');

    // Obtener roles existentes directamente de la tabla roles
    const roles = await dataSource.query('SELECT id, nombre, slug FROM roles');
    const clienteRole = roles.find(r => r.slug === 'cliente' || r.nombre?.toLowerCase().includes('client'));
    const adminRole = roles.find(r => r.slug === 'admin' || r.nombre?.toLowerCase().includes('admin'));
    const tecnicoRole = roles.find(r => r.slug === 'tecnico' || r.nombre?.toLowerCase().includes('tecnic'));

    assert(clienteRole && adminRole, 'Roles CLIENTE y ADMIN identificados en base de datos');

    // Buscar usuario staff/admin existente para witness de pruebas
    const adminUser = await dataSource.getRepository('User').findOne({
      where: [
        { correo: 'admin@elhospitaldelcomputador.com' },
        { correo: 'admin@hospitaldelcomputador.com' },
      ],
    }) || await dataSource.getRepository('User').findOne({
      where: { estado: true },
    });
    assert(adminUser, 'Usuario staff/admin disponible para pruebas');

    async function cleanTestData() {
      const cedulas = ['0999999991', '0999999992', '0999999993'];
      await dataSource.query(`
        DELETE FROM notificaciones 
        WHERE "usuarioId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
           OR "ordenServicioId" IN (
             SELECT id FROM orders 
             WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
                OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
           );
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM autorizaciones_presupuesto 
        WHERE "presupuestoId" IN (
          SELECT id FROM presupuesto WHERE "ordenId" IN (
            SELECT id FROM orders 
            WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
               OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
          )
        );
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM documentos_orden 
        WHERE "ordenId" IN (
          SELECT id FROM orders 
          WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
             OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
        );
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM detalle_repuestos 
        WHERE "presupuestoId" IN (
          SELECT id FROM presupuesto WHERE "ordenId" IN (
            SELECT id FROM orders 
            WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
               OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
          )
        );
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM presupuesto 
        WHERE "ordenId" IN (
          SELECT id FROM orders 
          WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
             OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%')
        );
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM orders 
        WHERE "clientId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]))
           OR "equipoId" IN (SELECT id FROM equipo WHERE "numeroSerie" LIKE 'TEST-SN-%');
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM user_roles 
        WHERE "userId" IN (SELECT id FROM users WHERE cedula = ANY($1::text[]));
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM users 
        WHERE cedula = ANY($1::text[]);
      `, [cedulas]);
      await dataSource.query(`
        DELETE FROM equipo 
        WHERE "numeroSerie" LIKE 'TEST-SN-%';
      `);
    }

    // Limpieza previa
    await cleanTestData();

    // -----------------------------------------------------------------
    // ESCENARIO 1: Registro de cliente con correo = NULL
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 1: Registro de cliente con correo = NULL ---');
    const testCedulaNoMail = '0999999991';

    const clienteSinCorreo = await usersService.create({
      nombre: 'Carlos Test',
      apellido: 'Sin Correo',
      cedula: testCedulaNoMail,
      telefono: '0991112233',
      direccion: 'Av. 10 de Agosto 123',
      ciudad: 'Quito',
      roleIds: [clienteRole.id],
      correo: null,
    });

    assert(clienteSinCorreo && clienteSinCorreo.id, 'Cliente sin correo creado exitosamente');
    assert(clienteSinCorreo.correo === null, 'Entidad cliente tiene correo = null');

    const dbClientCheck = await dataSource.query('SELECT id, nombre, correo FROM users WHERE id = $1', [clienteSinCorreo.id]);
    assert(dbClientCheck[0].correo === null, 'En PostgreSQL users.correo es estrictamente NULL');

    // -----------------------------------------------------------------
    // ESCENARIO 2: Personal administrativo/técnico sin correo DEBE ser rechazado
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 2: Staff sin correo debe ser rechazado con 400 ---');
    let staffRejected = false;
    try {
      await usersService.create({
        nombre: 'Admin Ficticio',
        apellido: 'Sin Correo',
        cedula: '0999999992',
        telefono: '0991112233',
        direccion: 'Calle Falsa 123',
        ciudad: 'Quito',
        roleIds: [adminRole.id],
        correo: null,
      });
    } catch (err) {
      if (err.status === 400 && err.message.includes('correo electrónico')) {
        staffRejected = true;
      }
    }
    assert(staffRejected, 'Registro de staff con correo = NULL rechazado con BadRequestException');

    // -----------------------------------------------------------------
    // ESCENARIO 3: Compatibilidad: Cliente con correo tradicional
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 3: Cliente con correo tradicional ---');
    const testCedulaWithMail = '0999999993';
    await dataSource.query('DELETE FROM users WHERE cedula = $1', [testCedulaWithMail]);

    const clienteConCorreo = await usersService.create({
      nombre: 'Maria Test',
      apellido: 'Con Correo',
      cedula: testCedulaWithMail,
      telefono: '0994445566',
      direccion: 'Av. Amazonas 456',
      ciudad: 'Quito',
      correo: 'maria.test.audit@elhospitaldelcomputador.com',
      roleIds: [clienteRole.id],
    });
    assert(clienteConCorreo && clienteConCorreo.correo === 'maria.test.audit@elhospitaldelcomputador.com', 'Cliente con correo registrado preservando compatibilidad');

    // -----------------------------------------------------------------
    // ESCENARIO 4: Creación de orden y generación de secreto de 128 bits
    const tipoEquipo = await dataSource.getRepository('TipoEquipo').findOne({ where: {} });
    const marca = await dataSource.getRepository('Marca').findOne({ where: {} });
    const modelo = await dataSource.getRepository('Modelo').findOne({ where: {} });
    const testSerie = 'TEST-SN-' + Date.now();
    const testEquipo = await dataSource.getRepository('Equipo').save({
      numeroSerie: testSerie,
      tipoEquipo,
      marca,
      modelo,
      estado: true,
    });
    const equipoId = testEquipo.id;

    const orderCreated = await ordersService.create({
      clientId: clienteSinCorreo.id,
      equipoId,
      problemaReportado: 'Equipo no enciende, prueba de auditoría de autorización',
      tipoOrden: 'EXPRESS',
      accesorios: ['Cargador'],
      tiempoEstimadoReparacion: 48,
    });

    assert(orderCreated && orderCreated.id, 'Orden de servicio creada exitosamente');
    assert(typeof orderCreated.tokenAccesoRaw === 'string', 'Retorna tokenAccesoRaw en la respuesta de creación');
    assert(orderCreated.tokenAccesoRaw.length === 32, 'El token raw tiene exactamente 32 caracteres hex (128 bits de entropía)');

    const rawToken = orderCreated.tokenAccesoRaw;
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const [dbOrder] = await dataSource.query(
      'SELECT "tokenAccesoHash", "tokenAccesoRevocado", "tokenAccesoIntentosFallidos", "tokenAccesoExpiracion" FROM orders WHERE id = $1',
      [orderCreated.id]
    );
    assert(dbOrder.tokenAccesoHash === expectedHash, 'En PostgreSQL se almacena exclusivamente el HASH SHA-256 del secreto (con select: false de seguridad)');
    assert(dbOrder.tokenAccesoRevocado === false, 'El token no está revocado');
    assert(dbOrder.tokenAccesoIntentosFallidos === 0, 'Contador de intentos fallidos inicia en 0');
    assert(new Date(dbOrder.tokenAccesoExpiracion) > new Date(), 'Fecha de expiración es válida en el futuro (~90 días)');

    // -----------------------------------------------------------------
    // ESCENARIO 5: Consulta pública en modo informativo (sin token)
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 5: Consulta pública informativa ---');
    const publicInfo = await ordersService.findPublicOrder(testCedulaNoMail, orderCreated.workOrderNumber);
    assert(publicInfo.workOrderNumber === orderCreated.workOrderNumber, 'Consulta pública encuentra la orden');
    assert(publicInfo.seguridad && publicInfo.seguridad.tokenValido === false, 'tokenValido es false (Modo Informativo)');
    assert(publicInfo.tokenAccesoHash === undefined, 'No expone tokenAccesoHash en respuesta pública');

    // -----------------------------------------------------------------
    // ESCENARIO 6: Seguridad Inmediata: Bloqueo del endpoint público anterior (403)
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 6: Bloqueo inmediato del endpoint público anterior ---');
    let endpointBlocked = false;
    try {
      await ordersController.handlePublicPresupuestoAction();
    } catch (err) {
      if (err.status === 403 && err.message.includes('ha sido revocado permanentemente')) {
        endpointBlocked = true;
      }
    }
    assert(endpointBlocked, 'Endpoint anterior POST public/consulta/presupuesto/action responde estrictamente 403 Forbidden');

    // -----------------------------------------------------------------
    // ESCENARIO 7: Intento con token inválido y conteo de fallos
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 7: Intento con token inválido e incremento de fallos ---');
    let tokenRejected = false;
    try {
      await ordersService.handlePrivatePresupuestoAction({
        workorder: orderCreated.workOrderNumber,
        token: '00001111222233334444555566667777', // token incorrecto
        action: 'ACEPTADO',
        autorizanteNombre: 'Intruso',
        autorizanteIdentificacion: '0999999999',
      });
    } catch (err) {
      if (err.status === 401 || err?.response?.statusCode === 401) {
        tokenRejected = true;
      }
    }
    assert(tokenRejected, 'Token falso rechazado con 401 Unauthorized');

    const orderAfterFail = await orderRepo.findOne({ where: { id: orderCreated.id } });
    assert(orderAfterFail.tokenAccesoIntentosFallidos === 1, 'Contador de intentos fallidos incrementado a 1');

    // -----------------------------------------------------------------
    // ESCENARIO 8: Bloqueo por fuerza bruta (Rate limiting / Lockout a los 5 fallos)
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 8: Bloqueo tras 5 intentos fallidos ---');
    for (let i = 2; i <= 5; i++) {
      try {
        await ordersService.handlePrivatePresupuestoAction({
          workorder: orderCreated.workOrderNumber,
          token: 'badbadbadbadbadbadbadbadbadbadba',
          action: 'ACEPTADO',
          autorizanteNombre: 'Intruso',
          autorizanteIdentificacion: '0999999999',
        });
      } catch (e) { }
    }

    const orderLocked = await orderRepo.findOne({ where: { id: orderCreated.id } });
    assert(orderLocked.tokenAccesoIntentosFallidos >= 5, 'Registrados 5 intentos fallidos');
    assert(orderLocked.tokenAccesoBloqueadoHasta && new Date(orderLocked.tokenAccesoBloqueadoHasta) > new Date(), 'Orden bloqueada temporalmente en base de datos');

    let lockoutTriggered = false;
    try {
      await ordersService.handlePrivatePresupuestoAction({
        workorder: orderCreated.workOrderNumber,
        token: rawToken, // Incluso con el token correcto, está bloqueado
        action: 'ACEPTADO',
        autorizanteNombre: 'Carlos Test',
        autorizanteIdentificacion: testCedulaNoMail,
      });
    } catch (err) {
      if (err.status === 429 || (err.status === 401 && err.message.includes('bloqueada temporalmente'))) {
        lockoutTriggered = true;
      }
    }
    assert(lockoutTriggered, 'Acceso bloqueado activado impidiendo fuerza bruta');

    // Desbloquear para continuar pruebas legítimas
    await orderRepo.update(orderCreated.id, {
      tokenAccesoIntentosFallidos: 0,
      tokenAccesoBloqueadoHasta: null,
    });

    // -----------------------------------------------------------------
    // ESCENARIO 9: Creación de presupuesto y autorización legítima con token
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 9: Presupuesto y autorización privada legítima ---');
    const estadoPendiente = await estadoPresupuestoRepo.findOne({ where: { id: 1 } });
    const presupuesto = await presupuestoService.create({
      ordenId: orderCreated.id,
      estadoId: estadoPendiente.id,
      descripcion: 'Presupuesto inicial para cambio de teclado y mantenimiento térmico',
    });

    // Obtener partes disponibles con stock suficiente para los ítems
    let partesDisponibles = await dataSource.query(`
      SELECT id, nombre, "precio1", stock 
      FROM parte 
      WHERE estado = true AND stock > 5
      ORDER BY stock DESC 
      LIMIT 2
    `);
    if (partesDisponibles.length < 2) {
      const parts = await dataSource.query(`SELECT id FROM parte WHERE estado = true LIMIT 2`);
      for (const p of parts) {
        await dataSource.query(`UPDATE parte SET stock = 100 WHERE id = $1`, [p.id]);
      }
      partesDisponibles = await dataSource.query(`
        SELECT id, nombre, "precio1", stock 
        FROM parte 
        WHERE estado = true AND stock > 5
        LIMIT 2
      `);
    }
    const parteId1 = partesDisponibles[0]?.id || 1;
    const parteId2 = partesDisponibles[1]?.id || parteId1;

    // Agregar items al presupuesto
    await detalleItemService.create({
      presupuestoId: presupuesto.id,
      parteId: parteId1,
      cantidad: 1,
      precioUnitario: 65.00,
    });
    await detalleItemService.create({
      presupuestoId: presupuesto.id,
      parteId: parteId2,
      cantidad: 1,
      precioUnitario: 35.00,
    });

    // Autorizar con el secreto legítimo de 128 bits
    const authResult = await ordersService.handlePrivatePresupuestoAction({
      workorder: orderCreated.workOrderNumber,
      token: rawToken,
      action: 'ACEPTADO',
      autorizanteNombre: 'Carlos Test',
      autorizanteIdentificacion: testCedulaNoMail,
      autorizanteParentesco: 'Titular',
    }, '127.0.0.1', 'Mozilla Test Runner');

    assert(authResult && authResult.success, 'Autorización privada procesada exitosamente');
    assert(typeof authResult.hashIntegridad === 'string' && authResult.hashIntegridad.length === 64, 'Generada huella digital SHA-256 de integridad de 64 caracteres');

    const presAfterAuth = await presupuestoService.findOne(presupuesto.id);
    assert(presAfterAuth.estado.nombre.toLowerCase().includes('aprob'), 'Estado del presupuesto actualizado a Aprobado');

    const autorizaciones = await autorizacionRepo.find({ where: { presupuestoId: presupuesto.id } });
    assert(autorizaciones.length === 1, 'Registrada 1 fila inmutable en autorizaciones_presupuesto');
    assert(autorizaciones[0].decision === 'APROBADO', 'Decisión registrada como APROBADO');
    assert(autorizaciones[0].modalidad === 'TOKEN_ODS_PRIVADO', 'Modalidad registrada como TOKEN_ODS_PRIVADO');
    assert(autorizaciones[0].versionPresupuesto === presAfterAuth.version, `Vinculado a versión ${presAfterAuth.version} del presupuesto`);
    assert(Number(autorizaciones[0].montoAprobado) === 100.00, 'Monto auditado exacto de $100.00');

    // -----------------------------------------------------------------
    // ESCENARIO 10: Modificación de alcance/monto incrementa versión y exige re-autorización
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 10: Modificación de alcance y re-autorización obligatoria ---');
    // Agregar un nuevo item modifica el alcance
    await detalleItemService.create({
      presupuestoId: presupuesto.id,
      parteId: parteId1,
      cantidad: 1,
      precioUnitario: 55.00,
    });

    const presScopeChanged = await presupuestoService.findOne(presupuesto.id);
    assert(presScopeChanged.version > presAfterAuth.version, 'La versión del presupuesto se incrementó automáticamente');
    assert(presScopeChanged.estado.nombre.toLowerCase().includes('pend'), 'El estado del presupuesto se revirtió automáticamente a Pendiente');

    // Intentar cambiar arbitrariamente a aprobado sin nueva autorización
    let bypassBlocked = false;
    try {
      const estadoAprobado = await estadoPresupuestoRepo.findOne({ where: { id: 2 } });
      await presupuestoService.update(presupuesto.id, { estadoId: estadoAprobado.id });
    } catch (err) {
      if (err.status === 400 && err.message.includes('sin una autorización verificable previa para la versión')) {
        bypassBlocked = true;
      }
    }
    assert(bypassBlocked, 'Intento de aprobación arbitraria por bypass en presupuesto bloqueado');

    // -----------------------------------------------------------------
    // ESCENARIO 11: Autorización presencial en ventanilla con firma táctil
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 11: Autorización presencial con firma táctil ---');
    const presencialResult = await ordersService.handlePresupuestoActionPresencial(
      orderCreated.id,
      {
        action: 'ACEPTADO',
        autorizanteNombre: 'Carlos Test',
        autorizanteIdentificacion: testCedulaNoMail,
        autorizanteParentesco: 'Titular',
        firmaBase64: SAMPLE_SIGNATURE_BASE64,
        notas: 'Aprobación presencial firmada en tablet de recepción',
      },
      adminUser.id,
      '127.0.0.1',
      'Tablet Counter Chrome'
    );

    assert(presencialResult && presencialResult.success, 'Autorización presencial completada con éxito');
    assert(presencialResult.documentoOrdenId !== null, 'Comprobante canónico PDF registrado y sellado');

    const presAfterPresencial = await presupuestoService.findOne(presupuesto.id);
    assert(presAfterPresencial.estado.nombre.toLowerCase().includes('aprob'), 'Presupuesto aprobado tras firma presencial');

    const autPresencial = await autorizacionRepo.findOne({
      where: { presupuestoId: presupuesto.id, versionPresupuesto: presAfterPresencial.version },
    });
    assert(autPresencial !== null, 'Fila auditada registrada en autorizaciones_presupuesto');
    assert(autPresencial.modalidad === 'PRESENCIAL_FIRMA', 'Modalidad registrada como PRESENCIAL_FIRMA');
    assert(autPresencial.registradoPorId === adminUser.id, 'Registrado ID del empleado testigo');
    assert(Number(autPresencial.montoAprobado) === 155.00, 'Monto auditado exacto para versión actualizada ($155.00)');

    // -----------------------------------------------------------------
    // ESCENARIO 12: Regeneración y Revocación de credencial de acceso
    // -----------------------------------------------------------------
    console.log('\n--- ESCENARIO 12: Regeneración y revocación de credencial ---');
    const regenResult = await ordersService.regenerarCredencialOrden(orderCreated.id, adminUser.id);
    assert(regenResult && regenResult.rawSecret, 'Nueva credencial de 128 bits generada');

    const newTokenRaw = regenResult.rawSecret;
    assert(newTokenRaw !== rawToken, 'El nuevo token es diferente del token anterior');

    // Verificar que el token viejo ya no valida
    const oldTokenQuery = await ordersService.findPublicOrder(testCedulaNoMail, orderCreated.workOrderNumber, rawToken);
    assert(oldTokenQuery.seguridad && oldTokenQuery.seguridad.tokenValido === false, 'El token anterior queda invalidado inmediatamente');

    // Revocar credencial
    const revocResult = await ordersService.revocarCredencialOrden(orderCreated.id, adminUser.id);
    assert(revocResult && revocResult.message, 'Credencial revocada con éxito');

    const revokedTokenQuery = await ordersService.findPublicOrder(testCedulaNoMail, orderCreated.workOrderNumber, newTokenRaw);
    assert(revokedTokenQuery.seguridad && revokedTokenQuery.seguridad.tokenValido === false && revokedTokenQuery.seguridad.tokenMensaje.includes('revocada'), 'Credencial revocada no permite acceso validado');

    // -----------------------------------------------------------------
    // LIMPIEZA DE DATOS AISLADOS DE PRUEBA
    // -----------------------------------------------------------------
    console.log('\n--- Limpieza de datos aislados de prueba ---');
    await cleanTestData();
    console.log('✅ Datos de prueba limpiados correctamente.');

    console.log('\n===============================================================');
    console.log(`🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO: ${passedTests}/${totalTests}`);
    console.log('===============================================================');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA SUITE DE PRUEBAS:', error);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

runTestSuite();
