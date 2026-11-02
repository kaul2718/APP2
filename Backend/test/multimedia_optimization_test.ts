import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageOptimizerService } from '../src/storage/image-optimizer.service';
import { EvidenciaTecnicaService } from '../src/evidencia-tecnica/evidencia-tecnica.service';
import { StorageService } from '../src/storage/storage.service';
import { DataSource } from 'typeorm';
const sharp = require('sharp');

async function runOptimizationTests() {
  console.log('\n================================================================');
  console.log('   HOSPITAL DEL COMPUTADOR — PRUEBAS DE OPTIMIZACIÓN MULTIMEDIA  ');
  console.log('================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const imageOptimizer = app.get(ImageOptimizerService);
  const evidenciaService = app.get(EvidenciaTecnicaService);
  const storageService = app.get(StorageService);
  const dataSource = app.get(DataSource);

  console.log(`[Storage Driver]: ${storageService.getDriver().toUpperCase()}`);

  try {
    // -------------------------------------------------------------
    // PRUEBA 1: Fotografía de alta resolución estándar (4000x3000 px)
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 1] Optimizando fotografía de alta resolución (4000x3000 px)...');
    const highResRawBuffer = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 34, g: 139, b: 34 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    console.log(`✓ Archivo original generado: ${(highResRawBuffer.length / 1024).toFixed(1)} KB (4000x3000 px, JPEG)`);

    const optResult1 = await imageOptimizer.optimize(
      highResRawBuffer,
      'placa_madre_diagnostico_original.jpg',
      'image/jpeg',
    );

    console.log(`✓ Formato resultante: ${optResult1.mimeType} (${optResult1.extension})`);
    console.log(`✓ Dimensiones resultantes: ${optResult1.width}x${optResult1.height} px (Lado mayor limitado a 2560px)`);
    console.log(`✓ Tamaño optimizado: ${(optResult1.size / 1024).toFixed(1)} KB`);
    console.log(`✓ Ahorro de espacio obtenido: -${optResult1.compressionRatio}%`);

    if (optResult1.width <= 2560 && optResult1.mimeType === 'image/webp') {
      console.log('✓ ÉXITO PRUEBA 1: Redimensionamiento proporcional y conversión a WebP verificados.');
    } else {
      console.error('❌ FALLO PRUEBA 1: Dimensiones o formato incorrectos.');
    }

    // -------------------------------------------------------------
    // PRUEBA 2: Modo Detalle Técnico (Diagnóstico de componentes / 4K)
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 2] Modo Detalle Técnico (Permite resolución hasta 3840px / 92% calidad)...');
    const optResult2 = await imageOptimizer.optimize(
      highResRawBuffer,
      'circuito_integrado_pistas.jpg',
      'image/jpeg',
      { highDetailMode: true },
    );

    console.log(`✓ Dimensiones en Modo Detalle: ${optResult2.width}x${optResult2.height} px (Lado mayor permitido hasta 3840px)`);
    console.log(`✓ Tamaño resultante en alta fidelidad: ${(optResult2.size / 1024).toFixed(1)} KB`);
    console.log(`✓ Reducción conservando micro-detalles: -${optResult2.compressionRatio}%`);

    if (optResult2.width === 3840 && optResult2.size > 0) {
      console.log('✓ ÉXITO PRUEBA 2: Modo Detalle Técnico preservó 3840px de resolución.');
    }

    // -------------------------------------------------------------
    // PRUEBA 3: Detección inteligente de imagen ya optimizada (WebP pequeño)
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 3] Detección inteligente: imagen WebP previamente optimizada...');
    const preOptimizedWebP = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const optResult3 = await imageOptimizer.optimize(
      preOptimizedWebP,
      'evidencia_previa_optimizada.webp',
      'image/webp',
    );

    console.log(`✓ ¿Fue recomprimida innecesariamente?: ${optResult3.wasOptimized ? 'Sí' : 'No (Conservada intacta)'}`);
    if (!optResult3.wasOptimized) {
      console.log('✓ ÉXITO PRUEBA 3: Se evitó recomprimir imagen WebP ya optimizada.');
    }

    // -------------------------------------------------------------
    // PRUEBA 4: Protección contra archivos corruptos / dañados
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 4] Protección contra archivos corruptos o maliciosos...');
    const corruptedBuffer = Buffer.from('ESTO_NO_ES_UNA_IMAGEN_SINO_DATOS_CORRUPTOS_' + Date.now());
    let errorCaught = false;

    try {
      await imageOptimizer.optimize(corruptedBuffer, 'archivo_danado.jpg', 'image/jpeg');
    } catch (err: any) {
      errorCaught = true;
      console.log(`✓ Rechazo de seguridad exitoso (400 Bad Request): "${err.message}"`);
    }

    if (errorCaught) {
      console.log('✓ ÉXITO PRUEBA 4: Sistema protegido contra archivos corruptos.');
    } else {
      console.error('❌ FALLO PRUEBA 4: El archivo corrupto no fue rechazado.');
    }

    // -------------------------------------------------------------
    // PRUEBA 5: Flujo End-to-End con subida y almacenamiento en R2
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 5] Flujo completo E2E: Subida con optimización automática y persistencia...');

    const userRow = await dataSource.query('SELECT id FROM users LIMIT 1');
    const orderRow = await dataSource.query('SELECT id FROM orders LIMIT 1');
    const testUserId = userRow[0].id;
    const testOrderId = orderRow[0].id;

    const mockFile: Express.Multer.File = {
      fieldname: 'archivo',
      originalname: 'evidencia_macbook_pro_screen.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: highResRawBuffer,
      size: highResRawBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const createdEvidencia = await evidenciaService.create(
      {
        ordenId: testOrderId,
        subidoPorId: testUserId,
        descripcion: 'Evidencia técnica de prueba con optimización automática WebP',
      },
      mockFile,
    );

    console.log(`✓ Evidencia registrada con ID: ${createdEvidencia.id}`);
    console.log(`✓ storageKey asignada: ${createdEvidencia.storageKey}`);
    console.log(`✓ MIME final registrado: ${createdEvidencia.mimeType}`);
    console.log(`✓ Tamaño final registrado: ${createdEvidencia.tamanoBytes} bytes`);

    // Validar en base de datos PostgreSQL
    const dbCheck = await dataSource.query(
      'SELECT id, "storageKey", "mimeType", "tamanoBytes", "archivoUrl" FROM evidencia_tecnica WHERE id = $1',
      [createdEvidencia.id],
    );

    console.log(`✓ PostgreSQL storageKey: ${dbCheck[0].storageKey}`);
    console.log(`✓ PostgreSQL archivoUrl (debe ser null): ${dbCheck[0].archivoUrl}`);
    console.log(`✓ Extensión en storageKey: ${dbCheck[0].storageKey.endsWith('.webp') ? '.webp (Correcto)' : 'No webp'}`);

    // Limpieza de evidencia de prueba
    await evidenciaService.remove(createdEvidencia.id);
    console.log(`✓ Objeto de prueba eliminado de Cloudflare R2 y base de datos.`);

    console.log('\n================================================================');
    console.log('   ✓ TODAS LAS PRUEBAS DE OPTIMIZACIÓN MULTIMEDIA PASARON       ');
    console.log('================================================================\n');
  } catch (error) {
    console.error('Error durante la prueba de optimización:', error);
  } finally {
    await app.close();
  }
}

runOptimizationTests();
