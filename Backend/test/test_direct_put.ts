import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testPut() {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const testKey = 'test_direct_put_' + Date.now() + '.mp4';
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: testKey,
    ContentType: 'video/mp4',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  console.log('Presigned URL generated.');

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
    },
    body: Buffer.from('FAKE_VIDEO_STREAM_BYTES_FOR_DIRECT_PUT_TEST'),
  });

  console.log('PUT Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response body:', text || '(200 OK éxito)');

  // Clean up
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: testKey,
  }));
  console.log('Objeto de prueba eliminado de R2.');
}

testPut();
