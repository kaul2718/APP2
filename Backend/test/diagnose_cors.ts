import { S3Client, GetBucketCorsCommand, PutBucketCorsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
  console.log('=== DIAGNÓSTICO DE CORS Y URLS PREFIRMADAS EN CLOUDFLARE R2 ===\n');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'hospital-computador-dev';
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  // 1. Consultar configuración CORS actual del bucket
  console.log(`[1] Consultando configuración CORS en el bucket "${bucketName}"...`);
  try {
    const corsRes = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    console.log('✓ Configuración CORS existente encontrada:');
    console.log(JSON.stringify(corsRes.CORSRules, null, 2));
  } catch (err: any) {
    console.log(`❌ Error al obtener CORS: ${err.name} - ${err.message}`);
    if (err.name === 'NoSuchCORSConfiguration' || err.$metadata?.httpStatusCode === 404) {
      console.log('👉 CONFIRMADO: El bucket NO tiene ninguna regla CORS configurada. Todas las solicitudes preflight OPTIONS del navegador fallarán con "Failed to fetch".');
    }
  }

  // 2. Generar una URL prefirmada PUT tal como lo hace el backend
  console.log('\n[2] Generando URL prefirmada de subida para un video...');
  const testKey = `test_video_${Date.now()}.mp4`;
  const mimeType = 'video/mp4';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: testKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  console.log(`✓ URL prefirmada generada (primeros 90 chars): ${uploadUrl.substring(0, 90)}...`);

  // 3. Simular la petición PREFLIGHT (OPTIONS) que hace el navegador desde http://localhost:4000
  console.log('\n[3] Simulando petición preflight OPTIONS desde http://localhost:4000...');
  try {
    const preflightRes = await fetch(uploadUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4000',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    console.log(`Status de respuesta preflight: ${preflightRes.status} ${preflightRes.statusText}`);
    console.log('Cabeceras recibidas:');
    preflightRes.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });

    const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
    if (!allowOrigin) {
      console.log('\n❌ FALLO DE CORS CONFIRMADO: La respuesta NO incluye "access-control-allow-origin".');
      console.log('   Por esta razón exacta, el navegador rechaza inmediatamente el fetch con "TypeError: Failed to fetch".');
    } else {
      console.log(`\n✓ Cabecera allow-origin presente: ${allowOrigin}`);
    }
  } catch (fetchErr: any) {
    console.log(`Error al ejecutar preflight OPTIONS: ${fetchErr.message}`);
  }

  // 4. Intentar aplicar la regla CORS si el token tiene permisos PutBucketCors
  console.log('\n[4] Comprobando si el token API tiene permisos para aplicar PutBucketCorsCommand...');
  const targetCorsRules = [
    {
      AllowedOrigins: [
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:4000',
        'http://127.0.0.1:3000',
      ],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag', 'Content-Type', 'Content-Length'],
      MaxAgeSeconds: 3600,
    },
  ];

  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: targetCorsRules,
        },
      }),
    );
    console.log('✓ ÉXITO: Se aplicó la configuración CORS mediante S3 API!');
  } catch (corsPutErr: any) {
    console.log(`ℹ Nota sobre PutBucketCors: ${corsPutErr.name} - ${corsPutErr.message}`);
  }
}

diagnose();
