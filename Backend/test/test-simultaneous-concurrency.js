const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testSimultaneousConcurrency() {
  console.log('========================================================================');
  console.log('   PRUEBA DE CONCURRENCIA VERDADERAMENTE SIMULTÁNEA (Promise.all)');
  console.log('========================================================================\n');

  // 1. Autenticación
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    correo: 'audit.admin@hospital.test',
    password: 'TestPassword123!',
  });

  const token = loginRes.body.token || loginRes.body.access_token;
  if (!token) {
    console.error('Error de autenticación:', loginRes.body);
    process.exit(1);
  }
  console.log('✓ Token de sesión obtenido exitosamente.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Crear equipo para prueba
  const testSn = `TEST-SN-SIM-${Date.now()}`;
  const equipoRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/equipos',
    method: 'POST',
    headers: authHeaders,
  }, {
    tipoEquipoId: 1,
    marcaId: 1,
    numeroSerie: testSn,
  });

  const testEquipoId = equipoRes.body.id;
  console.log(`✓ Equipo de prueba generado: ID #${testEquipoId} (SN: ${testSn})\n`);

  // -------------------------------------------------------------------------
  // PARTE 1: DOS SOLICITUDES DE CREACIÓN SIMULTÁNEAS CON LA MISMA CLAVE
  // -------------------------------------------------------------------------
  console.log('--- 1. TEST: 2 CREACIONES SIMULTÁNEAS CON IDÉNTICO clientRequestId ---');
  const sharedRequestId = `test_req_sim_${Date.now()}`;
  const creationPayload = {
    clientId: 93,
    equipoId: testEquipoId,
    problemaReportado: 'Falla en placa de control tras descarga',
    accesorios: ['Fuente poder 19V'],
    clientRequestId: sharedRequestId,
  };

  console.log(`Disparando 2 peticiones POST /orders con clientRequestId="${sharedRequestId}" simultáneamente...`);
  const t0Create = Date.now();
  const [createA, createB] = await Promise.all([
    request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/orders',
      method: 'POST',
      headers: authHeaders,
    }, creationPayload),
    request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/orders',
      method: 'POST',
      headers: authHeaders,
    }, creationPayload),
  ]);
  const elapsedCreate = Date.now() - t0Create;

  console.log(`\nResultados de Creación Simultánea (${elapsedCreate}ms):`);
  console.log(`  Petición A -> HTTP Status: ${createA.status}, Order ID: ${createA.body?.id}, ODS: #${createA.body?.workOrderNumber}`);
  console.log(`  Petición B -> HTTP Status: ${createB.status}, Order ID: ${createB.body?.id}, ODS: #${createB.body?.workOrderNumber}`);

  let createSuccess = false;
  if ((createA.status === 201 || createA.status === 200) &&
      (createB.status === 201 || createB.status === 200) &&
      createA.body?.id &&
      createA.body.id === createB.body?.id) {
    console.log('✓ ÉXITO: Idempotencia persistente verificada. Ambas peticiones concurrentes devolvieron exactamente la misma orden (ID #' + createA.body.id + ') sin duplicados.');
    createSuccess = true;
  } else {
    console.error('✗ FALLO: Inconsistencia en la creación concurrente:', { createA, createB });
  }

  const orderId = createA.body?.id || createB.body?.id;
  if (!orderId) {
    console.error('No se pudo continuar sin un orderId válido.');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // PARTE 2: DOS ACTUALIZACIONES SIMULTÁNEAS SOBRE LA MISMA VERSIÓN
  // -------------------------------------------------------------------------
  console.log('\n--- 2. TEST: 2 ACTUALIZACIONES SIMULTÁNEAS SOBRE LA MISMA VERSIÓN ---');

  // Obtener orden actual y su versión base
  const fetchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/orders/${orderId}`,
    method: 'GET',
    headers: authHeaders,
  });

  const baseVersion = fetchRes.body.version || 1;
  console.log(`Orden #${orderId} obtenida. Versión inicial en base de datos: ${baseVersion}`);

  const updatePayload1 = {
    problemaReportado: 'Actualización simultánea: Hilo 1 (Técnico A)',
    tiempoEstimadoReparacion: 2.0,
    version: baseVersion,
  };

  const updatePayload2 = {
    problemaReportado: 'Actualización simultánea: Hilo 2 (Técnico B)',
    tiempoEstimadoReparacion: 4.5,
    version: baseVersion,
  };

  console.log(`Disparando 2 peticiones PATCH /orders/${orderId} simultáneas con versión=${baseVersion}...`);
  const t0Update = Date.now();
  const [updateA, updateB] = await Promise.all([
    request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/orders/${orderId}`,
      method: 'PATCH',
      headers: authHeaders,
    }, updatePayload1),
    request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/orders/${orderId}`,
      method: 'PATCH',
      headers: authHeaders,
    }, updatePayload2),
  ]);
  const elapsedUpdate = Date.now() - t0Update;

  console.log(`\nResultados de Actualización Simultánea (${elapsedUpdate}ms):`);
  console.log(`  Petición 1 -> HTTP Status: ${updateA.status}, Body: ${JSON.stringify(updateA.body?.message || 'OK Versión: ' + updateA.body?.version)}`);
  console.log(`  Petición 2 -> HTTP Status: ${updateB.status}, Body: ${JSON.stringify(updateB.body?.message || 'OK Versión: ' + updateB.body?.version)}`);

  const statuses = [updateA.status, updateB.status].sort();
  let concurrencySuccess = false;

  if (statuses[0] === 200 && statuses[1] === 409) {
    console.log('✓ ÉXITO: Control de Concurrencia Optimista Verificado.');
    console.log('  - Una petición ganó la carrera y avanzó la versión (HTTP 200).');
    console.log('  - La otra petición fue rechazada con HTTP 409 Conflict protegiendo contra Lost Updates.');
    concurrencySuccess = true;
  } else {
    console.error('✗ FALLO: Comportamiento inesperado en concurrencia:', statuses);
  }

  // Verificar estado final en base de datos
  const finalFetch = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/orders/${orderId}`,
    method: 'GET',
    headers: authHeaders,
  });

  console.log(`\nEstado final en Base de Datos:`);
  console.log(`  Versión actual: ${finalFetch.body.version} (incrementó de ${baseVersion} a ${finalFetch.body.version})`);
  console.log(`  Problema Reportado registrado: "${finalFetch.body.problemaReportado}"`);
  console.log(`  Tiempo Estimado registrado: ${finalFetch.body.tiempoEstimadoReparacion}h`);

  console.log('\n========================================================================');
  if (createSuccess && concurrencySuccess) {
    console.log('  RESUMEN: AMBAS PRUEBAS DE CONCURRENCIA SIMULTÁNEA PASARON AL 100%');
  } else {
    console.log('  RESUMEN: HUBO FALLOS EN LAS PRUEBAS DE CONCURRENCIA');
  }
  console.log('========================================================================\n');
}

testSimultaneousConcurrency().catch(err => {
  console.error('Error fatal en prueba de concurrencia:', err);
  process.exit(1);
});
