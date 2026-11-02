const { Client } = require('pg');
const { S3Client, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function runComprehensiveReconciliation(targetDbName = null) {
  const dbName = targetDbName || process.env.DB_DATABASE || 'hdc';
  console.log('========================================================================');
  console.log(`   AUDITORÍA INTEGRAL Y RECONCILIACIÓN: BD [${dbName}] <-> CLOUDFLARE R2`);
  console.log('========================================================================\n');

  // 1. Conexión a PostgreSQL
  const dbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: dbName,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dbClient.connect();
    console.log(`✓ Conectado a PostgreSQL [${dbName}] exitosamente.`);
  } catch (err) {
    console.error('✗ Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }

  // 2. Conexión a Cloudflare R2
  const bucketName = process.env.R2_BUCKET_NAME || 'hospital-computador-dev';
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  let endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    console.error('✗ Faltan credenciales de Cloudflare R2 en el archivo .env');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
  });
  console.log(`✓ Cliente Cloudflare R2 inicializado (Bucket: ${bucketName})\n`);

  // Conjunto de todas las llaves referenciadas en BD para detectar huérfanos
  const knownKeysInDb = new Set();

  let stats = {
    totalDbReferences: 0,
    validInR2: 0,
    missingInR2: 0,
    shaVerifiedMatch: 0,
    shaMismatches: 0,
    unhashedValidFiles: 0, // Firmas PNG, evidencias JPG donde la BD no almacena hash
    legacyBase64InDb: 0,
    orphansInR2: 0,
  };

  // --- A. DOCUMENTOS DE ÓRDENES (PDFs y FIRMAS) ---
  console.log('--- 1. AUDITORÍA DE DOCUMENTOS FIRMADOS (ACTAS Y FIRMAS) ---');
  const docsRes = await dbClient.query(`
    SELECT d.id, d."ordenId", d."tipoDocumento", d."storageKeyPdf", d."storageKeyFirma", d."pdfSha256", d."estadoFirma",
           o."workOrderNumber"
    FROM "documentos_orden" d
    LEFT JOIN "orders" o ON o.id = d."ordenId"
    ORDER BY d.id DESC;
  `);

  console.log(`Documentos de orden encontrados: ${docsRes.rows.length}`);

  for (const doc of docsRes.rows) {
    // 1. PDF
    if (doc.storageKeyPdf) {
      stats.totalDbReferences++;
      knownKeysInDb.add(doc.storageKeyPdf);

      try {
        const head = await s3.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: doc.storageKeyPdf,
        }));
        stats.validInR2++;

        if (doc.pdfSha256) {
          const getRes = await s3.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: doc.storageKeyPdf,
          }));
          const buffer = await streamToBuffer(getRes.Body);
          const computedSha = crypto.createHash('sha256').update(buffer).digest('hex');

          if (computedSha.toLowerCase() === doc.pdfSha256.toLowerCase()) {
            stats.shaVerifiedMatch++;
            console.log(`  ✓ ODS #${doc.workOrderNumber} [${doc.tipoDocumento}] PDF SHA-256 verificado (${head.ContentLength} bytes)`);
          } else {
            stats.shaMismatches++;
            console.error(`  ✗ DISCREPANCIA SHA-256 en ODS #${doc.workOrderNumber} [${doc.tipoDocumento}]. Esperado: ${doc.pdfSha256}, Calculado: ${computedSha}`);
          }
        } else {
          stats.unhashedValidFiles++;
          console.log(`  ✓ ODS #${doc.workOrderNumber} [${doc.tipoDocumento}] PDF existe en R2 (Sin hash SHA-256 en BD)`);
        }
      } catch (err) {
        stats.missingInR2++;
        console.error(`  ✗ FALTA EN R2: PDF ODS #${doc.workOrderNumber} '${doc.storageKeyPdf}' -> ${err.message}`);
      }
    }

    // 2. Firma manuscrita
    if (doc.storageKeyFirma) {
      stats.totalDbReferences++;
      knownKeysInDb.add(doc.storageKeyFirma);

      try {
        const head = await s3.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: doc.storageKeyFirma,
        }));
        stats.validInR2++;
        stats.unhashedValidFiles++;
        console.log(`  ✓ ODS #${doc.workOrderNumber} [${doc.tipoDocumento}] Firma manuscrita existe en R2 (${head.ContentLength} bytes)`);
      } catch (err) {
        stats.missingInR2++;
        console.error(`  ✗ FALTA EN R2: Firma '${doc.storageKeyFirma}' -> ${err.message}`);
      }
    }
  }

  // --- B. EVIDENCIAS TÉCNICAS (FOTOS Y VIDEOS) ---
  console.log('\n--- 2. AUDITORÍA DE EVIDENCIAS TÉCNICAS (FOTOGRAFÍAS / VIDEOS) ---');
  const evidenciasRes = await dbClient.query(`
    SELECT e.id, e."ordenId", e."storageKey", e."storageProvider", e."tipoArchivo",
           o."workOrderNumber"
    FROM "evidencia_tecnica" e
    LEFT JOIN "orders" o ON o.id = e."ordenId"
    ORDER BY e.id DESC;
  `);

  console.log(`Evidencias técnicas encontradas en BD: ${evidenciasRes.rows.length}`);

  for (const ev of evidenciasRes.rows) {
    if (ev.storageKey) {
      stats.totalDbReferences++;
      knownKeysInDb.add(ev.storageKey);

      try {
        const head = await s3.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: ev.storageKey,
        }));
        stats.validInR2++;
        stats.unhashedValidFiles++;
        console.log(`  ✓ Evidencia #${ev.id} (ODS #${ev.workOrderNumber}) [${ev.tipoArchivo}] existe en R2 (${head.ContentType}, ${head.ContentLength} bytes)`);
      } catch (err) {
        stats.missingInR2++;
        console.error(`  ✗ FALTA EN R2: Evidencia #${ev.id} '${ev.storageKey}' -> ${err.message}`);
      }
    } else if (ev.storageProvider === 'legacy_base64') {
      stats.legacyBase64InDb++;
      console.log(`  ℹ Evidencia #${ev.id} (ODS #${ev.workOrderNumber}) registrada en Base64 legado (sin puntero R2)`);
    }
  }

  // --- C. LOGO CORPORATIVO Y CONFIGURACIÓN ---
  console.log('\n--- 3. AUDITORÍA DE CONFIGURACIÓN DEL SISTEMA (LOGO CORPORATIVO) ---');
  const configRes = await dbClient.query(`
    SELECT id, "storageKeyLogo", "nombreEmpresa"
    FROM "configuracion_sistema"
    ORDER BY id ASC;
  `);

  for (const cfg of configRes.rows) {
    if (cfg.storageKeyLogo) {
      stats.totalDbReferences++;
      knownKeysInDb.add(cfg.storageKeyLogo);

      try {
        const head = await s3.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: cfg.storageKeyLogo,
        }));
        stats.validInR2++;
        stats.unhashedValidFiles++;
        console.log(`  ✓ Logo corporativo existe en R2: '${cfg.storageKeyLogo}' (${head.ContentType}, ${head.ContentLength} bytes)`);
      } catch (err) {
        stats.missingInR2++;
        console.error(`  ✗ FALTA EN R2: Logo '${cfg.storageKeyLogo}' -> ${err.message}`);
      }
    }
  }

  // --- D. DETECCIÓN DE OBJETOS HUÉRFANOS EN R2 ---
  console.log('\n--- 4. DETECCIÓN DE OBJETOS HUÉRFANOS EN CLOUDFLARE R2 ---');
  try {
    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'ordenes/',
    }));

    const r2Objects = listRes.Contents || [];
    console.log(`Objetos inspeccionados en R2 bajo prefijo 'ordenes/': ${r2Objects.length}`);

    for (const obj of r2Objects) {
      if (!knownKeysInDb.has(obj.Key)) {
        stats.orphansInR2++;
        console.log(`  ℹ Objeto huérfano detectado en R2 (sin enlace en BD): ${obj.Key} (${obj.Size} bytes)`);
      }
    }
  } catch (err) {
    console.warn('  No se pudo listar objetos en R2 para huérfanos:', err.message);
  }

  // --- RESUMEN FINAL DETALLADO ---
  console.log('\n========================================================================');
  console.log('                 RESUMEN DETALLADO DE AUDITORÍA Y RECONCILIACIÓN');
  console.log('========================================================================');
  console.log(`1. Total de referencias analizadas en BD   : ${stats.totalDbReferences}`);
  console.log(`2. Referencias válidas existentes en R2    : ${stats.validInR2}`);
  console.log(`3. Hashes SHA-256 verificados (integridad) : ${stats.shaVerifiedMatch}`);
  console.log(`4. Archivos válidos sin hash en BD (fotos) : ${stats.unhashedValidFiles}`);
  console.log(`5. Discrepancias criptográficas SHA-256    : ${stats.shaMismatches}`);
  console.log(`6. Referencias rotas (faltantes en R2)     : ${stats.missingInR2}`);
  console.log(`7. Registros legacy Base64 en BD           : ${stats.legacyBase64InDb}`);
  console.log(`8. Objetos huérfanos en R2                 : ${stats.orphansInR2}`);

  if (stats.missingInR2 === 0 && stats.shaMismatches === 0) {
    console.log('\n>>> ESTADO DEL ALMACENAMIENTO: 100% SALUDABLE Y SINCRONIZADO <<<');
  } else {
    console.log('\n>>> ADVERTENCIA: Se detectaron inconsistencias que requieren atención <<<');
  }
  console.log('========================================================================\n');

  await dbClient.end();
  return stats;
}

if (require.main === module) {
  runComprehensiveReconciliation().catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
}

module.exports = { runComprehensiveReconciliation };
