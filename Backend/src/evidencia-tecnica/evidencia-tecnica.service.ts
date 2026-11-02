import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Logger,
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
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class EvidenciaTecnicaService {
  private readonly logger = new Logger(EvidenciaTecnicaService.name);

  constructor(
    @InjectRepository(EvidenciaTecnica)
    private readonly evidenciaRepository: Repository<EvidenciaTecnica>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly imageOptimizerService: ImageOptimizerService,
  ) {}

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
      const isVideo =
        archivo.mimetype.startsWith('video') ||
        ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(
          path.extname(archivo.originalname).toLowerCase(),
        );
      tipoArchivo = isVideo ? 'video' : 'imagen';

      let bufferToUpload = archivo.buffer;

      if (!isVideo) {
        // Optimización inteligente en backend (conversión a WebP, corrección de orientación, eliminación GPS, redimensionamiento adaptativo)
        const optimized = await this.imageOptimizerService.optimize(
          archivo.buffer,
          archivo.originalname,
          archivo.mimetype,
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
        mimeType = archivo.mimetype;
        tamanoBytes = archivo.size;
        const ext = path.extname(archivo.originalname) || '.mp4';
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
      const saved = await this.evidenciaRepository.save(evidencia);
      return await this.resolveSignedUrl(saved);
    } catch (error) {
      // Si falla la BD y se había subido a R2, se limpia el objeto huérfano
      if (storageKey) {
        await this.storageService.deleteFile(storageKey).catch(() => null);
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
  ): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number }> {
    const orden = await this.orderRepository.findOne({ where: { id: dto.ordenId } });
    if (!orden) {
      throw new NotFoundException(`Orden con ID ${dto.ordenId} no encontrada`);
    }

    if (this.isClient(currentUser)) {
      throw new ForbiddenException('Los clientes no pueden subir evidencias técnicas.');
    }

    const ext = path.extname(dto.fileName).toLowerCase() || (dto.mimeType?.startsWith('video') ? '.mp4' : '.jpg');
    const isVideo = (dto.mimeType && dto.mimeType.startsWith('video')) ||
      ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext);
    const resolvedMime = dto.mimeType && dto.mimeType.trim() !== ''
      ? dto.mimeType
      : (isVideo ? 'video/mp4' : 'application/octet-stream');
    const folder = isVideo ? 'videos' : 'imagenes';
    const odsFolder = orden.workOrderNumber ? `ODS-${orden.workOrderNumber}` : `${dto.ordenId}`;
    const storageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${ext}`;

    const presigned = await this.storageService.getPresignedUploadUrl(
      storageKey,
      resolvedMime,
      300, // 5 minutos de validez para iniciar subida
    );

    return presigned;
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

    // Verificar que el objeto exista en Cloudflare R2 y obtener sus metadatos reales
    const realMeta = await this.storageService.getObjectMetadata(dto.storageKey);
    if (!realMeta) {
      throw new BadRequestException('El archivo no fue encontrado en el almacenamiento de Cloudflare R2.');
    }

    const ext = path.extname(dto.storageKey).toLowerCase();
    const isVideo = (dto.mimeType && dto.mimeType.startsWith('video')) ||
      ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext) ||
      dto.storageKey.includes('/videos/');
    const tipoArchivo: 'imagen' | 'video' = isVideo ? 'video' : 'imagen';

    const evidencia = this.evidenciaRepository.create({
      orden,
      subidoPor: usuario,
      estadoOrden: orden.estadoOrden,
      storageKey: dto.storageKey,
      nombreOriginal: dto.nombreOriginal || path.basename(dto.storageKey),
      mimeType: realMeta.mimeType || dto.mimeType || (isVideo ? 'video/mp4' : 'image/webp'),
      tamanoBytes: realMeta.size || dto.tamanoBytes || 0,
      storageProvider: 'r2',
      tipoArchivo,
      descripcion: dto.descripcion,
      archivoUrl: null,
    });

    const saved = await this.evidenciaRepository.save(evidencia);
    return await this.resolveSignedUrl(saved);
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

    if (archivo) {
      const oldStorageKey = evidencia.storageKey;
      const tipoArchivo = archivo.mimetype.startsWith('video') ? 'video' : 'imagen';
      const ext = path.extname(archivo.originalname) || (tipoArchivo === 'video' ? '.mp4' : '.jpg');
      const folder = tipoArchivo === 'video' ? 'videos' : 'imagenes';
      const odsFolder = evidencia.orden.workOrderNumber
        ? `ODS-${evidencia.orden.workOrderNumber}`
        : `${evidencia.orden.id}`;
      const newStorageKey = `ordenes/${odsFolder}/evidencias/${folder}/${uuidv4()}_${Date.now()}${ext}`;

      await this.storageService.uploadFile(newStorageKey, archivo.buffer, archivo.mimetype);

      evidencia.storageKey = newStorageKey;
      evidencia.nombreOriginal = archivo.originalname;
      evidencia.mimeType = archivo.mimetype;
      evidencia.tamanoBytes = archivo.size;
      evidencia.tipoArchivo = tipoArchivo;
      evidencia.storageProvider = 'r2';

      // Eliminar el archivo anterior en R2 si existía
      if (oldStorageKey) {
        await this.storageService.deleteFile(oldStorageKey).catch(() => null);
      }
    }

    if (updateDto.descripcion !== undefined) {
      evidencia.descripcion = updateDto.descripcion;
    }

    try {
      const saved = await this.evidenciaRepository.save(evidencia);
      return await this.resolveSignedUrl(saved);
    } catch (error) {
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

    // Si tiene objeto en R2, se elimina físicamente del bucket
    if (evidencia.storageKey) {
      await this.storageService.deleteFile(evidencia.storageKey).catch(() => null);
    }

    evidencia.deletedAt = new Date();
    await this.evidenciaRepository.save(evidencia);
  }
}