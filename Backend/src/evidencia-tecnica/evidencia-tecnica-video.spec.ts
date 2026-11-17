import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvidenciaTecnicaService } from './evidencia-tecnica.service';
import { StorageService } from '../storage/storage.service';

describe('EvidenciaTecnica — Videos, Cloudflare R2 SigV4 y Validaciones (Fase 7)', () => {
  let storageService: StorageService;
  let evidenciaService: EvidenciaTecnicaService;
  let mockEvidenciaRepo: any;
  let mockOrderRepo: any;
  let mockUserRepo: any;
  let mockImageOptimizer: any;

  beforeEach(() => {
    const configMap: Record<string, any> = {
      STORAGE_DRIVER: 'r2',
      R2_BUCKET_NAME: 'hospital-computador-prod',
      R2_ACCOUNT_ID: '1234567890abcdef1234567890abcdef',
      R2_ACCESS_KEY_ID: 'test-access-key-id-0000',
      R2_SECRET_ACCESS_KEY: 'test-secret-access-key-000000000000',
      R2_ENDPOINT: 'https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com',
      R2_PRESIGNED_EXPIRATION: 900,
    };

    const configService = {
      get: jest.fn((key: string) => configMap[key]),
    } as unknown as ConfigService;

    storageService = new StorageService(configService);
    storageService.onModuleInit();

    mockEvidenciaRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((dto) => ({ id: 77, ...dto })),
      save: jest.fn(async (entity) => ({ id: 77, ...entity })),
      manager: {
        transaction: jest.fn(async (cb: any) =>
          cb({
            save: jest.fn(async (_entityCls: any, entity: any) =>
              mockEvidenciaRepo.save(entity),
            ),
          }),
        ),
      },
    };

    mockOrderRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 15,
        workOrderNumber: 12794,
        estadoOrden: { id: 3, nombre: 'En Servicio' },
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 4,
        nombre: 'Carlos',
        apellido: 'Técnico',
      }),
    };

    mockImageOptimizer = {
      optimize: jest.fn().mockResolvedValue({
        buffer: Buffer.from('webp-optimized'),
        mimeType: 'image/webp',
        size: 1400,
        extension: '.webp',
      }),
    };

    evidenciaService = new EvidenciaTecnicaService(
      mockEvidenciaRepo,
      mockOrderRepo,
      mockUserRepo,
      storageService,
      mockImageOptimizer,
    );
  });

  // 1 & 2. Subida de foto existente e imagen HEIC/HEIF siguen funcionando
  it('1 y 2. Permite imágenes estándar (JPG, PNG, WebP) y fotos HEIC/HEIF de iPhone', () => {
    const jpg = evidenciaService.normalizeAndValidateMedia('placa.jpg', 'image/jpeg', 2 * 1024 * 1024);
    expect(jpg).toEqual({
      isVideo: false,
      mimeType: 'image/jpeg',
      ext: '.jpg',
      tipoArchivo: 'imagen',
    });

    const heic = evidenciaService.normalizeAndValidateMedia('IMG_4021.HEIC', '', 4 * 1024 * 1024);
    expect(heic).toEqual({
      isVideo: false,
      mimeType: 'image/heic',
      ext: '.heic',
      tipoArchivo: 'imagen',
    });
  });

  // 3, 4 & 5. Subida de videos MP4, MOV y WebM funciona y normaliza MIME con codecs
  it('3, 4 y 5. Valida y normaliza correctamente videos MP4, MOV (iPhone) y WebM (con o sin sufijo ;codecs=...)', () => {
    const mp4 = evidenciaService.normalizeAndValidateMedia(
      'falla-pantalla.mp4',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      25 * 1024 * 1024,
    );
    expect(mp4).toEqual({
      isVideo: true,
      mimeType: 'video/mp4',
      ext: '.mp4',
      tipoArchivo: 'video',
    });

    const mov = evidenciaService.normalizeAndValidateMedia(
      'IMG_9912.MOV',
      '', // Móviles iOS/Android a veces envían file.type vacío para .mov
      45 * 1024 * 1024,
    );
    expect(mov).toEqual({
      isVideo: true,
      mimeType: 'video/quicktime',
      ext: '.mov',
      tipoArchivo: 'video',
    });

    const webm = evidenciaService.normalizeAndValidateMedia(
      'captura-camara.webm',
      'video/webm;codecs=vp8,opus',
      18 * 1024 * 1024,
    );
    expect(webm).toEqual({
      isVideo: true,
      mimeType: 'video/webm',
      ext: '.webm',
      tipoArchivo: 'video',
    });
  });

  // 6. Archivo mayor a 100 MB es rechazado con mensaje claro
  it('6. Rechaza archivos mayores a 100 MB con BadRequestException clara', async () => {
    const overLimit = 100 * 1024 * 1024 + 1;
    expect(() =>
      evidenciaService.normalizeAndValidateMedia('video-pesado.mp4', 'video/mp4', overLimit),
    ).toThrow(BadRequestException);

    await expect(
      evidenciaService.getPresignedUploadUrl(
        {
          ordenId: 15,
          fileName: 'video-pesado.mp4',
          mimeType: 'video/mp4',
          fileSize: overLimit,
        },
        { id: 4, role: 'tech' },
      ),
    ).rejects.toThrow(/100MB/);
  });

  // 7. Formato no permitido es rechazado con mensaje claro
  it('7. Rechaza formatos no soportados (.avi, .mkv, .exe, .pdf) con mensaje claro', () => {
    expect(() =>
      evidenciaService.normalizeAndValidateMedia('video.avi', 'video/x-msvideo', 5 * 1024 * 1024),
    ).toThrow(BadRequestException);

    expect(() =>
      evidenciaService.normalizeAndValidateMedia('pelicula.mkv', 'video/x-matroska', 5 * 1024 * 1024),
    ).toThrow(BadRequestException);

    expect(() =>
      evidenciaService.normalizeAndValidateMedia('script.exe', 'application/octet-stream', 1024),
    ).toThrow(BadRequestException);
  });

  // 8 & 9. Solicitud de URL prefirmada genera URL válida (path-style, sin CRC32 vacío, con Content-Type exacto)
  it('8 y 9. Genera URL prefirmada R2 path-style (TLS válido de 1 nivel) y sin x-amz-checksum-crc32=AAAAAA==', async () => {
    const res = await evidenciaService.getPresignedUploadUrl(
      {
        ordenId: 15,
        fileName: 'grabacion-movil.mp4',
        mimeType: 'video/mp4;codecs=avc1',
        fileSize: 32 * 1024 * 1024,
      },
      { id: 4, role: 'tech' },
    );

    expect(res.mimeType).toBe('video/mp4');
    expect(res.expiresIn).toBe(900);
    expect(res.storageKey).toMatch(/^ordenes\/ODS-12794\/evidencias\/videos\/.*\.mp4$/);

    const parsedUrl = new URL(res.uploadUrl);
    // Debe usar path-style: https://<account_id>.r2.cloudflarestorage.com/hospital-computador-prod/...
    // para coincidir con el certificado TLS comodín *.r2.cloudflarestorage.com
    expect(parsedUrl.hostname).toBe('1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com');
    expect(parsedUrl.pathname).toContain('/hospital-computador-prod/ordenes/ODS-12794/evidencias/videos/');
    // No debe inyectar checksum de body vacío (AAAAAA==) que causa rechazo en R2 al subir el binario real
    expect(parsedUrl.searchParams.get('x-amz-checksum-crc32')).toBeNull();
    expect(parsedUrl.searchParams.get('x-amz-sdk-checksum-algorithm')).toBeNull();
    expect(parsedUrl.searchParams.get('X-Amz-Expires')).toBe('900');
  });

  // 10 & 11. Confirmación registra metadatos en PostgreSQL, es idempotente y limpia huérfanos si falla BD
  it('10 y 11. ConfirmUpload registra metadatos reales, evita duplicados por reintento y limpia R2 si falla PostgreSQL', async () => {
    jest.spyOn(storageService, 'getObjectMetadata').mockResolvedValue({
      size: 28 * 1024 * 1024,
      mimeType: 'video/quicktime',
    });
    jest.spyOn(storageService, 'getPresignedUrl').mockResolvedValue(
      'https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com/hospital-computador-prod/signed-get',
    );

    const confirmed = await evidenciaService.confirmUpload(
      {
        ordenId: 15,
        storageKey: 'ordenes/ODS-12794/evidencias/videos/uuid_123.mov',
        nombreOriginal: 'IMG_5012.MOV',
        mimeType: 'video/quicktime',
        tamanoBytes: 28 * 1024 * 1024,
        descripcion: 'Ruido en ventilador grabado desde iPhone',
      },
      { id: 4, role: 'tech' },
    );

    expect(confirmed.tipoArchivo).toBe('video');
    expect(confirmed.mimeType).toBe('video/quicktime');
    expect(confirmed.tamanoBytes).toBe(28 * 1024 * 1024);
    expect(confirmed.storageProvider).toBe('r2');
    expect(confirmed.archivoUrl).toContain('signed-get');

    // Si falla PostgreSQL al guardar, debe eliminar el objeto huérfano en R2
    const deleteSpy = jest.spyOn(storageService, 'deleteFile').mockResolvedValue();
    mockEvidenciaRepo.save.mockRejectedValueOnce(new Error('DB connection error'));

    await expect(
      evidenciaService.confirmUpload(
        {
          ordenId: 15,
          storageKey: 'ordenes/ODS-12794/evidencias/videos/orphan_video.mp4',
          nombreOriginal: 'orphan.mp4',
          mimeType: 'video/mp4',
          tamanoBytes: 15 * 1024 * 1024,
        },
        { id: 4, role: 'tech' },
      ),
    ).rejects.toThrow(/Error confirmando evidencia técnica/);

    expect(deleteSpy).toHaveBeenCalledWith('ordenes/ODS-12794/evidencias/videos/orphan_video.mp4');
  });

  it('Impide que usuarios con rol cliente soliciten URLs prefirmadas de subida', async () => {
    await expect(
      evidenciaService.getPresignedUploadUrl(
        {
          ordenId: 15,
          fileName: 'video.mp4',
          mimeType: 'video/mp4',
          fileSize: 1024 * 1024,
        },
        { id: 99, role: 'client' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

