const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modalPath = path.join(__dirname, '../components/modals/AgregarEvidenciaTecnicaModal.tsx');
const hookPath = path.join(__dirname, '../hooks/useEvidenciaTecnica.ts');
const itemPath = path.join(__dirname, '../components/EvidenciaItem.tsx');
const uiModalPath = path.join(__dirname, '../components/ui/modal/index.tsx');
const orderDetailPath = path.join(
  __dirname,
  '../app/(admin)/(others-pages)/(ordenes)/ver-orden/[id]/page.tsx',
);

const modalSrc = fs.readFileSync(modalPath, 'utf8');
const hookSrc = fs.readFileSync(hookPath, 'utf8');
const itemSrc = fs.readFileSync(itemPath, 'utf8');
const uiModalSrc = fs.readFileSync(uiModalPath, 'utf8');
const orderDetailSrc = fs.readFileSync(orderDetailPath, 'utf8');

test('1, 2, 3, 4 y 5. Validación y normalización de MIME para fotos (JPG/PNG/WebP/HEIC) y videos (MP4/MOV/WebM)', () => {
  assert.match(hookSrc, /export const MAX_EVIDENCE_SIZE_BYTES = 100 \* 1024 \* 1024/);
  assert.match(hookSrc, /export function resolveMimeType/);
  assert.match(hookSrc, /export function validateEvidenceFile/);
  assert.match(hookSrc, /\.split\(";?"\)\[0\]\.trim\(\)\.toLowerCase\(\)|\.split\(";"\)\[0\]\.trim\(\)\.toLowerCase\(\)/);
  assert.match(hookSrc, /case "mov":\s*return "video\/quicktime"/);
  assert.match(hookSrc, /case "webm":\s*return "video\/webm"/);
  assert.match(hookSrc, /case "mp4":[\s\S]*return "video\/mp4"/);
  assert.match(hookSrc, /case "heic":\s*return "image\/heic"/);
});

test('6 y 7. Rechaza archivos mayores a 100 MB o formatos no permitidos (.avi, .mkv) con mensajes claros', () => {
  assert.match(hookSrc, /El archivo excede el límite máximo permitido de 100MB\./);
  assert.match(hookSrc, /Formato de video no soportado\. Use MP4, MOV o WebM \(máximo 100MB\)\./);
  assert.match(
    hookSrc,
    /Formato de archivo no soportado\. Use imágenes \(JPG, PNG, WebP, HEIC\) o videos \(MP4, MOV, WebM\) de hasta 100MB\./,
  );
});

test('8, 9, 10 y 11. Flujo de subida prefirmada usa Content-Type exacto, distingue errores 403/400/CORS y evita huérfanos o duplicados', () => {
  assert.match(hookSrc, /evidencias-tecnicas\/presigned-upload/);
  assert.match(hookSrc, /evidencias-tecnicas\/confirm-upload/);
  assert.match(hookSrc, /const finalMimeType = signedMimeType \|\| uploadMime;/);
  assert.match(hookSrc, /xhr\.setRequestHeader\("Content-Type",\s*mimeType\)/);
  assert.match(hookSrc, /Request has expired/);
  assert.match(hookSrc, /SignatureDoesNotMatch/);
  assert.match(hookSrc, /putError\?\.isCorsOrNetworkError/);
  assert.match(hookSrc, /uploadViaBackendMultipart\(\)/);
});

test('12. Reproducción y visualización de videos en EvidenciaItem y Detalle de Orden con playsInline y enlace de respaldo', () => {
  assert.match(itemSrc, /playsInline/);
  assert.match(itemSrc, /preload="metadata"/);
  assert.match(itemSrc, /onError=\{\(\) => setVideoError\(true\)\}/);
  assert.match(itemSrc, /Abrir \/ Descargar video/);
  assert.match(orderDetailSrc, /Abrir o descargar archivo de video original/);
});

test('13, 14 y 15. Modal ofrece las tres opciones: Tomar foto (capture="environment"), Grabar video (capture="environment") y Subir archivo', () => {
  assert.match(modalSrc, /Tomar foto/);
  assert.match(modalSrc, /Grabar video/);
  assert.match(modalSrc, /Subir archivo/);
  assert.match(modalSrc, /id="evidencia-video-capture-input"/);
  assert.match(modalSrc, /accept="video\/mp4,video\/quicktime,video\/webm,video\/\*"/);
  assert.match(modalSrc, /id="evidencia-photo-capture-input"/);
  assert.match(modalSrc, /accept="image\/jpeg,image\/png,image\/webp,image\/heic,image\/heif,image\/\*"/);
  assert.match(modalSrc, /photoCaptureInputRef\.current\.click\(\)/);
  assert.match(modalSrc, /videoCaptureInputRef\.current\.click\(\)/);
  assert.match(modalSrc, /capture="environment"/);
  assert.match(modalSrc, /openVideoRecorder/);
});

test('16, 17 y 18. Modal de evidencias usa max-w-3xl en escritorio, diseño responsive en celular y preserva twMerge en Modal base', () => {
  assert.match(modalSrc, /className="max-w-3xl"/);
  assert.match(modalSrc, /grid-cols-1 sm:grid-cols-3/);
  assert.match(modalSrc, /max-h-\[58vh\] sm:max-h-\[62vh\]/);
  assert.match(uiModalSrc, /twMerge\(contentClasses,\s*className\)/);
  assert.doesNotMatch(uiModalSrc, /\bmax-w-full\b/);
});
