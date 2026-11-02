import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSignatureBehavior() {
  console.log('=== VERIFICANDO FIRMA Y CONTENT-TYPE EN R2 ===\n');

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;

  // Caso A: Con ContentType en PutObjectCommand
  const keyA = `test_sig_with_ct_${Date.now()}.mp4`;
  const cmdA = new PutObjectCommand({
    Bucket: bucketName,
    Key: keyA,
    ContentType: 'video/mp4',
  });
  const urlA = await getSignedUrl(s3Client, cmdA, { expiresIn: 300 });
  console.log('Caso A URL firmada:', urlA.includes('content-type') ? 'Incluye content-type en X-Amz-SignedHeaders' : 'Solo host');

  // Enviar PUT con video/mp4
  const resA = await fetch(urlA, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: Buffer.from('TEST_A'),
  });
  console.log('Caso A Status (Mismo Content-Type):', resA.status);

  // Enviar PUT con Content-Type ligeramente diferente (ej. si el navegador añade charset o varia)
  const resA_mismatch = await fetch(urlA, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4; charset=UTF-8' },
    body: Buffer.from('TEST_A_MISMATCH'),
  });
  console.log('Caso A Status con Content-Type diferente:', resA_mismatch.status, '(403 SignatureDoesNotMatch si es estricto)');

  // Caso B: Sin ContentType en la firma (firma flexible)
  const keyB = `test_sig_flexible_${Date.now()}.mp4`;
  const cmdB = new PutObjectCommand({
    Bucket: bucketName,
    Key: keyB,
  });
  const urlB = await getSignedUrl(s3Client, cmdB, { expiresIn: 300 });
  console.log('\nCaso B URL firmada:', urlB.includes('content-type') ? 'Incluye content-type' : 'Solo host (Firma flexible)');

  // Enviar PUT con cualquier Content-Type
  const resB = await fetch(urlB, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: Buffer.from('TEST_B'),
  });
  console.log('Caso B Status (PUT con video/mp4):', resB.status);

  // Comprobar si R2 guardó el Content-Type enviado por el cliente
  const headB = await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: keyB }));
  console.log('Caso B Content-Type guardado en R2:', headB.ContentType);

  // Cleanup
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: keyA }));
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: keyB }));
  console.log('\nObjetos de prueba limpiados.');
}

testSignatureBehavior();
