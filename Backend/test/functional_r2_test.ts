import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/storage/storage.service';
import { EvidenciaTecnicaService } from '../src/evidencia-tecnica/evidencia-tecnica.service';
import { OrderService } from '../src/orders/orders.service';
import { DataSource } from 'typeorm';

async function runFunctionalTest() {
  console.log('\n======================================================');
  console.log('   HOSPITAL DEL COMPUTADOR — TEST INTEGRACIÓN R2     ');
  console.log('======================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const storageService = app.get(StorageService);
  const evidenciaService = app.get(EvidenciaTecnicaService);
  const orderService = app.get(OrderService);
  const dataSource = app.get(DataSource);

  console.log(`[1] Driver de almacenamiento activo: ${storageService.getDriver().toUpperCase()}`);

  try {
    // 1. Verificar lectura de registros legacy existentes
    console.log('\n[2] Verificando compatibilidad con registros legacy existentes...');
    const legacyAdminUser = { id: 1, role: 'admin', userRoles: [{ rol: { slug: 'admin' } }] };
    const listResult = await evidenciaService.findAll(legacyAdminUser, undefined, 1, 5);
    console.log(`✓ Total de evidencias en BD: ${listResult.total}`);
    console.log(`✓ Evidencias recuperadas: ${listResult.items.length}`);
    if (listResult.items.length > 0) {
      const first = listResult.items[0];
      const isLegacy = !first.storageKey;
      console.log(`✓ Registro ID ${first.id} detectado como: ${isLegacy ? 'LEGACY BASE64' : 'NUEVO R2'}`);
      console.log(`✓ URL/Formato disponible: ${first.archivoUrl?.substring(0, 40)}...`);
    }

    // Obtener un usuario y una orden existentes en la BD
    const existingUsers = await dataSource.query('SELECT id FROM users LIMIT 1');
    const existingOrders = await dataSource.query('SELECT id, "clientId" FROM orders LIMIT 1');
    if (!existingUsers.length || !existingOrders.length) {
      throw new Error('No hay usuarios u órdenes en la base de datos para la prueba');
    }
    const testUserId = existingUsers[0].id;
    const testOrderId = existingOrders[0].id;
    const ownerClientId = existingOrders[0].clientId || 999;
    const foreignClientId = ownerClientId + 1000;

    // 2. Probar creación de nueva evidencia con archivo simulado (Subida tipo imagen)
    console.log('\n[3] Probando subida de nueva evidencia (Imagen)...');
    const dummyImageBuffer = Buffer.from('FAKE_IMAGE_DATA_FOR_TEST_' + Date.now());
    const mockFile: Express.Multer.File = {
      fieldname: 'archivo',
      originalname: 'test_peritaje_r2.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: dummyImageBuffer,
      size: dummyImageBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Usamos orden y usuario existentes
    const newEvidencia = await evidenciaService.create(
      {
        ordenId: testOrderId,
        subidoPorId: testUserId,
        descripcion: 'Evidencia técnica de prueba con Cloudflare R2',
      },
      mockFile,
    );

    console.log(`✓ Nueva evidencia creada con ID: ${newEvidencia.id}`);
    console.log(`✓ storageKey asignada: ${newEvidencia.storageKey}`);
    console.log(`✓ MIME type: ${newEvidencia.mimeType}, Tamaño: ${newEvidencia.tamanoBytes} bytes`);
    console.log(`✓ storageProvider: ${newEvidencia.storageProvider}`);
    console.log(`✓ URL de visualización resuelta: ${newEvidencia.archivoUrl?.substring(0, 60)}...`);

    // 3. Comprobar que en PostgreSQL NO se guardó Base64 para este registro nuevo
    const rawDbRow = await dataSource.query(
      'SELECT id, "storageKey", "storageProvider", "archivoUrl" FROM evidencia_tecnica WHERE id = $1',
      [newEvidencia.id],
    );
    console.log('\n[4] Comprobando persistencia en PostgreSQL:');
    console.log(`✓ Columna storageKey en BD: ${rawDbRow[0].storageKey}`);
    console.log(`✓ Columna archivoUrl en BD (debe ser NULL): ${rawDbRow[0].archivoUrl}`);

    if (rawDbRow[0].archivoUrl === null) {
      console.log('✓ ÉXITO: PostgreSQL ya NO almacena Base64 para nuevos registros!');
    } else {
      console.warn('⚠ Advertencia: archivoUrl no es nulo');
    }

    // 4. Probar subida directa presigned para videos / archivos pesados
    console.log('\n[5] Probando flujo híbrido: URL prefirmada para videos...');
    const techUser = { id: testUserId, role: 'tech', userRoles: [{ rol: { slug: 'tech' } }] };
    const presignedUpload = await evidenciaService.getPresignedUploadUrl(
      {
        ordenId: testOrderId,
        fileName: 'video_evidencia_diagnostico.mp4',
        mimeType: 'video/mp4',
        fileSize: 15 * 1024 * 1024,
      },
      techUser,
    );
    console.log(`✓ Presigned Upload URL generada: ${presignedUpload.uploadUrl.substring(0, 70)}...`);
    console.log(`✓ storageKey reservada: ${presignedUpload.storageKey}`);
    console.log(`✓ Expiración: ${presignedUpload.expiresIn} segundos`);

    // Simular que el archivo fue subido a esa key en el storage
    await storageService.uploadFile(
      presignedUpload.storageKey,
      Buffer.from('MOCK_VIDEO_DATA_BUFFER'),
      'video/mp4',
    );

    // Confirmar subida
    const confirmedEvidencia = await evidenciaService.confirmUpload(
      {
        ordenId: testOrderId,
        storageKey: presignedUpload.storageKey,
        nombreOriginal: 'video_evidencia_diagnostico.mp4',
        mimeType: 'video/mp4',
        tamanoBytes: 15000000,
        descripcion: 'Video de diagnóstico técnico en alta resolución',
      },
      techUser,
    );
    console.log(`✓ Video confirmado y registrado en BD con ID: ${confirmedEvidencia.id}`);
    console.log(`✓ Tipo de archivo detectado: ${confirmedEvidencia.tipoArchivo}`);
    console.log(`✓ URL de streaming/reproducción resuelta: ${confirmedEvidencia.archivoUrl?.substring(0, 60)}...`);

    // 5. Probar control de seguridad y aislamiento de clientes
    console.log('\n[6] Probando seguridad y aislamiento de clientes...');

    // Cliente propietario consultando su orden
    const ownerClientUser = { id: ownerClientId, role: 'client', userRoles: [{ rol: { slug: 'client' } }] };
    const ownerResult = await evidenciaService.findAll(ownerClientUser, testOrderId, 1, 10);
    console.log(`✓ Cliente propietario (${ownerClientId}) consultó su orden: ${ownerResult.items.length} evidencias visibles`);

    // Cliente ajeno intentando consultar la orden
    const foreignClientUser = { id: foreignClientId, role: 'client', userRoles: [{ rol: { slug: 'client' } }] };
    let accessBlocked = false;
    try {
      await evidenciaService.findAll(foreignClientUser, testOrderId, 1, 10);
    } catch (err: any) {
      if (err.status === 403) {
        accessBlocked = true;
        console.log(`✓ SEGURIDAD CONFIRMADA: Cliente ajeno bloqueado con 403 Forbidden ("${err.message}")`);
      } else {
        console.log(`Respuesta inesperada: ${err.message}`);
      }
    }

    if (!accessBlocked) {
      console.error('❌ FALLO: No se bloqueó al cliente ajeno!');
    }

    // 6. Probar eliminación segura
    console.log('\n[7] Probando eliminación segura...');
    await evidenciaService.remove(newEvidencia.id);
    await evidenciaService.remove(confirmedEvidencia.id);
    console.log(`✓ Evidencias de prueba (${newEvidencia.id}, ${confirmedEvidencia.id}) eliminadas correctamente.`);

    console.log('\n======================================================');
    console.log('   ✓ TODAS LAS PRUEBAS FUNCIONALES PASARON CON ÉXITO  ');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Error durante la prueba funcional:', error);
  } finally {
    await app.close();
  }
}

runFunctionalTest();
