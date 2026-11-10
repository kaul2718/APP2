import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation((config) => ({
      config,
      send: jest.fn(),
    })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService - Integridad de Almacenamiento R2 y Prevención de Pérdidas Silenciosas', () => {
  let service: StorageService;
  let mockS3Send: jest.Mock;

  const createR2ConfigService = (overrides: Record<string, any> = {}) => {
    const config: Record<string, any> = {
      STORAGE_DRIVER: 'r2',
      R2_ACCOUNT_ID: 'acc-12345',
      R2_ACCESS_KEY_ID: 'key-12345',
      R2_SECRET_ACCESS_KEY: 'secret-12345',
      R2_BUCKET_NAME: 'hospital-computador-prod',
      R2_ENDPOINT: 'https://acc-12345.r2.cloudflarestorage.com',
      R2_PRESIGNED_EXPIRATION: 900,
      ...overrides,
    };
    return {
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = createR2ConfigService();
    service = new StorageService(configService);
    service.onModuleInit();
    mockS3Send = (service as any).s3Client.send as jest.Mock;
  });

  describe('1. Inicialización de Cloudflare R2 como fuente de verdad', () => {
    it('debe inicializar el driver R2 sin forzar forcePathStyle innecesariamente', () => {
      expect(service.getDriver()).toBe('r2');
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'auto',
          endpoint: 'https://acc-12345.r2.cloudflarestorage.com',
        }),
      );
      const clientConfig = (S3Client as unknown as jest.Mock).mock.calls[0][0];
      expect(clientConfig.forcePathStyle).toBeUndefined();
    });

    it('debe soportar el driver local únicamente cuando se configura expresamente STORAGE_DRIVER=local', () => {
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const localConfig = createR2ConfigService({ STORAGE_DRIVER: 'local' });
      const localService = new StorageService(localConfig);
      localService.onModuleInit();

      expect(localService.getDriver()).toBe('local');
      existsSpy.mockRestore();
    });
  });

  describe('2. Sanitización de metadatos S3/R2 (caracteres especiales, claves vacías y duplicadas)', () => {
    it('debe remover tildes, eñes y caracteres no ASCII de los valores de metadatos', () => {
      const sanitized = service.sanitizeMetadata({
        firmanteNombre: 'Ángel Paúl Obregón Ñáñez',
        descripcion: 'Inspección técnica — recepción #00024 ©',
      });

      expect(sanitized).toEqual({
        firmantenombre: 'Angel Paul Obregon Nanez',
        descripcion: 'Inspeccion tecnica  recepcion #00024',
      });
    });

    it('debe descartar claves vacías o compuestas únicamente por símbolos inválidos', () => {
      const sanitized = service.sanitizeMetadata({
        '   ': 'valor-invalido',
        '!!!@@@###': 'otro-invalido',
        'clave_valida!': 'Valor Limpio',
      });

      expect(sanitized).toEqual({
        clave_valida: 'Valor Limpio',
      });
    });

    it('debe manejar claves duplicadas tras normalización sin perder un valor válido por uno vacío', () => {
      const sanitized = service.sanitizeMetadata({
        'Firmante Nombre': 'Juan Perez',
        'firmante-nombre': 'Juan Perez',
        'FIRMANTE NOMBRE!': '',
        'Orden_ID': '15',
        'orden_id': '20',
      });

      expect(sanitized).toEqual({
        firmantenombre: 'Juan Perez',
        'firmante-nombre': 'Juan Perez',
        orden_id: '20',
      });
    });

    it('debe retornar undefined si metadata es undefined o todas las entradas son inválidas', () => {
      expect(service.sanitizeMetadata(undefined)).toBeUndefined();
      expect(service.sanitizeMetadata({ '???': 'valor' })).toBeUndefined();
    });
  });

  describe('3. Subida a R2 (uploadFile) - Sin copias locales ni éxitos falsos', () => {
    it('debe subir archivos (PDF, imágenes, videos) a R2 sin escribir copias automáticas en disco local', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

      const pdfBuffer = Buffer.from('%PDF-1.7 contenido firmado');
      const result = await service.uploadFile(
        'ordenes/ODS-00024/documentos/acta_recepcion.pdf',
        pdfBuffer,
        'application/pdf',
        { firmanteNombre: 'María José' },
      );

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      const sentCommand = mockS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(sentCommand.input).toEqual({
        Bucket: 'hospital-computador-prod',
        Key: 'ordenes/ODS-00024/documentos/acta_recepcion.pdf',
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        Metadata: { firmantenombre: 'Maria Jose' },
      });
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        storageKey: 'ordenes/ODS-00024/documentos/acta_recepcion.pdf',
        size: pdfBuffer.length,
        mimeType: 'application/pdf',
      });

      writeFileSyncSpy.mockRestore();
    });

    it('debe propagar el error y NUNCA devolver éxito falso ni guardar en local si falla la subida a R2', async () => {
      const r2Error = new Error('R2 Connection Timeout / InvalidSignatureException');
      mockS3Send.mockRejectedValueOnce(r2Error);
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

      const buffer = Buffer.from('evidencia-imagen-webp');

      await expect(
        service.uploadFile(
          'ordenes/ODS-00024/evidencias/imagenes/foto1.webp',
          buffer,
          'image/webp',
        ),
      ).rejects.toThrow('R2 Connection Timeout / InvalidSignatureException');

      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      writeFileSyncSpy.mockRestore();
    });
  });

  describe('4. Lectura y verificación desde R2 (getFileBuffer & checkObjectExists)', () => {
    it('debe leer buffers directamente desde R2 sin priorizar ni consultar el disco local', async () => {
      const expectedBytes = new Uint8Array(Buffer.from('PDF_DESDE_R2'));
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToByteArray: jest.fn().mockResolvedValue(expectedBytes),
        },
      });
      const existsSyncSpy = jest.spyOn(fs, 'existsSync');
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');

      const buffer = await service.getFileBuffer('ordenes/ODS-00024/documentos/acta.pdf');

      expect(buffer.toString()).toBe('PDF_DESDE_R2');
      expect(mockS3Send).toHaveBeenCalledTimes(1);
      expect(mockS3Send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
      expect(existsSyncSpy).not.toHaveBeenCalled();
      expect(readFileSyncSpy).not.toHaveBeenCalled();

      existsSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
    });

    it('debe lanzar error controlado cuando falla la lectura en R2 aunque exista un archivo local homónimo', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('NoSuchKey: The specified key does not exist'));
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('LOCAL_STALE'));

      await expect(
        service.getFileBuffer('ordenes/ODS-00024/documentos/acta_inexistente.pdf'),
      ).rejects.toThrow('NoSuchKey: The specified key does not exist');

      expect(readFileSyncSpy).not.toHaveBeenCalled();

      existsSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
    });

    it('checkObjectExists debe consultar exclusivamente R2 cuando el driver es R2', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const existsSyncSpy = jest.spyOn(fs, 'existsSync');

      const exists = await service.checkObjectExists('ordenes/ODS-00024/evidencias/videos/clip.mp4');

      expect(exists).toBe(true);
      expect(mockS3Send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
      expect(existsSyncSpy).not.toHaveBeenCalled();

      existsSyncSpy.mockRestore();
    });
  });

  describe('5. Generación de URLs firmadas (getPresignedUrl & getPresignedUploadUrl)', () => {
    it('debe generar URL firmada de lectura desde R2 exitosamente', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://signed.r2.cloudflarestorage.com/acta.pdf');

      const url = await service.getPresignedUrl('ordenes/ODS-00024/documentos/acta.pdf', 900);

      expect(url).toBe('https://signed.r2.cloudflarestorage.com/acta.pdf');
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error y NUNCA devolver string vacío ni data URL local si falla getPresignedUrl en modo R2', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Error de credenciales al firmar URL'));
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      await expect(
        service.getPresignedUrl('ordenes/ODS-00024/documentos/acta.pdf'),
      ).rejects.toThrow('Error de credenciales al firmar URL');

      expect(existsSyncSpy).not.toHaveBeenCalled();
      existsSyncSpy.mockRestore();
    });

    it('debe lanzar error si falla getPresignedUploadUrl en modo R2', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Fallo al firmar PutObjectCommand'));

      await expect(
        service.getPresignedUploadUrl('ordenes/ODS-00024/evidencias/videos/test.mp4', 'video/mp4'),
      ).rejects.toThrow('Fallo al firmar PutObjectCommand');
    });
  });
});
