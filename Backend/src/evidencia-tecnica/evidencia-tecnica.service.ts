import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenciaTecnica } from './entities/evidencia-tecnica.entity';
import {
  CreateEvidenciaTecnicaDto,
  RequestPresignedUploadDto,
  ConfirmUploadDto,
} from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { ImageOptimizerService } from '../storage/image-optimizer.service';
import { AuditService } from '../audit/audit.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class EvidenciaTecnicaService {
  private readonly logger = new Logger(EvidenciaTecnicaService.name);
  public static readonly MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

  constructor(
    @InjectRepository(EvidenciaTecnica)
    private readonly evidenciaRepository: Repository<EvidenciaTecnica>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly imageOptimizerService: ImageOptimizerService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  /**
   * Normaliza y valida estrictamente el formato (imagen o video MP4/MOV/WebM) y el tamaño máximo (100 MB).
   */
  public normalizeAndValidateMedia(
    fileName: string,
    rawMime?: string,
    fileSize?: number,
  ): {
    isVideo: boolean;
    mimeType: string;
    ext: string;
    tipoArchivo: 'imagen' | 'video';
  } {
    if (fileSize !== undefined && fileSize !== null) {
      if (Number(fileSize) <= 0) {
        throw new BadRequestException(
          'El archivo está vacío o es inválido (0 bytes).',
        );
      }
      if (Number(fileSize) > EvidenciaTecnicaService.MAX_EVIDENCE_SIZE_BYTES) {
        throw new BadRequestException(
          'El archivo excede el límite máximo permitido de 100MB.',
        );
      }
    }

    const rawExt = path.extname(fileName || '').toLowerCase();
    const baseMime = (rawMime || '').split(';')[0].trim().toLowerCase();

    const videoExtMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
    };
    const allowedVideoMimes: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/x-m4v': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    };

    const imageExtMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
    };
    const allowedImageMimes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/heic': '.heic',
      'image/heif': '.heif',
    };

    // Si tiene extensión de video soportada o MIME de video soportado
    if (videoExtMap[rawExt] || allowedVideoMimes[baseMime]) {
      // Si la extensión es explícitamente otro contenedor de video no soportado (ej. .avi, .mkv, .wmv)
      if (
        rawExt &&
        !videoExtMap[rawExt] &&
        ['.avi', '.mkv', '.wmv', '.flv', '.3gp', '.mpeg', '.mpg'].includes(rawExt)
      ) {
        throw new BadRequestException(
          'Formato de video no soportado. Use videos en formato MP4, MOV o WebM (máximo 100MB).',
        );
      }

      const resolvedMime = videoExtMap[rawExt] || ( allowedVideoMimes[baseMime] ? (baseMime === 'video/x-m4v' ? 'video/mp4' : baseMime) : 'video/mp4' );
      const resolvedExt = videoExtMap[rawExt]
        ? (rawExt === '.m4v' ? '.mp4' : rawExt)
        : allowedVideoMimes[baseMime] || '.mp4';

      return {
        isVideo: true,
        mimeType: resolvedMime,
        ext: resolvedExt,
        tipoArchivo: 'video',
      };
    }

    // Si tiene extensión de imagen soportada o MIME de imagen soportado
    if (imageExtMap[rawExt] || allowedImageMimes[baseMime]) {
      if (
        rawExt &&
        !imageExtMap[rawExt] &&
        !['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'].includes(rawExt)
      ) {
        throw new BadRequestException(
          'Formato de imagen no soportado. Use imágenes JPG, PNG, WebP o HEIC (máximo 100MB).',
        );
      }
      const resolvedMime =
        imageExtMap[rawExt] ||
        (baseMime === 'image/jpg' ? 'image/jpeg' : baseMime) ||
        'image/jpeg';
      const resolvedExt =
        (imageExtMap[rawExt] ? rawExt : allowedImageMimes[baseMime]) || '.jpg';

      return {
        isVideo: false,
        mimeType: resolvedMime,
        ext: resolvedExt,
        tipoArchivo: 'imagen',
      };
    }

    throw new BadRequestException(
      'Formato de archivo no soportado. Use imágenes (JPG, PNG, WebP, HEIC) o videos compatibles (MP4, MOV, WebM) de hasta 100MB.',
    );
  }

  /**
   * Verifica si el usuario actual tiene el rol de cliente
   */
  private isClient(user: any): boolean {
    if (!user) return false;
    const roles: string[] = (user.userRoles || [])
      .map((ur: any) => ur.rol?.slug || ur.role?.slug)
      .filter(Boolean);
    if (user.role) roles.push(user.role);
    return roles.includes('client') && !roles.includes('admin');
  }

  /**
   * Resuelve la URL prefirmada temporal para visualización en el frontend
   */
  async resolveSignedUrl(evidencia: EvidenciaTecnica): Promise<EvidenciaTecnica> {
    if (evidencia.storageKey) {
      try {
        evidencia.archivoUrl = await this.storageService.getPresignedUrl(evidencia.storageKey);
      } catch (error) {
        this.logger.warn(`No se pudo generar URL firmada para la clave [${evidencia.storageKey}]: ${error.message}`);
      }
    }
    return evidencia;
  }

  /**
   * Elimina un objeto de R2 únicamente si ningún otro registro activo en BD lo referencia.
   * Si el borrado en R2 falla, registra un evento R2_CLEANUP_PENDING para su resolución.
   */
  public async safeDeleteR2IfUnreferenced(
    storageKey: string | undefined | null,
    excludeEvidenciaId?: number,
    phase: 'compensation' | 'post_commit' = 'post_commit',
  ): Promise<boolean> {
    if (!storageKey) return false;

    try {
      const existingRefs = await this.evidenciaRepository.find({
        where: { storageKey, deletedAt: null },
        select: ['id'],
      } as any);
      const otherActiveRefs = (existingRefs || []).filter(
        (ev: any) => ev && ev.id !== excludeEvidenciaId,
      );
      if (otherActiveRefs.length > 0) {
        this.logger.warn(
          `Se omite eliminación en R2 para [${storageKey}] porque sigue referenciado por otro registro activo.`,
        );
        return false;
      }
    } catch {
      // Si falla la consulta de verificación en un flujo de compensación tras caída de BD, no impedir la limpieza de clave recién generada
      if (phase !== 'compensation') {
        return false;
      }
    }

    try {
      await this.storageService.deleteFile(storageKey);
      return true;
    } catch (err: any) {
      this.logger.error(
        `[R2_CLEANUP_PENDING] No se pudo eliminar el objeto [${storageKey}] (${phase}): ${err?.message || err}`,
      );
      await this.auditService?.logBestEffort({
        action: 'R2_CLEANUP_PENDING',
        module: 'evidencias',
        entityType: 'EvidenciaTecnica',
        entityId: excludeEvidenciaId,
        description: `Limpieza pendiente en Cloudflare R2 (${phase}) para clave ${storageKey}`,
        newValues: { storageKey, phase, error: err?.message || 'Error desconocido' },
        status: 'FAILURE',
      });
      return false;
    }
  }

  /**
   * Subida estándar de fotos / evidencias vía NestJS hacia Cloudflare R2
   */
  async create(
    createDto: CreateEvidenciaTecnicaDto,
    archivo?: Express.Multer.File,
  ): Promise<EvidenciaTecnica> {
    const { ordenId, subidoPorId, descripcion } = createDto;

    const orden = await this.orderRepository.findOne({
      where: { id: ordenId },
      relations: ['estadoOrden'],
    });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${ordenId} no encontrada`);
    }

    const usuario = await this.userRepository.findOne({ where: { id: subidoPorId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${subidoPorId} no encontrado`);
    }

    let storageKey: string | undefined = createDto.storageKey;
    let mimeType: string = createDto.mimeType || 'application/octet-stream';
    let tamanoBytes: number = createDto.tamanoBytes || 0;
    let nombreOriginal: string = createDto.nombreOriginal || 'evidencia';
    let tipoArchivo: 'imagen' | 'video' = createDto.tipoArchivo || 'imagen';

    if (archivo) {
      nombreOriginal = archivo.originalname;
      const mediaInfo = this.normalizeAndValidateMedia(
        archivo.originalname,
        archivo.mimetype,
        archivo.size,
      );
      const isVideo = mediaInfo.isVideo;
      tipoArchivo = mediaInfo.tipoArchivo;

      let bufferToUpload = archivo.buffer;

      if (!isVideo) {
        // Optimización inteligente en backend (conversión a WebP, corrección de orientación, eliminación GPS, redimensionamiento adaptativo)
        const optimized = await this.imageOptimizerService.optimize(
          archivo.buffer,
          archivo.originalname,
          mediaInfo.mimeType,
          { highDetailMode: createDto.highDetailMode },
        );
        bufferToUpload = optimized.buffer;
        mimeType = optimized.mimeType;
        tamanoBytes = optimized.size;
        const ext = optimized.extension;
        const folder = 'imagenes';
        const odsFolder = orden.workOrderNumber ? `ODS-${orden.workOrderNumber}` : `${ordenId}`;
        storageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${ext}`;
      } else {
        mimeType = mediaInfo.mimeType;
        tamanoBytes = archivo.size;
        const ext = mediaInfo.ext;
        const folder = 'videos';
        const odsFolder = orden.workOrderNumber ? `ODS-${orden.workOrderNumber}` : `${ordenId}`;
        storageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${ext}`;
      }

      // Subida a Cloudflare R2
      await this.storageService.uploadFile(storageKey, bufferToUpload, mimeType, {
        ordenId: String(ordenId),
        workOrderNumber: String(orden.workOrderNumber),
        subidoPorId: String(subidoPorId),
      });
    }

    if (!storageKey && !createDto.archivoUrl) {
      throw new BadRequestException('Debe proporcionar un archivo físico o una clave de almacenamiento.');
    }

    const evidencia = this.evidenciaRepository.create({
      orden,
      subidoPor: usuario,
      estadoOrden: orden.estadoOrden,
      storageKey,
      nombreOriginal,
      mimeType,
      tamanoBytes,
      storageProvider: storageKey ? 'r2' : 'legacy_base64',
      tipoArchivo,
      descripcion,
      archivoUrl: null, // No guardamos Base64 en la base de datos
    });

    try {
      const saved = await this.evidenciaRepository.manager.transaction(async (manager) => {
        const s = await manager.save(EvidenciaTecnica, evidencia);
        await this.auditService?.logCritical(
          {
            action: 'EVIDENCE_CREATED',
            module: 'evidencias',
            entityType: 'EvidenciaTecnica',
            entityId: s.id,
            actorUserId: subidoPorId,
            description: `Evidencia (${s.tipoArchivo}) registrada en orden #${orden.workOrderNumber || ordenId}`,
            newValues: {
              ordenId,
              workOrderNumber: orden.workOrderNumber,
              tipoArchivo: s.tipoArchivo,
              mimeType: s.mimeType,
              tamanoBytes: s.tamanoBytes,
            },
            status: 'SUCCESS',
          },
          manager,
        );
        return s;
      });
      return await this.resolveSignedUrl(saved);
    } catch (error) {
      // Si falla la BD y se había subido a R2, se limpia el objeto huérfano si no está referenciado
      if (storageKey) {
        await this.safeDeleteR2IfUnreferenced(storageKey, undefined, 'compensation');
      }
      throw new InternalServerErrorException(
        `Error creando evidencia técnica: ${error.message}`,
      );
    }
  }

  /**
   * Genera una URL prefirmada para subida directa de videos o archivos grandes a R2
   */
  async getPresignedUploadUrl(
    dto: RequestPresignedUploadDto,
    currentUser: any,
  ): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number; mimeType: string }> {
    const orden = await this.orderRepository.findOne({ where: { id: dto.ordenId } });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${dto.ordenId} no encontrada`);
    }

    if (this.isClient(currentUser)) {
      throw new ForbiddenException('Los clientes no pueden subir evidencias técnicas.');
    }

    const mediaInfo = this.normalizeAndValidateMedia(
      dto.fileName,
      dto.mimeType,
      dto.fileSize,
    );

    const folder = mediaInfo.isVideo ? 'videos' : 'imagenes';
    const odsFolder = orden.workOrderNumber ? `ODS-${orden.workOrderNumber}` : `${dto.ordenId}`;
    const storageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${mediaInfo.ext}`;

    const presigned = await this.storageService.getPresignedUploadUrl(
      storageKey,
      mediaInfo.mimeType,
      900, // 15 minutos de validez para permitir subidas móviles de videos de hasta 100MB
    );

    return {
      ...presigned,
      mimeType: mediaInfo.mimeType,
    };
  }

  /**
   * Confirma la subida directa realizada por el frontend y registra los metadatos en PostgreSQL
   */
  async confirmUpload(
    dto: ConfirmUploadDto,
    currentUser: any,
  ): Promise<EvidenciaTecnica> {
    const orden = await this.orderRepository.findOne({
      where: { id: dto.ordenId },
      relations: ['estadoOrden'],
    });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${dto.ordenId} no encontrada`);
    }

    const usuario = await this.userRepository.findOne({ where: { id: currentUser.id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${currentUser.id} no encontrado`);
    }

    // Idempotencia: evitar registros duplicados si se reintenta la confirmación para la misma clave
    const existing = await this.evidenciaRepository.findOne({
      where: { storageKey: dto.storageKey, deletedAt: null },
      relations: ['orden', 'subidoPor', 'estadoOrden'],
    });
    if (existing) {
      return await this.resolveSignedUrl(existing);
    }

    const mediaInfo = this.normalizeAndValidateMedia(
      dto.nombreOriginal || dto.storageKey,
      dto.mimeType,
      dto.tamanoBytes,
    );

    // Verificar que el objeto exista en Cloudflare R2 y obtener sus metadatos reales
    const realMeta = await this.storageService.getObjectMetadata(dto.storageKey);
    if (!realMeta) {
      throw new BadRequestException('El archivo no fue encontrado en el almacenamiento de Cloudflare R2.');
    }

    if (realMeta.size > EvidenciaTecnicaService.MAX_EVIDENCE_SIZE_BYTES) {
      await this.storageService.deleteFile(dto.storageKey).catch(() => null);
      throw new BadRequestException(
        'El archivo subido excede el límite máximo permitido de 100MB.',
      );
    }

    const isVideo =
      mediaInfo.isVideo ||
      dto.storageKey.includes('/videos/');
    const tipoArchivo: 'imagen' | 'video' = isVideo ? 'video' : 'imagen';
    const normalizedRealMime = realMeta.mimeType
      ? realMeta.mimeType.split(';')[0].trim().toLowerCase()
      : undefined;

    const evidencia = this.evidenciaRepository.create({
      orden,
      subidoPor: usuario,
      estadoOrden: orden.estadoOrden,
      storageKey: dto.storageKey,
      nombreOriginal: dto.nombreOriginal || path.basename(dto.storageKey),
      mimeType:
        (normalizedRealMime && normalizedRealMime !== 'application/octet-stream'
          ? normalizedRealMime
          : undefined) ||
        mediaInfo.mimeType ||
        (isVideo ? 'video/mp4' : 'image/webp'),
      tamanoBytes: realMeta.size || dto.tamanoBytes || 0,
      storageProvider: 'r2',
      tipoArchivo,
      descripcion: dto.descripcion,
      archivoUrl: null,
    });

    try {
      const saved = await this.evidenciaRepository.manager.transaction(async (manager) => {
        const s = await manager.save(EvidenciaTecnica, evidencia);
        await this.auditService?.logCritical(
          {
            action: 'EVIDENCE_CREATED',
            module: 'evidencias',
            entityType: 'EvidenciaTecnica',
            entityId: s.id,
            actorUserId: currentUser.id,
            description: `Evidencia directa (${s.tipoArchivo}) confirmada en orden #${orden.workOrderNumber || dto.ordenId}`,
            newValues: {
              ordenId: dto.ordenId,
              workOrderNumber: orden.workOrderNumber,
              tipoArchivo: s.tipoArchivo,
              mimeType: s.mimeType,
              tamanoBytes: s.tamanoBytes,
            },
            status: 'SUCCESS',
          },
          manager,
        );
        return s;
      });
      return await this.resolveSignedUrl(saved);
    } catch (error) {
      await this.storageService.deleteFile(dto.storageKey).catch(() => null);
      throw new InternalServerErrorException(
        `Error confirmando evidencia técnica en base de datos: ${error.message}`,
      );
    }
  }

  /**
   * Consulta paginada con protección de acceso y resolución de URLs firmadas
   */
  async findAll(
    currentUser: any,
    ordenId?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: EvidenciaTecnica[]; total: number }> {
    // Control de seguridad: Aislamiento de clientes
    if (this.isClient(currentUser)) {
      if (!ordenId) {
        throw new BadRequestException('Debe especificar un ordenId válido.');
      }
      const orden = await this.orderRepository.findOne({ where: { id: ordenId } });
      if (!orden || orden.clientId !== currentUser.id) {
        throw new ForbiddenException('No tiene permisos para consultar las evidencias de esta orden.');
      }
    }

    const skip = (page - 1) * limit;

    const query = this.evidenciaRepository
      .createQueryBuilder('evidencia')
      .leftJoinAndSelect('evidencia.orden', 'orden')
      .leftJoinAndSelect('evidencia.subidoPor', 'usuario')
      .leftJoinAndSelect('evidencia.estadoOrden', 'estadoOrden')
      .where('evidencia.deletedAt IS NULL')
      .orderBy('evidencia.fechaSubida', 'DESC')
      .skip(skip)
      .take(limit);

    if (ordenId) {
      query.andWhere('evidencia.ordenId = :ordenId', { ordenId });
    }

    const [items, total] = await query.getManyAndCount();

    // Resolver URLs firmadas para todas las evidencias obtenidas
    await Promise.all(items.map((ev) => this.resolveSignedUrl(ev)));

    return { items, total };
  }

  /**
   * Consulta individual con validación de permisos
   */
  async findOne(id: number, currentUser?: any): Promise<EvidenciaTecnica> {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['orden', 'subidoPor', 'estadoOrden'],
    });

    if (!evidencia) {
      throw new NotFoundException(`Evidencia técnica con ID ${id} no encontrada.`);
    }

    if (currentUser && this.isClient(currentUser)) {
      if (evidencia.orden && evidencia.orden.clientId !== currentUser.id) {
        throw new ForbiddenException('No tiene permisos para consultar esta evidencia.');
      }
    }

    return await this.resolveSignedUrl(evidencia);
  }

  /**
   * Actualización de metadatos o reemplazo de archivo
   */
  async update(
    id: number,
    updateDto: UpdateEvidenciaTecnicaDto,
    archivo?: Express.Multer.File,
  ): Promise<EvidenciaTecnica> {
    const evidencia = await this.findOne(id);

    let oldStorageKeyToDelete: string | undefined;
    let uploadedNewStorageKey: string | undefined;

    if (archivo) {
      oldStorageKeyToDelete = evidencia.storageKey;
      const mediaInfo = this.normalizeAndValidateMedia(
        archivo.originalname,
        archivo.mimetype,
        archivo.size,
      );
      const tipoArchivo = mediaInfo.tipoArchivo;
      const ext = mediaInfo.ext;
      const folder = mediaInfo.isVideo ? 'videos' : 'imagenes';
      const odsFolder = evidencia.orden.workOrderNumber
        ? `ODS-${evidencia.orden.workOrderNumber}`
        : `${evidencia.orden.id}`;
      const newStorageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${ext}`;

      await this.storageService.uploadFile(newStorageKey, archivo.buffer, mediaInfo.mimeType);
      uploadedNewStorageKey = newStorageKey;

      evidencia.storageKey = newStorageKey;
      evidencia.nombreOriginal = archivo.originalname;
      evidencia.mimeType = mediaInfo.mimeType;
      evidencia.tamanoBytes = archivo.size;
      evidencia.tipoArchivo = tipoArchivo;
      evidencia.storageProvider = 'r2';
    }

    if (updateDto.descripcion !== undefined) {
      evidencia.descripcion = updateDto.descripcion;
    }

    try {
      const saved = await this.evidenciaRepository.manager.transaction(async (manager) => {
        const s = await manager.save(EvidenciaTecnica, evidencia);
        await this.auditService?.logCritical(
          {
            action: 'EVIDENCE_UPDATED',
            module: 'evidencias',
            entityType: 'EvidenciaTecnica',
            entityId: s.id,
            description: `Evidencia #${s.id} (${s.tipoArchivo}) actualizada en orden #${evidencia.orden?.workOrderNumber || evidencia.orden?.id}`,
            newValues: {
              ordenId: evidencia.orden?.id,
              workOrderNumber: evidencia.orden?.workOrderNumber,
              tipoArchivo: s.tipoArchivo,
              mimeType: s.mimeType,
              tamanoBytes: s.tamanoBytes,
            },
            status: 'SUCCESS',
          },
          manager,
        );
        return s;
      });

      // Solo después de confirmar en PostgreSQL eliminamos el objeto anterior en R2 si nadie más lo referencia
      if (oldStorageKeyToDelete) {
        await this.safeDeleteR2IfUnreferenced(oldStorageKeyToDelete, saved.id, 'post_commit');
      }

      return await this.resolveSignedUrl(saved);
    } catch (error) {
      // Compensación: si falla la BD/auditoría, limpiar el archivo recién subido para evitar huérfanos
      if (uploadedNewStorageKey) {
        await this.safeDeleteR2IfUnreferenced(uploadedNewStorageKey, evidencia.id, 'compensation');
      }
      throw new InternalServerErrorException(
        `Error actualizando evidencia técnica: ${error.message}`,
      );
    }
  }

  /**
   * Eliminación segura con soft-delete y limpieza de almacenamiento en Cloudflare R2
   */
  async remove(id: number): Promise<void> {
    const evidencia = await this.findOne(id);
    const storageKeyToDelete = evidencia.storageKey;

    await this.evidenciaRepository.manager.transaction(async (manager) => {
      evidencia.deletedAt = new Date();
      await manager.save(EvidenciaTecnica, evidencia);

      await this.auditService?.logCritical(
        {
          action: 'EVIDENCE_DELETED',
          module: 'evidencias',
          entityType: 'EvidenciaTecnica',
          entityId: evidencia.id,
          description: `Evidencia #${evidencia.id} (${evidencia.tipoArchivo}) eliminada de orden #${evidencia.orden?.workOrderNumber || evidencia.orden?.id}`,
          oldValues: {
            ordenId: evidencia.orden?.id,
            tipoArchivo: evidencia.tipoArchivo,
            mimeType: evidencia.mimeType,
          },
          status: 'SUCCESS',
        },
        manager,
      );
    });

    // Solo después de confirmar soft-delete + auditoría en PostgreSQL, eliminar objeto físico en R2 si no está referenciado
    if (storageKeyToDelete) {
      await this.safeDeleteR2IfUnreferenced(storageKeyToDelete, evidencia.id, 'post_commit');
    }
  }
}