import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import {
  IStorageService,
  UploadResult,
  PresignedUploadResult,
} from './interfaces/storage.interface';

@Injectable()
export class StorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private driver: 'r2' | 'local' = 'r2';
  private defaultExpiration: number = 900; // 15 minutos en segundos
  private localStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'hospital-computador-dev';
    this.defaultExpiration = Number(
      this.configService.get<number>('R2_PRESIGNED_EXPIRATION') || 900,
    );
    this.localStoragePath = path.resolve(process.cwd(), 'uploads');
  }

  onModuleInit() {
    this.initializeDriver();
  }

  private initializeDriver() {
    const configuredDriver = this.configService.get<string>('STORAGE_DRIVER') || 'r2';
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    let endpoint = this.configService.get<string>('R2_ENDPOINT');

    if (!endpoint && accountId) {
      endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    }

    if (configuredDriver === 'r2' && accessKeyId && secretAccessKey && endpoint) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId: accessKeyId.trim(),
            secretAccessKey: secretAccessKey.trim(),
          },
        });
        this.driver = 'r2';
        this.logger.log(`✓ Cloudflare R2 inicializado exitosamente en el bucket: [${this.bucketName}]`);
      } catch (error) {
        this.logger.error(`Error inicializando cliente Cloudflare R2: ${error.message}`);
        this.fallbackToLocal();
      }
    } else {
      this.logger.warn(
        'Cloudflare R2 no tiene credenciales completas configuradas en .env o se configuró driver local. Activando almacenamiento local.',
      );
      this.fallbackToLocal();
    }
  }

  private fallbackToLocal() {
    this.driver = 'local';
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
    this.logger.log(`✓ Almacenamiento local activo en: ${this.localStoragePath}`);
  }

  getDriver(): 'r2' | 'local' {
    return this.driver;
  }

  /**
   * Sanitiza metadatos para garantizar compatibilidad estricta con cabeceras HTTP S3/R2 (x-amz-meta-*).
   * - Normaliza las claves a ASCII alfanumérico en minúsculas con guiones/guiones bajos.
   * - Descarta claves que queden vacías tras la sanitización o valores nulos/indefinidos.
   * - Remueve tildes, eñes y caracteres fuera del rango ASCII imprimible (0x20-0x7E).
   * - En caso de colisión de claves normalizadas duplicadas, preserva un valor no vacío frente a uno vacío.
   */
  public sanitizeMetadata(
    metadata?: Record<string, string>,
  ): Record<string, string> | undefined {
    if (!metadata) return undefined;
    const sanitized: Record<string, string> = {};

    for (const [k, v] of Object.entries(metadata)) {
      if (v === undefined || v === null) continue;

      const safeKey = k.trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      if (!safeKey) continue;

      const safeValue = String(v)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();

      if (
        Object.prototype.hasOwnProperty.call(sanitized, safeKey) &&
        sanitized[safeKey] !== '' &&
        safeValue === ''
      ) {
        continue;
      }

      sanitized[safeKey] = safeValue;
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: sanitizedMetadata,
        });

        await this.s3Client.send(command);

        return {
          storageKey: key,
          size: buffer.length,
          mimeType,
        };
      } catch (error: any) {
        this.logger.error(`Error subiendo archivo a R2 [${key}]: ${error.message}`);
        throw error;
      }
    } else {
      // Driver local explícito
      const targetPath = path.join(this.localStoragePath, key);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, buffer);

      return {
        storageKey: key,
        size: buffer.length,
        mimeType,
      };
    }
  }

  async getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    const expiration = expiresInSeconds || this.defaultExpiration;

    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        return await getSignedUrl(this.s3Client, command, {
          expiresIn: expiration,
        });
      } catch (error: any) {
        this.logger.error(`Error generando URL firmada para [${key}]: ${error.message}`);
        throw error;
      }
    } else {
      // Driver local: retorna una data URL de lectura local
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(key).replace('.', '').toLowerCase();
        const mime =
          ext === 'png'
            ? 'image/png'
            : ext === 'mp4'
              ? 'video/mp4'
              : ext === 'pdf'
                ? 'application/pdf'
                : ext === 'webp'
                  ? 'image/webp'
                  : 'image/jpeg';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
      return '';
    }
  }

  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresInSeconds: number = 300,
  ): Promise<PresignedUploadResult> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: mimeType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: expiresInSeconds,
        });

        return {
          uploadUrl,
          storageKey: key,
          expiresIn: expiresInSeconds,
        };
      } catch (error: any) {
        this.logger.error(`Error generando URL firmada de subida [${key}]: ${error.message}`);
        throw error;
      }
    } else {
      // Simulación local de subida
      return {
        uploadUrl: `/api/v1/evidencias-tecnicas/upload-local?key=${encodeURIComponent(key)}`,
        storageKey: key,
        expiresIn: expiresInSeconds,
      };
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        await this.s3Client.send(command);
        this.logger.log(`Objeto eliminado en R2: ${key}`);
      } catch (error: any) {
        this.logger.warn(`No se pudo eliminar el objeto en R2 [${key}]: ${error.message}`);
      }
    } else {
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async checkObjectExists(key: string): Promise<boolean> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        await this.s3Client.send(command);
        return true;
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          return false;
        }
        this.logger.warn(`Error al verificar objeto [${key}]: ${error.message}`);
        return false;
      }
    } else {
      const filePath = path.join(this.localStoragePath, key);
      return fs.existsSync(filePath);
    }
  }

  async getObjectMetadata(key: string): Promise<{ size: number; mimeType?: string } | null> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        const res = await this.s3Client.send(command);
        return {
          size: res.ContentLength || 0,
          mimeType: res.ContentType,
        };
      } catch (error: any) {
        this.logger.warn(`Error al consultar metadatos de objeto [${key}]: ${error.message}`);
        return null;
      }
    } else {
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        return { size: stat.size };
      }
      return null;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        const response = await this.s3Client.send(command);
        if ((response.Body as any)?.transformToByteArray) {
          const bytes = await (response.Body as any).transformToByteArray();
          return Buffer.from(bytes);
        }
        const stream = response.Body as any;
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (error: any) {
        this.logger.error(`Error obteniendo buffer de R2 [${key}]: ${error.message}`);
        throw error;
      }
    } else {
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      throw new Error(`Archivo local no encontrado: ${key}`);
    }
  }
}
